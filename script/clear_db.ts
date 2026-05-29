import pg from 'pg';
import 'dotenv/config';

const { Pool } = pg;

async function main() {
  const connectionString = process.env.DATABASE_URL;
  
  if (!connectionString) {
    console.error("DATABASE_URL is not set");
    process.exit(1);
  }

  const pool = new Pool({ connectionString });

  console.log("Truncating all tables...");

  try {
    await pool.query('TRUNCATE TABLE audit_logs CASCADE;');
    await pool.query('TRUNCATE TABLE access_grants CASCADE;');
    await pool.query('TRUNCATE TABLE medical_records CASCADE;');
    await pool.query('TRUNCATE TABLE users CASCADE;');
    
    console.log("Successfully cleared all data from the database.");
  } catch (error) {
    console.error("Failed to clear database:", error);
  } finally {
    await pool.end();
  }
}

main();
