import { supabase } from "./server/db";

async function checkTables() {
    const { data, error } = await supabase.from('branches').select('id').limit(1);
    if (error) {
        console.error("Error accessing 'branches' table:", error.message);
        const { data: data2, error: error2 } = await supabase.from('companies').select('id').limit(1);
        if (error2) {
            console.error("Error accessing 'companies' table:", error2.message);
        } else {
            console.log("'companies' table exists.");
        }
    } else {
        console.log("'branches' table exists.");
    }
}

checkTables();
