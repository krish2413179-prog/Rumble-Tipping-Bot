import { JsonRpcProvider } from 'ethers';

// Try multiple RPC endpoints
const rpcUrls = [
  'wss://0xrpc.io/sep',
  'https://rpc.sepolia.org',
  'https://sepolia.gateway.tenderly.co',
];

const wallet = '0x1c1F68b0d4724274359C5B55589E65484D23a49a'; // NEW backend wallet

console.log('\n=== Checking Backend Wallet Balance ===');
console.log('Address:', wallet);

for (const rpcUrl of rpcUrls) {
  try {
    console.log(`\nTrying ${rpcUrl}...`);
    const provider = new JsonRpcProvider(rpcUrl, 11155111);
    const balance = await provider.getBalance(wallet);
    const ethBalance = Number(balance) / 1e18;
    
    console.log('ETH Balance:', ethBalance.toFixed(6), 'ETH');
    
    if (ethBalance > 0) {
      console.log('\n✅ Backend wallet is funded and ready!');
      console.log('Can execute approximately', Math.floor(ethBalance / 0.0001), 'transactions');
      break;
    }
  } catch (e) {
    console.log('Error:', e.message);
  }
}
