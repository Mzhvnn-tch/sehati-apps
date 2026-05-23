import "dotenv/config";
import { ethers } from "ethers";
import { db } from "../server/db";
import { users } from "../shared/schema";
import { eq } from "drizzle-orm";
import { SEHATI_REGISTRY_ABI, SEHATI_REGISTRY_ADDRESS } from "../client/src/lib/blockchain";

async function main() {
  const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
  const adminKey = process.env.ADMIN_PRIVATE_KEY;
  if (!adminKey) throw new Error("Missing ADMIN_PRIVATE_KEY");

  const adminWallet = new ethers.Wallet(adminKey, provider);
  console.log("Admin Wallet:", adminWallet.address);

  const pendingDoctors = await db.select().from(users).where(eq(users.isVerified, false));
  console.log(`Found ${pendingDoctors.length} pending doctors in DB.`);

  const contract = new ethers.Contract(SEHATI_REGISTRY_ADDRESS, SEHATI_REGISTRY_ABI, adminWallet);

  for (const doc of pendingDoctors) {
    if (doc.role === "doctor") {
      console.log(`Approving doctor ${doc.name} (${doc.walletAddress})...`);
      try {
        const tx = await contract.registerDoctor(doc.walletAddress);
        console.log("Tx Hash:", tx.hash);
        await tx.wait();
        console.log("Tx confirmed on blockchain!");

        await db.update(users).set({ isVerified: true }).where(eq(users.id, doc.id));
        console.log(`Doctor ${doc.name} verified in database!`);
      } catch (e: any) {
        console.error("Failed to approve:", e.message || e);
      }
    }
  }

  console.log("Done.");
  process.exit(0);
}

main().catch(console.error);
