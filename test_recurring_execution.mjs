import { Wallet, JsonRpcProvider, Contract } from 'ethers';

const RECURRING_CONTRACT = '0x0492b80B68221b84E00cd2dbB6bA14a4E5b1a3Bf';
const RPC_URL = 'https://ethereum-sepolia-rpc.publicnode.com';
const SEED = 'talk toss soda like unlock visual model fluid remind future deliver tragic';

const ABI = [
  'function isPaymentDue(uint256 scheduleId, address user) view returns (bool)',
  'function executePayment(uint256 scheduleId, address user)',
  'function getSchedule(uint256 scheduleId) view returns (address token, address recipient, uint256 amount, uint256 interval, uint256 lastPayment, uint256 maxPayments, uint256 paymentCount, bool active)',
];

async function testRecurringExecution() {
  console.log('\n=== Testing Recurring Payment Execution ===\n');
  
  const provider = new JsonRpcProvider(RPC_URL, 11155111);
  const signer = Wallet.fromPhrase(SEED).connect(provider);
  const contract = new Contract(RECURRING_CONTRACT, ABI, signer);
  
  console.log('Backend Wallet:', await signer.getAddress());
  console.log('ETH Balance:', (await provider.getBalance(await signer.getAddress())).toString());
  
  // Test with schedule ID 0 and user address from context
  const userAddress = '0xE9667C1Dc65c4bacCd3d3988e2198eE6962404a0';
  
  // Check multiple schedule IDs
  for (let scheduleId = 0; scheduleId < 5; scheduleId++) {
    console.log('\n--- Checking Schedule', scheduleId, 'for user', userAddress, '---');
  
  try {
    // Get schedule details
    const schedule = await contract.getSchedule(scheduleId);
    
    // Skip if schedule doesn't exist (all zeros)
    if (schedule[0] === '0x0000000000000000000000000000000000000000') {
      console.log('Schedule does not exist');
      continue;
    }
    
    console.log('Schedule Details:');
    console.log('- Token:', schedule[0]);
    console.log('- Recipient:', schedule[1]);
    console.log('- Amount:', schedule[2].toString());
    console.log('- Interval:', schedule[3].toString(), 'seconds');
    console.log('- Last Payment:', new Date(Number(schedule[4]) * 1000).toLocaleString());
    console.log('- Max Payments:', schedule[5].toString());
    console.log('- Payment Count:', schedule[6].toString());
    console.log('- Active:', schedule[7]);
    
    // Check if payment is due
    const isDue = await contract.isPaymentDue(scheduleId, userAddress);
    console.log('Payment Due:', isDue);
    
    if (isDue) {
      console.log('✅ Payment is due! Backend can execute it.');
      console.log('To execute: Call executePayment(' + scheduleId + ', "' + userAddress + '")');
    } else {
      const nextPaymentTime = Number(schedule[4]) + Number(schedule[3]);
      const now = Math.floor(Date.now() / 1000);
      const secondsUntilDue = nextPaymentTime - now;
      console.log('⏳ Payment not due yet.');
      console.log('Next payment in:', secondsUntilDue, 'seconds (', Math.floor(secondsUntilDue / 60), 'minutes )');
    }
    
  } catch (e) {
    console.error('❌ Error:', e.message);
  }
  }
}

testRecurringExecution().catch(console.error);
