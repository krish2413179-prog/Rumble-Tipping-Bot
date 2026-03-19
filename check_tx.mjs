import { JsonRpcProvider } from 'ethers';

const provider = new JsonRpcProvider('https://ethereum-sepolia-rpc.publicnode.com', 11155111);
const txHash = '0x031e49d3d83f777d6e33fd566ab3e1b855927d0365108e6021af20f17b600e7e';

console.log('Checking transaction:', txHash);

const tx = await provider.getTransaction(txHash);
if (tx) {
  console.log('\nTransaction found:');
  console.log('From:', tx.from);
  console.log('To:', tx.to);
  console.log('Value:', Number(tx.value) / 1e18, 'ETH');
  console.log('Block:', tx.blockNumber);
  
  const receipt = await provider.getTransactionReceipt(txHash);
  if (receipt) {
    console.log('Status:', receipt.status === 1 ? '✅ Success' : '❌ Failed');
    console.log('Gas used:', receipt.gasUsed.toString());
  }
  
  // Check balance of recipient
  const balance = await provider.getBalance(tx.to);
  console.log('\nRecipient balance:', Number(balance) / 1e18, 'ETH');
} else {
  console.log('Transaction not found');
}
