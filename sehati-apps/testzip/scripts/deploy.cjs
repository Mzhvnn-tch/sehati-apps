const { ethers } = require("hardhat");

async function main() {
  console.log("Deploying SEHATIRegistry contract to Polygon Amoy...");

  const [deployer] = await ethers.getSigners();
  console.log("Deploying with account:", deployer.address);

  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("Account balance:", ethers.formatEther(balance), "POL");

  if (balance === 0n) {
    console.error("ERROR: Deployer account has no POL tokens!");
    console.error("Please fund your wallet with test POL from:");
    console.error("https://faucet.polygon.technology/");
    process.exit(1);
  }

  const SEHATIRegistry = await ethers.getContractFactory("SEHATIRegistry");
  console.log("Deploying contract...");
  
  const registry = await SEHATIRegistry.deploy();
  await registry.waitForDeployment();

  const contractAddress = await registry.getAddress();
  const txHash = registry.deploymentTransaction()?.hash;
  
  console.log("\n========================================");
  console.log("SEHATIRegistry deployed successfully!");
  console.log("Contract Address:", contractAddress);
  console.log("Transaction Hash:", txHash);
  console.log("========================================");
  
  const networkInfo = await ethers.provider.getNetwork();
  console.log("\nNetwork Info:");
  console.log("- Chain ID:", networkInfo.chainId.toString());
  
  console.log("\nPlease add this to your environment variables:");
  console.log(`CONTRACT_ADDRESS=${contractAddress}`);
  console.log("\nView on Polygonscan:");
  console.log(`https://amoy.polygonscan.com/address/${contractAddress}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Deployment failed:", error);
    process.exit(1);
  });
