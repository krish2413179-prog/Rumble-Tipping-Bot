import { JsonRpcProvider } from 'ethers';

const provider = new JsonRpcProvider('https://ethereum-sepolia-rpc.publicnode.com', 11155111);
const wallet = '0x9858EfFD232B4033E47d90003D41EC34EcaEda94';

console.log('Checking wallet:', wallet);

// Get current balance
const balance = await provider.getBalance(wallet);
console.log('Current balance:', Number(balance) / 1e18, 'ETH');

// Get transaction count (nonce)
const txCount = await provider.getTransactionCount(wallet);
console.log('Transaction count (nonce):', txCount);

if (txCount > 0) {
  console.log('\n⚠️  This wallet has sent', txCount, 'transactions!');
  console.log('The ETH may have been spent already.');
}

// Check latest block
const blockNumber = await provider.getBlockNumber();
console.log('\nLatest block:', blockNumber);
console.log('Transaction was in block: 10450330');
console.log('Blocks since transaction:', blockNumber - 10450330);
