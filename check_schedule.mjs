import { JsonRpcProvider } from 'ethers';

const rpcUrl = 'https://ethereum-sepolia-rpc.publicnode.com';
const provider = new JsonRpcProvider(rpcUrl, 11155111);

const RECURRING_CONTRACT = '0xD81e9690c2196b41345EC63152a59861AcE40Bfc';
const userAddress = '0xE9667C1Dc65c4bacCd3d3988e2198eE6962404a0';

console.log('\n=== Checking Recurring Payment Schedule ===');
console.log('Contract:', RECURRING_CONTRACT);
console.log('User:', userAddress);

// Check schedule 0
const scheduleId = 0;

// getSchedule(uint256) selector: 0x5e52c3d5
const getScheduleSelector = '0x5e52c3d5';
const getScheduleData = getScheduleSelector + scheduleId.toString(16).padStart(64, '0');

try {
  const result = await provider.call({
    to: RECURRING_CONTRACT,
    data: getScheduleData
  });
  
  console.log('\nSchedule 0 raw data:', result);
  
  if (result === '0x') {
    console.log('❌ No schedule found at index 0');
  } else {
    // Parse the result (8 values returned)
    const token = '0x' + result.slice(26, 66);
    const recipient = '0x' + result.slice(90, 130);
    const amount = parseInt(result.slice(130, 194), 16);
    const interval = parseInt(result.slice(194, 258), 16);
    const lastPayment = parseInt(result.slice(258, 322), 16);
    const maxPayments = parseInt(result.slice(322, 386), 16);
    const paymentCount = parseInt(result.slice(386, 450), 16);
    const active = result.slice(450, 514) !== '0'.repeat(64);
    
    console.log('\n✅ Schedule found:');
    console.log('Token:', token);
    console.log('Recipient:', recipient);
    console.log('Amount:', amount / 1e6, 'USDT');
    console.log('Interval:', interval, 'seconds (', interval / 60, 'minutes)');
    console.log('Last Payment:', lastPayment === 0 ? 'Never' : new Date(lastPayment * 1000).toLocaleString());
    console.log('Max Payments:', maxPayments === 0 ? 'Unlimited' : maxPayments);
    console.log('Payment Count:', paymentCount);
    console.log('Active:', active);
    
    // Check if payment is due
    const isDueSelector = '0xeb30b9a7'; // isPaymentDue(uint256,address)
    const isDueData = isDueSelector +
      scheduleId.toString(16).padStart(64, '0') +
      userAddress.slice(2).padStart(64, '0');
    
    const isDueResult = await provider.call({
      to: RECURRING_CONTRACT,
      data: isDueData
    });
    
    const isDue = isDueResult !== '0x0000000000000000000000000000000000000000000000000000000000000000';
    console.log('\nPayment Due:', isDue ? '✅ YES' : '❌ NO');
    
    if (!isDue && lastPayment > 0) {
      const nextPaymentTime = lastPayment + interval;
      const now = Math.floor(Date.now() / 1000);
      const timeUntilNext = nextPaymentTime - now;
      console.log('Next payment in:', timeUntilNext, 'seconds (', Math.floor(timeUntilNext / 60), 'minutes)');
    }
  }
} catch (e) {
  console.error('Error:', e.message);
}
