import { Wallet } from 'ethers';

// Generate a new random wallet
const wallet = Wallet.createRandom();

console.log('\n=== NEW BACKEND WALLET ===');
console.log('\nAddress:', wallet.address);
console.log('\nMnemonic (SAVE THIS SECURELY):');
console.log(wallet.mnemonic.phrase);
console.log('\nPrivate Key (SAVE THIS SECURELY):');
console.log(wallet.privateKey);

console.log('\n=== SETUP INSTRUCTIONS ===');
console.log('1. Create a file: .env.local');
console.log('2. Add this line:');
console.log(`   TETHER_SEED="${wallet.mnemonic.phrase}"`);
console.log('\n3. Send 0.1 ETH to:', wallet.address);
console.log('\n4. Restart the dev server: npm run dev');
console.log('\n⚠️  IMPORTANT: Keep the mnemonic phrase secure and never share it!');
