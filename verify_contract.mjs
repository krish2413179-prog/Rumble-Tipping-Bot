import { JsonRpcProvider } from 'ethers';

const rpcUrl = 'https://ethereum-sepolia-rpc.publicnode.com';
const provider = new JsonRpcProvider(rpcUrl, 11155111);

const RECURRING_CONTRACT = '0xD81e9690c2196b41345EC63152a59861AcE40Bfc';

console.log('\n=== Verifying RecurringPayment Contract ===');
console.log('Address:', RECURRING_CONTRACT);

try {
  // Check if contract exists
  const code = await provider.getCode(RECURRING_CONTRACT);
  
  if (code === '0x') {
    console.log('❌ NO CONTRACT AT THIS ADDRESS!');
    console.log('The contract was not deployed or deployment failed.');
    console.log('\nYou need to deploy the RecurringPayment contract first.');
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
    console.log('Next Schedule ID:', nextId);
    console.log('Total schedules created:', nextId);
  }
} catch (e) {
  console.error('Error:', e.message);
}
