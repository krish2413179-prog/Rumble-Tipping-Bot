import { Wallet, JsonRpcProvider, Contract } from 'ethers';

const RECURRING_CONTRACT = '0x0492b80B68221b84E00cd2dbB6bA14a4E5b1a3Bf';
const RPC_URL = 'https://ethereum-sepolia-rpc.publicnode.com';
const SEED = 'talk toss soda like unlock visual model fluid remind future deliver tragic';

const ABI = [
  'function executePayment(uint256 scheduleId, address user)',
  'function isPaymentDue(uint256 scheduleId, address user) view returns (bool)',
];

async function executePayment() {
  console.log('\n=== Attempting to Execute Payment ===\n');
  
  const provider = new JsonRpcProvider(RPC_URL, 11155111);
  const signer = Wallet.fromPhrase(SEED).connect(provider);
  const contract = new Contract(RECURRING_CONTRACT, ABI, signer);
  
  const scheduleId = 0; // Try schedule 0 (has 7 payments already)
  const userAddress = '0xE9667C1Dc65c4bacCd3d3988e2198eE6962404a0';
  
  console.log('Backend Wallet:', await signer.getAddress());
  console.log('Schedule ID:', scheduleId);
  console.log('User Address:', userAddress);
  
  try {
    // First check if payment is due
    const isDue = await contract.isPaymentDue(scheduleId, userAddress);
    console.log('\nisPaymentDue():', isDue);
    
    if (!isDue) {
      console.log('\n⚠️ Contract says payment is not due, but trying anyway...');
    }
    
    // Try to execute
    console.log('\nSending transaction...');
    const tx = await contract.executePayment(scheduleId, userAddress);
    console.log('Transaction sent:', tx.hash);
    console.log('Waiting for confirmation...');
    
    const receipt = await tx.wait();
    console.log('\n✅ Payment executed successfully!');
    console.log('Gas used:', receipt.gasUsed.toString());
    console.log('Block:', receipt.blockNumber);
    
  } catch (e) {
    console.error('\n❌ Execution failed:', e.message);
    
    if (e.message.includes('Too soon')) {
      console.log('\nThe contract rejected the payment because it\'s "Too soon"');
      console.log('This means the time check is failing even though lastPayment = 0');
    } else if (e.message.includes('Insufficient allowance')) {
      console.log('\nUser needs to approve the contract to spend USDT');
      console.log('User must call: USDT.approve("' + RECURRING_CONTRACT + '", amount)');
    } else if (e.message.includes('Schedule not found')) {
      console.log('\nSchedule does not exist for this user');
    }
  }
}

executePayment().catch(console.error);
