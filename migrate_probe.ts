import pkg from 'pg';
const { Client } = pkg;
import * as fs from 'fs';
import * as path from 'path';

const projectRef = "dainnwasbsejppsakyrl";
const password = "9&u25Zc3?X&N_&w";
const regions = [
    "eu-central-1", "eu-west-1", "eu-west-2", "eu-west-3",
    "us-east-1", "us-east-2", "us-west-1", "us-west-2",
    "ap-southeast-1", "ap-northeast-1", "ap-south-1"
];

async function migrate() {
    console.log("Starting migration probe...");
    const migrationPath = path.join(process.cwd(), 'migrations', '0001_lush_stature.sql');
    const sql = fs.readFileSync(migrationPath, 'utf8');
    const statements = sql.split('--> statement-breakpoint').map(s => s.trim()).filter(s => s);

    for (const region of regions) {
        const host = `aws-0-${region}.pooler.supabase.com`;
        console.log(`Trying region ${region} (${host})...`);

        const client = new Client({
            host: host,
            port: 6543,
            user: `postgres.${projectRef}`,
            password: password,
            database: "postgres",
            connectionTimeoutMillis: 5000,
            ssl: { rejectUnauthorized: false }
        });

        try {
            await client.connect();
            console.log(`Connected to ${region}! Applying migration...`);

            for (const statement of statements) {
                await client.query(statement);
                console.log("Executed statement.");
            }

            console.log("Migration SUCCESSFUL.");
            await client.end();
            return;
        } catch (err: any) {
            console.log(`Failed ${region}: ${err.message}`);
            try { await client.end(); } catch (e) { }
        }
    }
    console.error("All regions failed.");
}

migrate();
