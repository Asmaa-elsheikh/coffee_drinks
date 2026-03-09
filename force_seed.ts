import { storage } from "./server/storage";
import bcrypt from "bcrypt";

const SALT_ROUNDS = 10;

async function forceSeed() {
    const targetEmail = "asmaali.elsheikh@gmail.com";
    console.log(`Force seeding database for: ${targetEmail}`);

    try {
        const hashedPassword = await bcrypt.hash("password123", SALT_ROUNDS);

        // Check if user exists by email
        let user = await storage.getUserByEmail(targetEmail);

        if (user) {
            console.log(`User found (ID: ${user.id}). Updating to Super Admin...`);
            await storage.updateUser(user.id, {
                username: "admin",
                password: "password123", // updateUser handles hashing
                role: "admin",
                name: "Super Admin"
            });
        } else {
            console.log(`User not found. Creating new Super Admin...`);
            // Check if username 'admin' is taken
            const userByUsername = await storage.getUserByUsername("admin");
            if (userByUsername) {
                console.log(`Username 'admin' taken by ${userByUsername.email}. Deleting/Replacing...`);
                // We can't easily delete with storage API without deleteUser
                // Let's just update that user
                await storage.updateUser(userByUsername.id, {
                    email: targetEmail,
                    password: "password123",
                    role: "admin",
                    name: "Super Admin"
                });
            } else {
                await storage.createUser({
                    username: "admin",
                    email: targetEmail,
                    password: "password123",
                    role: "admin",
                    name: "Super Admin"
                });
            }
        }
        console.log("Force seeding SUCCESSFUL.");

        // Check again
        const finalUser = await storage.getUserByEmail(targetEmail);
        console.log(`Final Database State: Email=${finalUser?.email}, Username=${finalUser?.username}, Role=${finalUser?.role}`);

    } catch (err: any) {
        console.error("Force seeding FAILED!");
        console.error("Error Message:", err.message);
        console.error("Error Stack:", err.stack);
        if (err.details) console.error("Error Details:", err.details);
    }
}

forceSeed();
