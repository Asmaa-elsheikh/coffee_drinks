import pkg from 'pg';
const { Client } = pkg;
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';
dotenv.config();

async function applyMigration() {
    const client = new Client({
        connectionString: process.env.DATABASE_URL,
    });

    try {
        await client.connect();
        console.log("Connected to Supabase.");

        const migrationPath = path.join(process.cwd(), 'migrations', '0001_lush_stature.sql');
        const sql = fs.readFileSync(migrationPath, 'utf8');

        console.log("Applying migration 0001...");
        // Split by statement-breakpoint if needed, but pg can often handle multiple if separated by ;
        const statements = sql.split('--> statement-breakpoint');
        for (let statement of statements) {
            statement = statement.trim();
            if (statement) {
                await client.query(statement);
                console.log("Executed statement.");
            }
        }

        console.log("Migration applied successfully.");
    } catch (err: any) {
        console.error("Migration failed:", err.message);
    } finally {
        await client.end();
    }
}

applyMigration();
