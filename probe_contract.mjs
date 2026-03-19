import { JsonRpcProvider } from 'ethers';

const rpcUrl = 'https://ethereum-sepolia-rpc.publicnode.com';
const provider = new JsonRpcProvider(rpcUrl, 11155111);

const CONTRACT = '0x0492b80B68221b84E00cd2dbB6bA14a4E5b1a3Bf';

console.log('\n=== Probing Contract Functions ===');
console.log('Address:', CONTRACT);

// Common function selectors to try
const selectors = {
  'owner()': '0x8da5cb5b',
  'nextScheduleId()': '0x6d0a2e1e',
  'scheduleCount()': '0x7b929c27',
  'totalSupply()': '0x18160ddd',
  'name()': '0x06fdde03',
  'symbol()': '0x95d89b41',
};

for (const [name, selector] of Object.entries(selectors)) {
  try {
    const result = await provider.call({
      to: CONTRACT,
      data: selector
    });
    
    if (result && result !== '0x') {
      console.log(`✅ ${name}: ${result}`);
      
      // Try to parse as address or uint
      if (result.length === 66) {
        const asUint = parseInt(result, 16);
        const asAddress = '0x' + result.slice(26);
        console.log(`   As uint: ${asUint}`);
        console.log(`   As address: ${asAddress}`);
      }
    }
  } catch (e) {
    console.log(`❌ ${name}: reverted`);
  }
}

console.log('\n=== Trying createSchedule ===');
// Try to estimate gas for createSchedule to see if it exists
const USDT = '0x959Aa5cE0f6A29b00e1C178Fd1e98F2199D444c5';
const RECIPIENT = '0x000000000000000000000000000000000000dEaD';
const createScheduleSelector = '0x13bcdac6';
const amount = BigInt(2000000); // 2 USDT
const interval = 120; // 2 minutes
const maxPayments = 0;

const createScheduleData = createScheduleSelector +
  USDT.slice(2).padStart(64, '0') +
  RECIPIENT.slice(2).padStart(64, '0') +
  amount.toString(16).padStart(64, '0') +
  interval.toString(16).padStart(64, '0') +
  maxPayments.toString(16).padStart(64, '0');

try {
  const gas = await provider.estimateGas({
    to: CONTRACT,
    data: createScheduleData,
    from: '0xE9667C1Dc65c4bacCd3d3988e2198eE6962404a0'
  });
  console.log('✅ createSchedule exists! Estimated gas:', gas.toString());
} catch (e) {
  console.log('❌ createSchedule failed:', e.message.substring(0, 100));
}
