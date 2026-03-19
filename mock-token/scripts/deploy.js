import hre from "hardhat";

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying MockUSDT with account:", deployer.address);
  console.log("Account balance:", (await deployer.provider.getBalance(deployer.address)).toString());

  const MockUSDT = await hre.ethers.getContractFactory("MockUSDT");
  const token = await MockUSDT.deploy();
  await token.waitForDeployment();

  const address = await token.getAddress();
  console.log("MockUSDT deployed to:", address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
