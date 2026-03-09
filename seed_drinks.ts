import { supabase } from "./server/db";

async function seedDrinks() {
    console.log("Seeding drinks into database...");
    const drinksList = [
        { name: "Tea", category: "Tea", preparation_time: 3, is_available: true, description: "Classic hot tea" },
        { name: "Turkish Coffee", category: "Coffee", preparation_time: 5, is_available: true, description: "Traditional Turkish coffee" },
        { name: "French Coffee", category: "Coffee", preparation_time: 5, is_available: true, description: "Smooth French press coffee" },
        { name: "Nescafe", category: "Coffee", preparation_time: 2, is_available: true, description: "Quick instant coffee" },
        { name: "Espresso", category: "Coffee", preparation_time: 2, is_available: true, description: "Strong single shot" },
        { name: "Herbs", category: "Tea", preparation_time: 4, is_available: true, description: "Assorted herbal infusion" }
    ];

    for (const d of drinksList) {
        const { data, error } = await supabase.from('drinks').insert(d).select();
        if (error) {
            console.error(`Failed to insert ${d.name}:`, error.message);
        } else {
            console.log(`Inserted: ${d.name}`);
        }
    }
}

seedDrinks();
