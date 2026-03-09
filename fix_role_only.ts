import { supabase } from "./server/db";

async function fixSuperAdminRole() {
    console.log("Fixing Super Admin account role only...");
    const { data, error } = await supabase
        .from('users')
        .update({
            role: 'superadmin'
        })
        .eq('email', 'asmaali.elsheikh@gmail.com')
        .select();

    if (error) {
        console.error("Error fixing role:", error.message);
    } else {
        console.log("Super Admin role fixed successfully:", data);
    }
}

fixSuperAdminRole();
