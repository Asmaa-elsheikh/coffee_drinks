import pkg from 'pg';
const { Client } = pkg;
import bcrypt from "bcrypt";
import * as dotenv from "dotenv";
dotenv.config();

const SALT_ROUNDS = 10;

async function postgresSeed() {
    const targetEmail = "asmaali.elsheikh@gmail.com";
    console.log(`Postgres seeding via DATABASE_URL for: ${targetEmail}`);

    const client = new Client({
        connectionString: process.env.DATABASE_URL,
    });

    try {
        await client.connect();
        console.log("Connected to Postgres.");

        const hashedPassword = await bcrypt.hash("password123", SALT_ROUNDS);

        const resCount = await client.query('SELECT count(*) FROM users');
        console.log(`Current Total Users in Postgres: ${resCount.rows[0].count}`);

        // Check if user exists
        const res = await client.query('SELECT id FROM users WHERE email = $1', [targetEmail]);

        if (res.rows.length > 0) {
            console.log(`User found (ID: ${res.rows[0].id}). Updating...`);
            const updateRes = await client.query(
                'UPDATE users SET username = $1, password = $2, role = $3, name = $4 WHERE id = $5',
                ['admin', hashedPassword, 'admin', 'Super Admin', res.rows[0].id]
            );
            console.log(`Update count: ${updateRes.rowCount}`);
        } else {
            console.log("User not found. Inserting...");
            // Check if username 'admin' is taken
            const adminRes = await client.query('SELECT id FROM users WHERE username = $1', ['admin']);
            if (adminRes.rows.length > 0) {
                console.log("Username 'admin' taken. Updating that user...");
                const updateRes = await client.query(
                    'UPDATE users SET email = $1, password = $2, role = $3, name = $4 WHERE id = $5',
                    [targetEmail, hashedPassword, 'admin', 'Super Admin', adminRes.rows[0].id]
                );
                console.log(`Update count: ${updateRes.rowCount}`);
            } else {
                console.log("No admin username found. Inserting new Super Admin...");
                const insertRes = await client.query(
                    'INSERT INTO users (username, email, password, role, name) VALUES ($1, $2, $3, $4, $5)',
                    ['admin', targetEmail, hashedPassword, 'admin', 'Super Admin']
                );
                console.log(`Insert count: ${insertRes.rowCount}`);
            }
        }

        console.log("Postgres seeding SUCCESSFUL.");

    } catch (err: any) {
        console.error("Postgres seeding FAILED!");
        console.error(err.message);
        console.error(err.stack);
    } finally {
        await client.end();
    }
}

postgresSeed();
