import "dotenv/config";
import { db } from "./server/db.ts";
import { users } from "./shared/schema.ts";
import { eq } from "drizzle-orm";

async function checkUser() {
  try {
    const [user] = await db.select().from(users).where(eq(users.id, "d8f1b83b-b9cd-4ce9-8f97-cf99301bcbb6"));
    console.log("Registered Doctor Wallet:", user.walletAddress);
  } catch (error) {
    console.error(error);
  } finally {
    process.exit(0);
  }
}
checkUser();
