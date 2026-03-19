import { Wallet, JsonRpcProvider } from 'ethers';

const seed = process.env.TETHER_SEED || 'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about';
const rpcUrl = 'https://ethereum-sepolia-rpc.publicnode.com';

const provider = new JsonRpcProvider(rpcUrl, 11155111);
const wallet = Wallet.fromPhrase(seed).connect(provider);

console.log('\n=== Backend Wallet Status ===');
console.log('Address:', wallet.address);

try {
  const balance = await provider.getBalance(wallet.address);
  const ethBalance = Number(balance) / 1e18;
  
  console.log('ETH Balance:', ethBalance.toFixed(6), 'ETH');
  
  if (ethBalance === 0) {
    console.log('\n❌ PROBLEM: Backend wallet has 0 ETH!');
    console.log('Cannot execute transactions without gas fees.');
    console.log('\nSend at least 0.01 ETH to:', wallet.address);
  } else if (ethBalance < 0.001) {
    console.log('\n⚠️  WARNING: Low balance! May not be enough for multiple transactions.');
  } else {
    console.log('\n✅ Backend wallet is funded and ready!');
  }
} catch (e) {
  console.error('Error checking balance:', e.message);
}
