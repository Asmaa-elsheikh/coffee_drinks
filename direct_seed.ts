import { supabase } from "./server/db";
import bcrypt from "bcrypt";

const SALT_ROUNDS = 10;

async function directSeed() {
    const targetEmail = "asmaali.elsheikh@gmail.com";
    console.log(`Directly seeding database for: ${targetEmail}`);

    try {
        const hashedPassword = await bcrypt.hash("password123", SALT_ROUNDS);

        const userData = {
            username: "admin",
            email: targetEmail,
            password: hashedPassword,
            role: "admin",
            name: "Super Admin"
        };

        console.log("Inserting user into Supabase...");
        const { data, error } = await supabase.from('users').insert(userData).select().single();

        if (error) {
            console.error("Supabase Error:", error.message);
            if (error.code === '23505') {
                console.log("User already exists. Attempting update...");
                const { data: updateData, error: updateError } = await supabase
                    .from('users')
                    .update(userData)
                    .eq('username', 'admin')
                    .select()
                    .single();

                if (updateError) {
                    console.error("Update Error:", updateError.message);
                } else {
                    console.log("Update successful!");
                }
            }
        } else {
            console.log("Insert successful!");
            console.log("New User ID:", data.id);
        }

    } catch (err: any) {
        console.error("Unexpected Error:", err.message);
        console.error(err.stack);
    }
}

directSeed();
