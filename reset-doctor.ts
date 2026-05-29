import "dotenv/config";
import { db } from "./server/db.ts";
import { users } from "./shared/schema.ts";
import { eq } from "drizzle-orm";

async function resetUser() {
  try {
    const userId = "d8f1b83b-b9cd-4ce9-8f97-cf99301bcbb6";
    await db.update(users).set({ isVerified: false }).where(eq(users.id, userId));
    console.log("Success: User set back to unverified. They will appear in the Admin Dashboard again.");
  } catch (error) {
    console.error(error);
  } finally {
    process.exit(0);
  }
}
resetUser();
