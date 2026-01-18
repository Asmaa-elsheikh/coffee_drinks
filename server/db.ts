import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "@shared/schema";

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

export const pool = new Pool({ connectionString: process.env.DATABASE_URL });
export const db = drizzle(pool, { schema });

// Seed initial drinks if menu is empty
async function seedMenu() {
  const currentDrinks = await db.select().from(schema.drinks);
  if (currentDrinks.length === 0) {
    const initialDrinks = [
      { name: "Tea", description: "Freshly brewed tea", category: "Hot", price: 0, image: "https://images.unsplash.com/photo-1544787210-2213d84ad260?auto=format&fit=crop&q=80&w=400" },
      { name: "Turkish Coffee", description: "Traditional Turkish coffee", category: "Hot", price: 0, image: "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&q=80&w=400" },
      { name: "French Coffee", description: "Smooth French coffee", category: "Hot", price: 0, image: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&q=80&w=400" },
      { name: "Nescafe", description: "Classic instant coffee", category: "Hot", price: 0, image: "https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?auto=format&fit=crop&q=80&w=400" },
      { name: "Espresso", description: "Strong black coffee shot", category: "Hot", price: 0, image: "https://images.unsplash.com/photo-1510591509098-f4fdc6d0ff04?auto=format&fit=crop&q=80&w=400" },
      { name: "Herbs", description: "Assorted herbal drink", category: "Hot", price: 0, image: "https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&q=80&w=400" }
    ];
    await db.insert(schema.drinks).values(initialDrinks);
    console.log("Menu seeded successfully");
  }
}

seedMenu().catch(console.error);
