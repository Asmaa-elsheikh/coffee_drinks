import pkg from 'pg';
const { Client } = pkg;

const projectRef = "dainnwasbsejppsakyrl";
const password = "9&u25Zc3?X&N_&w";
const regions = [
    "eu-central-1", "eu-west-1", "eu-west-2", "eu-west-3", "eu-south-1",
    "us-east-1", "us-east-2", "us-west-1", "us-west-2",
    "ap-southeast-1", "ap-southeast-2", "ap-northeast-1", "ap-northeast-2", "ap-south-1",
    "sa-east-1", "ca-central-1", "me-central-1", "me-south-1", "af-south-1"
];

async function probe() {
    for (const region of regions) {
        const host = `aws-0-${region}.pooler.supabase.com`;
        process.stdout.write(`Region: ${region}... `);
        const client = new Client({
            host: host,
            port: 6543,
            user: `postgres.${projectRef}`,
            password: password,
            database: "postgres",
            connectionTimeoutMillis: 3000,
            ssl: { rejectUnauthorized: false }
        });

        try {
            await client.connect();
            console.log("CONNECT SUCCESS!");
            await client.end();
            return;
        } catch (err: any) {
            console.log(err.message);
            try { await client.end(); } catch (e) { }
        }
    }
}

probe();
