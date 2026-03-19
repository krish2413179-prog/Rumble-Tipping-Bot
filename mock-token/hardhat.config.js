import "@nomicfoundation/hardhat-ethers";
import dotenv from "dotenv";
dotenv.config({ path: "../.env.local" });

export default {
  solidity: "0.8.20",
  networks: {
    sepolia: {
      type: "http",
      url: process.env.SEPOLIA_RPC_URL || "https://ethereum-sepolia-rpc.publicnode.com",
      accounts: process.env.TETHER_SEED ? { mnemonic: process.env.TETHER_SEED } : [],
    }
  }
};
