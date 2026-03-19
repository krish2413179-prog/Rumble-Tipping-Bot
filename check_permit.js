const { ethers } = require('ethers');
const p = new ethers.JsonRpcProvider('https://rpc.sepolia.org');
const c = new ethers.Contract('0x7169D38820dfd117C3FA1f22a697dBA58d90BA06', [
  'function nonces(address) view returns(uint)',
  'function DOMAIN_SEPARATOR() view returns(bytes32)'
], p);

async function check() {
  try {
    const nonce = await c.nonces('0x0000000000000000000000000000000000000001');
    console.log('Nonce:', nonce.toString());
    const ds = await c.DOMAIN_SEPARATOR();
    console.log('Domain Separator:', ds);
  } catch (e) {
    console.log('Error:', e.message);
  }
}
check();
