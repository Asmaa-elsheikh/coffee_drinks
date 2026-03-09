import { supabase } from "./server/db";

async function setupDefaultBranch() {
    console.log("Setting up default branch...");

    // 1. Create a branch if none exists
    const { data: bData, error: bError } = await supabase
        .from('branches')
        .insert({ name: "Main Office" })
        .select()
        .single();

    if (bError) {
        console.error("Error creating branch:", bError.message);
        return;
    }

    console.log("Branch created:", bData);

    // 2. Link Super Admin to it
    const { data: uData, error: uError } = await supabase
        .from('users')
        .update({ branch_id: bData.id })
        .eq('email', 'asmaali.elsheikh@gmail.com')
        .select();

    if (uError) {
        console.error("Error linking user to branch:", uError.message);
    } else {
        console.log("User linked to branch:", uData);
    }
}

setupDefaultBranch();
