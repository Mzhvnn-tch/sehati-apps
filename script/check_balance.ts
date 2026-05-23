import "dotenv/config";
import { ethers } from "ethers";

async function main() {
  const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
  const adminKey = process.env.ADMIN_PRIVATE_KEY;
  if (!adminKey) throw new Error("Missing ADMIN_PRIVATE_KEY");

  const adminWallet = new ethers.Wallet(adminKey, provider);
  const balance = await provider.getBalance(adminWallet.address);
  console.log("Admin Wallet:", adminWallet.address);
  console.log("Admin Balance:", ethers.formatEther(balance), "LSK");

  process.exit(0);
}

main().catch(console.error);
