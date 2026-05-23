const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying contracts with the account:", deployer.address);
  
  const balance = await deployer.provider.getBalance(deployer.address);
  console.log("Account balance:", hre.ethers.formatEther(balance));

  // The contract name might be SEHATIRegistry
  const Contract = await hre.ethers.getContractFactory("SEHATIRegistry");
  const contract = await Contract.deploy();
  await contract.waitForDeployment();

  const address = await contract.getAddress();
  console.log("SEHATIRegistry deployed to:", address);
  console.log("\nMake sure to update CONTRACT_ADDRESS in your .env file to:", address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
