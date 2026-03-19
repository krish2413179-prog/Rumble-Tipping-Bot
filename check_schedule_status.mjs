import { JsonRpcProvider } from 'ethers';

const rpcUrl = 'https://ethereum-sepolia-rpc.publicnode.com';
const provider = new JsonRpcProvider(rpcUrl, 11155111);

const RECURRING_CONTRACT = '0x0492b80B68221b84E00cd2dbB6bA14a4E5b1a3Bf';
const userAddress = '0xE9667C1Dc65c4bacCd3d3988e2198eE6962404a0';

console.log('\n=== Checking Recurring Payment Schedule ===');
console.log('Contract:', RECURRING_CONTRACT);
console.log('User:', userAddress);

// Check schedules 0-5
for (let scheduleId = 0; scheduleId < 6; scheduleId++) {
  console.log(`\n--- Schedule ${scheduleId} ---`);
  
  const getScheduleSelector = '0x5e52c3d5';
  const getScheduleData = getScheduleSelector + scheduleId.toString(16).padStart(64, '0');

  try {
    const result = await provider.call({
      to: RECURRING_CONTRACT,
      data: getScheduleData
    });
    
    if (result === '0x' || result.length < 514) {
      console.log('❌ No schedule found');
      continue;
    }
    
    // Parse the result
    const token = '0x' + result.slice(26, 66);
    const recipient = '0x' + result.slice(90, 130);
    const amount = parseInt(result.slice(130, 194), 16);
    const interval = parseInt(result.slice(194, 258), 16);
    const lastPayment = parseInt(result.slice(258, 322), 16);
    const paymentCount = parseInt(result.slice(386, 450), 16);
    const active = result.slice(450, 514) !== '0'.repeat(64);
    
    console.log('✅ Schedule exists!');
    console.log('Amount:', amount / 1e6, 'USDT');
    console.log('Interval:', interval, 'seconds (', interval / 60, 'minutes)');
    console.log('Last Payment:', lastPayment === 0 ? 'Never' : new Date(lastPayment * 1000).toLocaleString());
    console.log('Payment Count:', paymentCount);
    console.log('Active:', active);
    
    // Check if payment is due
    const isDueSelector = '0xeb30b9a7';
    const isDueData = isDueSelector +
      scheduleId.toString(16).padStart(64, '0') +
      userAddress.slice(2).padStart(64, '0');
    
    const isDueResult = await provider.call({
      to: RECURRING_CONTRACT,
      data: isDueData
    });
    
    const isDue = isDueResult !== '0x0000000000000000000000000000000000000000000000000000000000000000';
    console.log('Payment Due:', isDue ? '✅ YES - READY TO EXECUTE' : '❌ NO - Too soon');
    
    if (!isDue && lastPayment > 0) {
      const now = Math.floor(Date.now() / 1000);
      const nextPaymentTime = lastPayment + interval;
      const timeUntilNext = nextPaymentTime - now;
      console.log('Next payment in:', timeUntilNext, 'seconds (', Math.floor(timeUntilNext / 60), 'minutes)');
    }
  } catch (e) {
    console.log('Error:', e.message.substring(0, 80));
  }
}

// Check backend wallet
console.log('\n=== Backend Wallet Status ===');
const backendWallet = '0x1c1F68b0d4724274359C5B55589E65484D23a49a';
const balance = await provider.getBalance(backendWallet);
const txCount = await provider.getTransactionCount(backendWallet);
console.log('Address:', backendWallet);
console.log('Balance:', Number(balance) / 1e18, 'ETH');
console.log('Transactions sent:', txCount);
