import { supabase } from "./server/db";

async function check() {
    const { data, error } = await supabase.from('users').select('*');
    console.log("Users:", JSON.stringify(data, null, 2));
    if (error) console.error("Error:", error);
}

check();
