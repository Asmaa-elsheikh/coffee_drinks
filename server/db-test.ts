import { supabase } from "./db.js";
import "dotenv/config";

async function checkColumns() {
  const { data, error } = await supabase.from('drinks').select('*').limit(1);
  if (error) {
    console.error("Error fetching drinks:", error);
  } else {
    console.log("Drinks columns:", Object.keys(data[0] || {}));
  }
}

checkColumns();
