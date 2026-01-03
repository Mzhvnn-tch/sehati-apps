import "dotenv/config";
import { pool } from "../server/db";

async function resetDb() {
    const client = await pool.connect();
    try {
        console.log("Resetting database...");
        // Truncate all tables. CASCADE ensures all foreign key references are cleared too.
        await client.query("TRUNCATE TABLE users, medical_records, access_grants, audit_logs CASCADE");
        console.log("Database successfully reset!");
    } catch (err) {
        console.error("Error resetting database:", err);
        process.exit(1);
    } finally {
        client.release();
        pool.end();
    }
}

resetDb();
