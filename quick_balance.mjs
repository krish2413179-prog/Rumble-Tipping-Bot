import { JsonRpcProvider } from 'ethers';

const provider = new JsonRpcProvider('https://ethereum-sepolia-rpc.publicnode.com', 11155111);
const wallet = '0x9858EfFD232B4033E47d90003D41EC34EcaEda94';

const balance = await provider.getBalance(wallet);
const ethBalance = Number(balance) / 1e18;

console.log('Backend Wallet:', wallet);
console.log('Balance:', ethBalance, 'ETH');

if (ethBalance > 0) {
  console.log('✅ FUNDED! Ready to execute payments.');
} else {
  console.log('❌ Still 0 ETH. Transaction may not be confirmed yet.');
}
