import { storage } from "./server/storage";
import { supabase } from "./server/db";

async function hierarchicalSeed() {
    console.log("Running HIERARCHICAL database seeding...");

    const superAdminEmail = "asmaali.elsheikh@gmail.com";

    try {
        // 1. Default Company
        let companies = await storage.getCompanies();
        let defaultCompany;
        if (companies.length === 0) {
            console.log("Creating default company...");
            defaultCompany = await storage.createCompany({ name: "Main Office" });
        } else {
            defaultCompany = companies[0];
        }
        console.log(`Using Company: ${defaultCompany.name} (ID: ${defaultCompany.id})`);

        // 2. Super Admin
        let superAdmin = await storage.getUserByEmail(superAdminEmail);
        if (!superAdmin) {
            console.log("Creating Super Admin...");
            superAdmin = await storage.createUser({
                username: "admin",
                email: superAdminEmail,
                password: "password123",
                role: "superadmin",
                name: "Super Admin",
                companyId: defaultCompany.id
            });
        } else {
            console.log("Super Admin exists. Ensuring role and company...");
            await storage.updateUser(superAdmin.id, {
                role: "superadmin",
                companyId: defaultCompany.id
            });
        }

        // 3. Kitchen User
        const kitchenUsername = "kitchen";
        let kitchenUser = await storage.getUserByUsername(kitchenUsername);
        if (!kitchenUser) {
            console.log("Creating Kitchen Staff...");
            await storage.createUser({
                username: kitchenUsername,
                email: "kitchen@company.com",
                password: "password123",
                role: "kitchen",
                name: "Kitchen Staff",
                companyId: defaultCompany.id
            });
        } else {
            await storage.updateUser(kitchenUser.id, { companyId: defaultCompany.id });
        }

        // 4. Employee User
        const employeeUsername = "employee1";
        let employee1 = await storage.getUserByUsername(employeeUsername);
        if (!employee1) {
            console.log("Creating Employee...");
            await storage.createUser({
                username: employeeUsername,
                email: "employee1@company.com",
                password: "password123",
                role: "employee",
                name: "John Doe",
                companyId: defaultCompany.id
            });
        } else {
            await storage.updateUser(employee1.id, { companyId: defaultCompany.id });
        }

        // 5. Drinks
        const drinks = await storage.getDrinks(defaultCompany.id);
        if (drinks.length === 0) {
            console.log("Seeding drinks...");
            const drinksList = [
                { name: "Tea", category: "Tea", preparationTime: 3, isAvailable: true, description: "Classic hot tea", companyId: defaultCompany.id },
                { name: "Turkish Coffee", category: "Coffee", preparationTime: 5, isAvailable: true, description: "Traditional Turkish coffee", companyId: defaultCompany.id },
                { name: "French Coffee", category: "Coffee", preparationTime: 5, isAvailable: true, description: "Smooth French press coffee", companyId: defaultCompany.id },
                { name: "Nescafe", category: "Coffee", preparationTime: 2, isAvailable: true, description: "Quick instant coffee", companyId: defaultCompany.id },
                { name: "Espresso", category: "Coffee", preparationTime: 2, isAvailable: true, description: "Strong single shot", companyId: defaultCompany.id },
                { name: "Herbs", category: "Tea", preparationTime: 4, isAvailable: true, description: "Assorted herbal infusion", companyId: defaultCompany.id }
            ];

            for (const d of drinksList) {
                await storage.createDrink(d);
                console.log(`Created drink: ${d.name}`);
            }
        } else {
            console.log(`${drinks.length} drinks already in database for this company.`);
        }

        console.log("HIERARCHICAL Seeding completed successfully.");
    } catch (err) {
        console.error("HIERARCHICAL Seeding failed:", err);
    }
}

hierarchicalSeed();
