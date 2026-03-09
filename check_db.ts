import { storage } from "./server/storage";

async function checkUser() {
    const email = "asmaali.elsheikh@gmail.com";
    console.log(`Checking user: ${email}`);
    try {
        const user = await storage.getUserByEmail(email);
        if (user) {
            console.log("User found:");
            console.log(`  ID: ${user.id}`);
            console.log(`  Username: ${user.username}`);
            console.log(`  Email: ${user.email}`);
            console.log(`  Role: ${user.role}`);
            console.log(`  Password hash: ${user.password.substring(0, 10)}...`);
        } else {
            console.log("User NOT found in database.");
        }

        const adminUser = await storage.getUserByUsername("admin");
        if (adminUser) {
            console.log("User with username 'admin' found:");
            console.log(`  Email: ${adminUser.email}`);
        } else {
            console.log("No user with username 'admin' found.");
        }

    } catch (err) {
        console.error("Error during check:", err);
    }
}

checkUser();
