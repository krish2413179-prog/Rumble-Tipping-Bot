import { Wallet } from 'ethers';

// Get backend wallet address from seed phrase
const seed = process.env.TETHER_SEED || 'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about';
const wallet = Wallet.fromPhrase(seed);

console.log('\n=== Backend Wallet Info ===');
console.log('Address:', wallet.address);
console.log('\nThis wallet needs Sepolia ETH to pay gas fees for executing recurring payments.');
console.log('\nGet free Sepolia ETH from:');
console.log('- https://sepoliafaucet.com/');
console.log('- https://www.alchemy.com/faucets/ethereum-sepolia');
console.log('- https://faucet.quicknode.com/ethereum/sepolia');
console.log('\nOr send from your funded wallet:', '0xE9667C1Dc65c4bacCd3d3988e2198eE6962404a0');
console.log('(You have 0.1128 ETH available)');
console.log('\n');
