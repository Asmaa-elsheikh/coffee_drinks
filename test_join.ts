import { supabase } from "./server/db";

async function check() {
    const { data, error } = await supabase.from('orders').select(`
    *,
    user:user_id(*),
    drink:drink_id(*)
  `).limit(1);
    console.log("Data:", JSON.stringify(data, null, 2));
    console.log("Error:", error);
}

check();
