import fs from 'fs';
import { JsonRpcProvider, Wallet, ContractFactory } from 'ethers';
import dotenv from 'dotenv';
dotenv.config({ path: '../.env.local' });

async function main() {
  const provider = new JsonRpcProvider(process.env.SEPOLIA_RPC_URL || "https://ethereum-sepolia-rpc.publicnode.com");
  const wallet = Wallet.fromPhrase(process.env.TETHER_SEED).connect(provider);
  
  console.log("Deploying MockUSDT with account:", wallet.address);
  
  const artifactPath = "./artifacts/contracts/MockUSDT.sol/MockUSDT.json";
  const { abi, bytecode } = JSON.parse(fs.readFileSync(artifactPath, "utf8"));
  
  const factory = new ContractFactory(abi, bytecode, wallet);
  const contract = await factory.deploy();
  await contract.waitForDeployment();
  
  const address = await contract.getAddress();
  console.log("MockUSDT deployed to:", address);
}

main().catch(console.error);
