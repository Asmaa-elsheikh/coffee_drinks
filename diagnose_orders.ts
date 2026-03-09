import { supabase } from "./server/db";

async function check() {
    const { data: oData, error: oError } = await supabase.from('orders').select('*, user:user_id(email), drink:drink_id(name)').order('created_at', { ascending: false }).limit(5);
    console.log("Recent Orders:", JSON.stringify(oData, null, 2));
    if (oError) console.error("Error:", oError);
}

check();
