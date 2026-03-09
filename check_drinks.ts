import { supabase } from "./server/db";

async function check() {
    const { data: dData, error: dError } = await supabase.from('drinks').select('*');
    console.log("Drinks:", dData, dError);
}

check();
