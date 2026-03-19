import 'dotenv/config';

// Load env explicitly
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import WalletManagerBtc from '@tetherto/wdk-wallet-btc';

(async () => {
  const seed = process.env.TETHER_SEED;
  if (!seed) {
    console.error('❌ TETHER_SEED not found in .env.local');
    process.exit(1);
  }

  console.log('🔑 Using seed from .env.local:', seed.substring(0, 15) + '...');
  const manager = new WalletManagerBtc(seed, { network: 'testnet' });

  console.log('📱 Getting account...');
  const account = await manager.getAccount(0);

  const address = await account.getAddress();
  console.log('✅ Address:', address);

  console.log('💰 Fetching balance...');
  try {
    const sats = await account.getBalance();
    const btc = Number(sats) / 1e8;
    console.log(`✅ Balance: ${sats} sats = ${btc} BTC`);
  } catch (e) {
    console.error('❌ Error fetching balance:', e);
  }

  process.exit(0);
})();
