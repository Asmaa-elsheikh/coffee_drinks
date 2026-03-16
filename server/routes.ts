import type { Express, Request, Response, NextFunction } from "express";
import { type Server } from "http";
import { storage } from "./storage.js";
import { api } from "../shared/routes.js";
import { z } from "zod";
import bcrypt from "bcrypt";
import { supabase } from "./db.js";
import { toCamel } from "./storage.js";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "fallback-secret-change-me";

export function registerRoutes(
  httpServer: Server,
  app: Express
): Server {
  // Middleware to check auth via JWT
  const requireAuth = async (req: Request, res: Response, next: NextFunction) => {
    const token = req.cookies?.token;
    if (!token) return res.sendStatus(401);

    try {
      const decoded = jwt.verify(token, JWT_SECRET) as any;
      // We store the essential user info in the token to avoid DB lookups
      (req as any).user = {
        id: decoded.id,
        role: decoded.role,
        branchId: decoded.branchId,
        email: decoded.email,
        name: decoded.name
      };
      next();
    } catch (err) {
      console.error("JWT Verification failed:", err);
      res.sendStatus(401);
    }
  };

  // Auth Routes
  app.post(api.auth.login.path, async (req, res) => {
    const { email, password } = req.body;
    try {
      console.log(`Login attempt for: ${email}`);
      const user = await storage.getUserByEmail(email);
      if (!user) {
        console.log(`User not found: ${email}`);
        return res.status(401).json({ message: "Incorrect email." });
      }

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        console.log(`Invalid password for: ${email}`);
        return res.status(401).json({ message: "Incorrect password." });
      }

      console.log(`Successful login: ${email} (Role: ${user.role}, BranchID: ${user.branchId})`);
      
      const token = jwt.sign({ 
        id: user.id,
        role: user.role,
        branchId: user.branchId,
        email: user.email,
        name: user.name
      }, JWT_SECRET, { expiresIn: '24h' });
      
      res.cookie("token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
      });

      res.json(user);
    } catch (err) {
      console.error(`Login error for ${email}:`, err);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post(api.auth.logout.path, (req, res) => {
    res.clearCookie("token");
    res.json({ message: "Logged out" });
  });

  app.get(api.auth.me.path, requireAuth, async (req, res) => {
    // For 'me' route, we can refetch from DB to ensure UI has latest data
    // but protected routes use the token data for speed.
    const user = await storage.getUser(((req as any).user).id);
    res.json(user);
  });

  // Branch Routes
  app.get("/api/branches", requireAuth, async (_req, res) => {
    // Both admin and superadmin need to see branches for selection
    const branches = await storage.getBranches();
    res.json(branches);
  });

  app.post("/api/branches", requireAuth, async (req, res) => {
    const user = (req as any).user as any;
    if (user.role !== "superadmin") return res.sendStatus(403);
    const branch = await storage.createBranch(req.body);
    res.status(201).json(branch);
  });

  app.delete("/api/branches/:id", requireAuth, async (req, res) => {
    const user = (req as any).user as any;
    if (user.role !== "superadmin") return res.sendStatus(403);
    const id = parseInt((req as any).params.id);
    // Note: We might want to prevent deleting branches with users/drinks
    await supabase.from('branches').delete().eq('id', id);
    res.sendStatus(204);
  });

  // Drink Routes
  app.get(api.drinks.list.path, requireAuth, async (req, res) => {
    const user = (req as any).user as any;
    const branchId = user.role === "superadmin"
      ? (req.query.branchId ? parseInt(req.query.branchId as string) : undefined)
      : (user.branchId ? parseInt(user.branchId.toString()) : undefined);

    const drinks = await storage.getDrinks(branchId);
    res.json(drinks);
  });

  // User Management Routes (formerly Employee Management)
  app.get("/api/admin/users", requireAuth, async (req, res) => {
    const user = (req as any).user as any;
    if (user.role !== "admin" && user.role !== "superadmin") return res.sendStatus(403);

    let usersList;
    if (user.role === "superadmin") {
      // Superadmin sees everyone initially, or we filter by branch if provided
      const branchId = req.query.branchId ? parseInt(req.query.branchId as string) : undefined;
      const { data } = await supabase.from('users').select('*').order('name');
      usersList = (data || []).map(toCamel);
      if (branchId) {
        usersList = usersList.filter((u: any) => u.branchId === branchId);
      }
    } else {
      // Admin only sees their branch's users
      const { data } = await supabase.from('users').select('*').eq('branch_id', user.branchId).order('name');
      usersList = (data || []).map(toCamel);
    }
    res.json(usersList);
  });

  app.post("/api/admin/users", requireAuth, async (req, res) => {
    const user = (req as any).user as any;
    if (user.role !== "admin" && user.role !== "superadmin") return res.sendStatus(403);

    const { role, branchId, assignedKitchenId, email } = req.body;
    // Security: No one can create a Super Admin. Branch Admin cannot create another Admin.
    if (role === "superadmin") {
      return res.status(403).json({ message: "System only allows one Super Admin. Cannot create another." });
    }
    if (user.role === "admin" && role === "admin") {
      return res.status(403).json({ message: "Branch Admins cannot create other Admins." });
    }

    // Sanitize numeric fields
    const bId = user.role === "superadmin"
      ? (branchId && branchId !== "" ? parseInt(branchId.toString()) : null)
      : (user.branchId ? parseInt(user.branchId.toString()) : null);

    const kId = (assignedKitchenId && assignedKitchenId !== "" && assignedKitchenId !== "none") ? parseInt(assignedKitchenId.toString()) : null;

    try {
      if (user.role === "superadmin" && !bId && (role === "admin" || role === "employee" || role === "kitchen")) {
        return res.status(400).json({ message: "Branch selection is required for this role." });
      }

      const newUser = await storage.createUser({
        ...req.body,
        branchId: bId,
        assignedKitchenId: kId,
        username: email.split('@')[0]
      });
      res.status(201).json(newUser);
    } catch (err: any) {
      console.error("Error creating user:", err);
      res.status(400).json({ message: err.message || "Failed to create user" });
    }
  });

  app.patch("/api/admin/users/:id", requireAuth, async (req, res) => {
    const user = (req as any).user as any;
    if (user.role !== "admin" && user.role !== "superadmin") return res.sendStatus(403);

    const { role, branchId, assignedKitchenId } = req.body;
    // Security: No one can promote to Super Admin. Branch Admin cannot promote to Admin.
    if (role === "superadmin") {
      return res.status(403).json({ message: "Promotion to Super Admin is not allowed." });
    }
    if (user.role === "admin" && role === "admin") {
      return res.status(403).json({ message: "Branch Admins cannot grant Admin privileges." });
    }
    const id = parseInt(req.params.id);

    // Ensure numeric values and handle empty strings
    const updates = { ...req.body };
    if (updates.branchId !== undefined) {
      updates.branchId = (updates.branchId && updates.branchId !== "") ? parseInt(updates.branchId.toString()) : null;
    }
    if (updates.assignedKitchenId !== undefined) {
      updates.assignedKitchenId = (updates.assignedKitchenId && updates.assignedKitchenId !== "") ? parseInt(updates.assignedKitchenId.toString()) : null;
    }

    try {
      const updated = await storage.updateUser(id, updates);
      res.json(updated);
    } catch (err: any) {
      console.error("Error updating user:", err);
      res.status(400).json({ message: err.message || "Failed to update user" });
    }
  });

  app.delete("/api/admin/users/:id", requireAuth, async (req, res) => {
    const user = (req as any).user as any;
    if (user.role !== "admin" && user.role !== "superadmin") return res.sendStatus(403);
    const id = parseInt((req as any).params.id);
    await storage.deleteUser(id);
    res.sendStatus(204);
  });

  app.post(api.drinks.create.path, requireAuth, async (req, res) => {
    try {
      const user = (req as any).user as any;
      if (user.role !== "admin" && user.role !== "superadmin") return res.sendStatus(403);

      const input = api.drinks.create.input.parse(req.body);
      const drink = await storage.createDrink({
        ...input,
        branchId: user.role === "superadmin" ? (req.body.branchId || user.branchId) : user.branchId
      });
      res.status(201).json(drink);
    } catch (err) {
      console.error("Error creating drink:", err);
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.patch(api.drinks.update.path, requireAuth, async (req, res) => {
    const user = (req as any).user as any;
    if (user.role !== "admin" && user.role !== "superadmin" && user.email !== "asmaali.elsheikh@gmail.com") return res.sendStatus(403);

    const id = parseInt(req.params.id as string);
    const input = api.drinks.update.input.parse(req.body);
    const updated = await storage.updateDrink(id, input);
    res.json(updated);
  });

  app.delete(api.drinks.delete.path, requireAuth, async (req, res) => {
    const user = (req as any).user as any;
    if (user.role !== "admin" && user.role !== "superadmin") return res.sendStatus(403);

    await storage.deleteDrink(parseInt(req.params.id as string));
    res.sendStatus(204);
  });

  // Order Routes
  app.get(api.orders.list.path, requireAuth, async (req, res) => {
    const user = (req as any).user as any;
    const filters: any = {};

    // Fix History Views
    const isRealAdmin = typeof user.email === 'string' && (user.email === 'asmaa.ali@qara.net' || user.email === 'asmaali.elsheikh@gmail.com');
    const isKitchen = user.role === 'kitchen';
    const isDemoAdmin = user.email === 'asmaali.elsheikh@gmail.com';

    if (user.role === 'superadmin' || isKitchen) {
      // Superadmin and kitchen see everything or filter by branch if implemented
      if (req.query.branchId) filters.branchId = parseInt(req.query.branchId as string);
      if (isKitchen) filters.kitchenId = user.id; // Kitchen only sees orders assigned to them
    } else if (user.role === 'admin') {
      // Admin sees their branch's orders
      filters.branchId = user.branchId;
    } else {
      // Regular users only see their own
      filters.userId = user.id;
    }

    if (req.query.status) {
      const statusStr = req.query.status as string;
      filters.status = statusStr;
    }

    console.log(`Fetching orders for user ${user.id} (${user.role}) with filters:`, filters);
    const ordersData = await storage.getOrders(filters);
    console.log(`Found ${ordersData.length} orders. First order keys:`, ordersData[0] ? Object.keys(ordersData[0]) : 'none');
    res.json(ordersData);
  });

  app.post(api.orders.create.path, requireAuth, async (req, res) => {
    try {
      const user = (req as any).user as any;
      const input = api.orders.create.input.parse(req.body);
      console.log(`Creating order for user ${user.id} (Branch: ${user.branchId}, Kitchen: ${user.assignedKitchenId})`);
      const order = await storage.createOrder({
        ...input,
        userId: user.id,
        branchId: user.branchId,
        kitchenId: user.assignedKitchenId // Automatically assign to the user's kitchen
      });
      console.log(`Order created successfully: ID ${order.id}`);
      res.status(201).json(order);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      throw err;
    }
  });

  app.patch(api.orders.updateStatus.path, requireAuth, async (req, res) => {
    const id = parseInt(req.params.id as string);
    const { status, rejectionReason } = req.body;
    const updated = await storage.updateOrderStatus(id, status, rejectionReason);
    res.json(updated);
  });

  // Analytics
  app.get(api.analytics.stats.path, requireAuth, async (req, res) => {
    const user = (req as any).user as any;
    const filters: any = {};
    if (user.role === 'admin') filters.branchId = user.branchId;
    else if (user.role === 'superadmin' && req.query.branchId) filters.branchId = parseInt(req.query.branchId as string);

    const ordersData = await storage.getOrders(filters);
    const popularDrinks = await storage.getPopularDrinks(filters.branchId);
    const orderStats = await storage.getOrderStats(filters.branchId);

    const stats = {
      totalOrders: ordersData.length,
      ordersByStatus: orderStats,
      popularDrinks: popularDrinks
    };
    res.json(stats);
  });

  // API 404 Handler - MUST be before Vite catch-all
  // Using app.use("/api", ...) will capture all /api/... requests that didn't match above
  app.use("/api", (_req, res) => {
    res.status(404).json({ message: "API endpoint not found" });
  });

  console.log("Registered all routes.");
  // Background the seed so it doesn't block startup or Vercel execution
  seed().catch(err => console.error("Background seeding failed:", err));

  return httpServer;
}

async function seed() {
  console.log("Running hierarchical database seeding...");

  const superAdminEmail = "asmaali.elsheikh@gmail.com";

  try {
    // 1. Ensure a default branch exists
    let branches = await storage.getBranches();
    let defaultBranch;
    if (branches.length === 0) {
      console.log("Seeding: Creating default branch...");
      defaultBranch = await storage.createBranch({ name: "Main Office" });
    } else {
      defaultBranch = branches[0];
    }

    // 2. Super Admin
    let superAdmin = await storage.getUserByEmail(superAdminEmail);
    if (!superAdmin) {
      console.log(`Seeding: Super Admin (${superAdminEmail}) not found. Creating...`);
      superAdmin = await storage.createUser({
        username: "admin",
        email: superAdminEmail,
        password: "password123",
        role: "superadmin",
        name: "Super Admin",
        branchId: defaultBranch.id
      });
    } else {
      console.log(`Seeding: Super Admin (${superAdminEmail}) found. Ensuring role and branch...`);
      await storage.updateUser(superAdmin.id, {
        role: "superadmin",
        branchId: defaultBranch.id
      });
    }

    // 3. Kitchen User for default branch
    const kitchenUsername = "kitchen";
    let kitchenUser = await storage.getUserByUsername(kitchenUsername);
    if (!kitchenUser) {
      console.log("Seeding: Creating Kitchen Staff...");
      kitchenUser = await storage.createUser({
        username: kitchenUsername,
        email: "kitchen@company.com",
        password: "password123",
        role: "kitchen",
        name: "Kitchen Staff",
        branchId: defaultBranch.id
      });
    }

    // 4. Employee User for default branch
    const employeeUsername = "employee1";
    let employee1 = await storage.getUserByUsername(employeeUsername);
    if (!employee1) {
      console.log("Seeding: Creating Employee...");
      await storage.createUser({
        username: employeeUsername,
        email: "employee1@company.com",
        password: "password123",
        role: "employee",
        name: "John Doe",
        branchId: defaultBranch.id,
        assignedKitchenId: kitchenUser.id // Assign to the default kitchen
      });
    }

    // 5. Drinks for default branch
    const drinks = await storage.getDrinks(defaultBranch.id);
    if (drinks.length === 0) {
      console.log("Seeding: Populating drinks for default branch...");
      const drinksList = [
        { name: "Tea", category: "Tea", preparationTime: 3, isAvailable: true, description: "Classic hot tea", branchId: defaultBranch.id },
        { name: "Turkish Coffee", category: "Coffee", preparationTime: 5, isAvailable: true, description: "Traditional Turkish coffee", branchId: defaultBranch.id },
        { name: "French Coffee", category: "Coffee", preparationTime: 5, isAvailable: true, description: "Smooth French press coffee", branchId: defaultBranch.id },
        { name: "Nescafe", category: "Coffee", preparationTime: 2, isAvailable: true, description: "Quick instant coffee", branchId: defaultBranch.id },
        { name: "Espresso", category: "Coffee", preparationTime: 2, isAvailable: true, description: "Strong single shot", branchId: defaultBranch.id },
        { name: "Herbs", category: "Tea", preparationTime: 4, isAvailable: true, description: "Assorted herbal infusion", branchId: defaultBranch.id }
      ];

      for (const drink of drinksList) {
        await storage.createDrink(drink);
      }
    }
    console.log("Seeding completed successfully.");
  } catch (err) {
    console.error("Seeding failed:", err);
  }
}
