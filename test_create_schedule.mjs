import { Wallet, JsonRpcProvider, Contract } from 'ethers';

const rpcUrl = 'https://ethereum-sepolia-rpc.publicnode.com';
const provider = new JsonRpcProvider(rpcUrl, 11155111);

// Use your wallet
const privateKey = process.env.PRIVATE_KEY; // You'll need to set this
if (!privateKey) {
  console.log('❌ Set PRIVATE_KEY environment variable');
  console.log('Example: export PRIVATE_KEY=0x...');
  process.exit(1);
}

const wallet = new Wallet(privateKey, provider);

const RECURRING_CONTRACT = '0xD81e9690c2196b41345EC63152a59861AcE40Bfc';
const USDT = '0x959Aa5cE0f6A29b00e1C178Fd1e98F2199D444c5';
const RECIPIENT = '0x000000000000000000000000000000000000dEaD';

const ABI = [
  'function createSchedule(address token, address recipient, uint256 amount, uint256 interval, uint256 maxPayments) returns (uint256)',
  'function nextScheduleId() view returns (uint256)',
  'function getSchedule(uint256 scheduleId) view returns (address token, address recipient, uint256 amount, uint256 interval, uint256 lastPayment, uint256 maxPayments, uint256 paymentCount, bool active)'
];

console.log('\n=== Testing RecurringPayment Contract ===');
console.log('Wallet:', wallet.address);
console.log('Contract:', RECURRING_CONTRACT);

const contract = new Contract(RECURRING_CONTRACT, ABI, wallet);

try {
  // Try to read nextScheduleId
  console.log('\nReading nextScheduleId...');
  const nextId = await contract.nextScheduleId();
  console.log('Next Schedule ID:', nextId.toString());
  
  // Try to create a schedule
  console.log('\nCreating test schedule...');
  console.log('Token:', USDT);
  console.log('Recipient:', RECIPIENT);
  console.log('Amount: 2 USDT');
  console.log('Interval: 120 seconds (2 minutes)');
  
  const tx = await contract.createSchedule(
    USDT,
    RECIPIENT,
    2000000, // 2 USDT (6 decimals)
    120, // 2 minutes
    0 // unlimited
  );
  
  console.log('Transaction sent:', tx.hash);
  console.log('Waiting for confirmation...');
  
  const receipt = await tx.wait();
  console.log('✅ Transaction confirmed!');
  console.log('Gas used:', receipt.gasUsed.toString());
  
  // Read the new schedule
  const newNextId = await contract.nextScheduleId();
  console.log('New nextScheduleId:', newNextId.toString());
  
} catch (e) {
  console.error('❌ Error:', e.message);
  if (e.data) {
    console.error('Error data:', e.data);
  }
}
