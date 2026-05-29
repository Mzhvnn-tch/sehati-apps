import { pool } from "./server/db.ts";

async function alterTable() {
  try {
    console.log("Altering access_grants table...");
    await pool.query('ALTER TABLE access_grants ADD COLUMN max_uses INTEGER NOT NULL DEFAULT 3;');
    console.log("Success! Column max_uses added.");
  } catch (error) {
    if (error.code === '42701') {
       console.log("Column max_uses already exists. Skipping.");
    } else {
       console.error("Error altering table:", error);
    }
  } finally {
    process.exit(0);
  }
}

alterTable();
