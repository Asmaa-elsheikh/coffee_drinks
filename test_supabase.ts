import { supabase } from "./server/db";

async function testSupabase() {
    console.log("Testing Supabase connection...");
    try {
        const { data, error } = await supabase.from('users').select('count', { count: 'exact', head: true });
        if (error) {
            console.error("Supabase Error:", error.message);
            console.error("Full Error:", JSON.stringify(error, null, 2));
        } else {
            console.log("Connection successful!");
            console.log("User count:", data);
        }

        // List all users
        const { data: users, error: userError } = await supabase.from('users').select('id, username, email, role');
        if (userError) {
            console.error("Error fetching users:", userError.message);
        } else {
            console.log("Users in DB:", users);
        }

    } catch (err: any) {
        console.error("Unexpected Error:", err.message);
        console.error(err.stack);
    }
}

testSupabase();
