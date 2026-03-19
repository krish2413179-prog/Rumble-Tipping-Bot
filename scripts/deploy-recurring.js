const { ethers } = require('ethers');
const fs = require('fs');
const path = require('path');

async function main() {
  // Sepolia RPC
  const provider = new ethers.JsonRpcProvider('https://rpc.sepolia.org');
  
  // Load wallet from seed phrase (use your TETHER_SEED from .env.local)
  const seed = process.env.TETHER_SEED || 'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about';
  const wallet = ethers.Wallet.fromPhrase(seed).connect(provider);
  
  console.log('Deploying RecurringPayment contract...');
  console.log('Deployer address:', wallet.address);
  
  // Get balance
  const balance = await provider.getBalance(wallet.address);
  console.log('Balance:', ethers.formatEther(balance), 'ETH');
  
  if (balance === 0n) {
    console.error('ERROR: No ETH balance. Get Sepolia ETH from https://sepoliafaucet.com/');
    process.exit(1);
  }
  
  // Read contract source
  const contractPath = path.join(__dirname, '../contracts/RecurringPayment.sol');
  const source = fs.readFileSync(contractPath, 'utf8');
  
  // Compile contract (requires solc)
  const solc = require('solc');
  const input = {
    language: 'Solidity',
    sources: { 'RecurringPayment.sol': { content: source } },
    settings: { outputSelection: { '*': { '*': ['abi', 'evm.bytecode'] } } }
  };

  const output = JSON.parse(solc.compile(JSON.stringify(input)));
  
  if (output.errors) {
    output.errors.forEach(err => console.error(err.formattedMessage));
    if (output.errors.some(e => e.severity === 'error')) process.exit(1);
  }
  
  const contract = output.contracts['RecurringPayment.sol']['RecurringPayment'];
  const abi = contract.abi;
  const bytecode = contract.evm.bytecode.object;
  
  // Deploy
  const factory = new ethers.ContractFactory(abi, bytecode, wallet);
  const deployTx = await factory.deploy();
  
  console.log('Transaction hash:', deployTx.deploymentTransaction().hash);
  console.log('Waiting for confirmation...');
  
  await deployTx.waitForDeployment();
  const address = await deployTx.getAddress();
  
  console.log('\n✅ RecurringPayment deployed to:', address);
  console.log('Owner:', wallet.address);
  console.log('\nSave this address to your .env.local:');
  console.log(`RECURRING_PAYMENT_CONTRACT=${address}`);
  
  // Save ABI
  fs.writeFileSync(
    path.join(__dirname, '../contracts/RecurringPayment.json'),
    JSON.stringify({ address, abi }, null, 2)
  );
  console.log('\nABI saved to contracts/RecurringPayment.json');
}

main().catch(console.error);
