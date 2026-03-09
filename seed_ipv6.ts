import pkg from 'pg';
const { Client } = pkg;
import bcrypt from "bcrypt";
import * as dotenv from "dotenv";
dotenv.config();

const SALT_ROUNDS = 10;

async function ipv6Seed() {
    const targetEmail = "asmaali.elsheikh@gmail.com";
    // The IPv6 we got earlier
    const host = "2a05:d014:1c06:5f16:4a68:61e9:d42a:faf9";
    const password = "9&u25Zc3?X&N_&w";

    console.log(`Attempting to seed via IPv6 [${host}] for: ${targetEmail}`);

    const client = new Client({
        host: host,
        port: 5432,
        user: "postgres",
        password: password,
        database: "postgres",
        connectionTimeoutMillis: 10000
    });

    try {
        await client.connect();
        console.log("SUCCESS! Connected via IPv6.");

        const hashedPassword = await bcrypt.hash("password123", SALT_ROUNDS);

        const res = await client.query(
            'INSERT INTO users (username, email, password, role, name) VALUES ($1, $2, $3, $4, $5) ON CONFLICT (email) DO UPDATE SET password = $2, role = $3, name = $4 RETURNING id',
            ['admin', targetEmail, hashedPassword, 'admin', 'Super Admin']
        );

        console.log(`Seeding SUCCESSFUL. User ID: ${res.rows[0].id}`);

    } catch (err: any) {
        console.error("FAILED!");
        console.error("Error Message:", err.message);
        if (err.code) console.error("Error Code:", err.code);
    } finally {
        await client.end();
    }
}

ipv6Seed();
