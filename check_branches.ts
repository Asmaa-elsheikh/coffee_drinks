import { supabase } from "./server/db";

async function checkBranches() {
    const { data, error } = await supabase.from('branches').select('*');
    if (error) {
        console.error("Error fetching branches:", error);
    } else {
        console.log("Existing Branches:", data);
    }
}

checkBranches();
