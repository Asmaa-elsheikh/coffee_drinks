import { supabase } from "./server/db";
import { toCamel } from "./server/storage";

async function checkUser() {
    const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', 'asmaali.elsheikh@gmail.com')
        .single();

    if (error) {
        console.error("Error fetching user:", error);
        return;
    }

    console.log("Super Admin Record from DB:", toCamel(data));
}

checkUser();
