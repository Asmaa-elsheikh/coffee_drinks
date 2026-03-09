import { supabase } from "./server/db";

async function fixSuperAdmin() {
    console.log("Fixing Super Admin account...");
    const { data, error } = await supabase
        .from('users')
        .update({
            role: 'superadmin',
            name: 'Super Admin',
            branch_id: 1 // Link to the default "Main Office" branch
        })
        .eq('email', 'asmaali.elsheikh@gmail.com')
        .select();

    if (error) {
        console.error("Error fixing user:", error);
    } else {
        console.log("Super Admin fixed successfully:", data);
    }
}

fixSuperAdmin();
