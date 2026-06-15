import { db } from './db.js';
import { users } from '../shared/schema.js';
async function run() {
  const allUsers = await db.select().from(users);
  console.log(JSON.stringify(allUsers, null, 2));
  process.exit(0);
}
run();
