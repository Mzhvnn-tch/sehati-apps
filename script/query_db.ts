import "dotenv/config";
import { db } from "../server/db";
import { users } from "../shared/schema";

async function main() {
  const allUsers = await db.select().from(users);
  console.log("ALL USERS IN DATABASE:");
  console.table(allUsers.map(u => ({
    name: u.name,
    role: u.role,
    isVerified: u.isVerified,
    wallet: u.walletAddress.slice(0, 10) + "..."
  })));
  process.exit(0);
}

main().catch(console.error);
