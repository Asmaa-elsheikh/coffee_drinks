import pg from 'pg';
import 'dotenv/config';

async function updateSchema() {
  if (!process.env.DATABASE_URL) {
    console.error("DATABASE_URL is missing.");
    return;
  }
  const client = new pg.Client(process.env.DATABASE_URL);
  await client.connect();
  console.log("Connected to PostgreSQL.");
  try {
    // Add calories column to drinks
    await client.query("ALTER TABLE drinks ADD COLUMN IF NOT EXISTS calories INTEGER;");
    console.log("Column 'calories' ensured in drinks table.");
    
    // Also ensuring it's not null for existing drinks by seeding them shortly after this script runs
  } catch (err) {
    console.error("Migration error:", err);
  } finally {
    await client.end();
  }
}

updateSchema();
