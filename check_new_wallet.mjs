import { JsonRpcProvider } from 'ethers';

const provider = new JsonRpcProvider('https://ethereum-sepolia-rpc.publicnode.com', 11155111);
const wallet = '0x1c1F68b0d4724274359C5B55589E65484D23a49a';

console.log('\n=== NEW Backend Wallet Status ===');
console.log('Address:', wallet);

const balance = await provider.getBalance(wallet);
const ethBalance = Number(balance) / 1e18;

console.log('Balance:', ethBalance, 'ETH');

const txCount = await provider.getTransactionCount(wallet);
console.log('Transactions sent:', txCount);

if (ethBalance > 0) {
  console.log('\n✅ FUNDED! Backend is ready to execute recurring payments.');
  console.log('Estimated executions possible:', Math.floor(ethBalance / 0.0001));
} else {
  console.log('\n❌ Not funded yet. Waiting for transaction confirmation...');
}
