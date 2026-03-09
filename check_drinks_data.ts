import { supabase } from "./server/db";
import * as fs from "fs";

async function checkDrinks() {
    const { data, error } = await supabase.from('drinks').select('*');
    if (error) {
        fs.writeFileSync("drinks_debug.txt", "Error: " + JSON.stringify(error));
        return;
    }
    let output = "Current Drinks in Database:\n";
    data.forEach(d => {
        output += `ID: ${d.id} | Name: ${d.name} | Branch: ${d.branch_id} | Image: ${d.image_url ? 'PRESENT' : 'NULL'} | Deleted: ${d.deleted}\n`;
    });
    fs.writeFileSync("drinks_debug.txt", output);
}

checkDrinks();
