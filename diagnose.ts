import { supabase } from "./server/db";

async function check() {
    const { data: bData, error: bError } = await supabase.from('branches').select('*');
    console.log("Branches:", bData, bError);

    const { data: uData, error: uError } = await supabase.from('users').select('email, role, branch_id');
    console.log("Users:", uData, uError);
}

check();
