import { JsonRpcProvider } from 'ethers';

const rpcUrl = 'https://ethereum-sepolia-rpc.publicnode.com';
const provider = new JsonRpcProvider(rpcUrl, 11155111);

const RECURRING_CONTRACT = '0x0492b80B68221b84E00cd2dbB6bA14a4E5b1a3Bf';

console.log('\n=== Verifying New RecurringPayment Contract ===');
console.log('Address:', RECURRING_CONTRACT);

try {
  // Check if contract exists
  const code = await provider.getCode(RECURRING_CONTRACT);
  
  if (code === '0x') {
    console.log('❌ NO CONTRACT AT THIS ADDRESS!');
  } else {
    console.log('✅ Contract exists!');
    console.log('Bytecode length:', code.length, 'characters');
    
    // Try to call nextScheduleId (public variable)
    // nextScheduleId() selector: 0x6d0a2e1e
    const nextIdData = '0x6d0a2e1e';
    const result = await provider.call({
      to: RECURRING_CONTRACT,
      data: nextIdData
    });
    
    const nextId = parseInt(result, 16);
    console.log('✅ Next Schedule ID:', nextId);
    console.log('Total schedules created:', nextId);
    
    if (nextId === 0) {
      console.log('\n📝 Contract is fresh and ready to use!');
    }
  }
} catch (e) {
  console.error('❌ Error:', e.message);
}
