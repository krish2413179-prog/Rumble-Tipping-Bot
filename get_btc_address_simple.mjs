import 'dotenv/config';
import WdkManager from '@tetherto/wdk';
import WalletManagerBtc from '@tetherto/wdk-wallet-btc';

async function getBtcAddress() {
  try {
    // Get seed from env or generate new one
    let seed = process.env.TETHER_SEED;
    if (!seed || seed.trim() === '') {
      console.log('⚠️  No TETHER_SEED found in .env.local - generating new seed');
      seed = WdkManager.getRandomSeedPhrase();
      console.log('\n🔑 SAVE THIS SEED PHRASE TO .env.local:');
      console.log(`TETHER_SEED="${seed}"`);
      console.log('\n⚠️  Important: Save this seed phrase to keep the same wallet!\n');
    } else {
      console.log('✓ Using existing TETHER_SEED from .env.local\n');
    }

    // Initialize WDK with Bitcoin testnet
    const wdk = new WdkManager(seed);
    wdk.registerWallet('bitcoin', WalletManagerBtc, {
      network: 'testnet',
      provider: 'https://blockstream.info/testnet/api'
    });

    // Get Bitcoin account
    const account = await wdk.getAccount('bitcoin');
    const address = account.address;

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🪙  BITCOIN TESTNET WALLET ADDRESS');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`\n${address}\n`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('\n💰 Fund this address using a Bitcoin testnet faucet:');
    console.log('   • https://coinfaucet.eu/en/btc-testnet/');
    console.log('   • https://testnet-faucet.mempool.co/');
    console.log('   • https://bitcoinfaucet.uo1.net/');
    console.log('\n📋 Copy this address and paste it into any faucet above');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // Try to get balance
    try {
      const balance = await account.getBalance();
      const btcBalance = Number(balance) / 100_000_000;
      console.log(`Current Balance: ${btcBalance.toFixed(8)} BTC (${balance.toString()} satoshis)\n`);
    } catch (e) {
      console.log('Balance: 0.00000000 BTC (not yet funded)\n');
    }

  } catch (error) {
    console.error('Error:', error.message);
    console.error(error);
    process.exit(1);
  }
}

getBtcAddress();
