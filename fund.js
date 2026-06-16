const { ethers } = require("ethers");
require("dotenv").config();
async function main() {
  const provider = new ethers.JsonRpcProvider(process.env.SEPOLIA_RPC_URL);
  const wallet = new ethers.Wallet(process.env.ADMIN_PRIVATE_KEY, provider);
  const target = "0x493c9a4f9f9d7d758194181adb449b34aa4a823a";
  
  console.log("Admin balance:", ethers.formatEther(await provider.getBalance(wallet.address)));
  
  console.log(`Sending 0.05 ETH to ${target}...`);
  const tx = await wallet.sendTransaction({
    to: target,
    value: ethers.parseEther("0.05")
  });
  console.log("Tx hash:", tx.hash);
  await tx.wait();
  console.log("Sent successfully.");
}
main().catch(console.error);
