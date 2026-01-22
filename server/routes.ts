import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import session from "express-session";
import createMemoryStore from "memorystore";

import bcrypt from "bcrypt";

const MemoryStore = createMemoryStore(session);

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Auth Setup
  app.use(session({
    secret: process.env.SESSION_SECRET || "secret",
    resave: false,
    saveUninitialized: false,
    store: new MemoryStore({
      checkPeriod: 86400000 // prune expired entries every 24h
    }),
    cookie: { 
      secure: process.env.NODE_ENV === "production",
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
  }));

  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(new LocalStrategy({ usernameField: 'email' }, async (email, password, done) => {
    try {
      const user = await storage.getUserByEmail(email);
      if (!user) return done(null, false, { message: "Incorrect email." });
      
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return done(null, false, { message: "Incorrect password." });
      }
      return done(null, user);
    } catch (err) {
      return done(err);
    }
  }));

  passport.serializeUser((user: any, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user);
    } catch (err) {
      done(err);
    }
  });

  // Auth Routes
  app.post(api.auth.login.path, passport.authenticate("local"), (req, res) => {
    res.json(req.user);
  });

  app.post(api.auth.logout.path, (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      res.json({ message: "Logged out" });
    });
  });

  app.get(api.auth.me.path, (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    res.json(req.user);
  });

  // Middleware to check auth
  const requireAuth = (req: any, res: any, next: any) => {
    if (req.isAuthenticated()) return next();
    res.sendStatus(401);
  };

  // Drink Routes
  app.get(api.drinks.list.path, requireAuth, async (req, res) => {
    const drinks = await storage.getDrinks();
    res.json(drinks);
  });

  // Employee Management Routes
  app.get("/api/admin/employees", requireAuth, async (req, res) => {
    const user = req.user as any;
    if (user.role !== "admin") return res.sendStatus(403);
    const employees = await storage.getUsersByRole("employee");
    res.json(employees);
  });

  app.post("/api/admin/employees", requireAuth, async (req, res) => {
    const user = req.user as any;
    if (user.role !== "admin") return res.sendStatus(403);
    const employee = await storage.createUser({
      ...req.body,
      role: "employee",
      username: req.body.email.split('@')[0] // temporary username
    });
    res.status(201).json(employee);
  });

  app.patch("/api/admin/employees/:id", requireAuth, async (req, res) => {
    const user = req.user as any;
    if (user.role !== "admin") return res.sendStatus(403);
    const id = parseInt(req.params.id);
    const updated = await storage.updateUser(id, req.body);
    res.json(updated);
  });

  app.delete("/api/admin/employees/:id", requireAuth, async (req, res) => {
    const user = req.user as any;
    if (user.role !== "admin") return res.sendStatus(403);
    const id = parseInt(req.params.id);
    await storage.deleteUser(id);
    res.sendStatus(204);
  });

  app.post(api.drinks.create.path, requireAuth, async (req, res) => {
    try {
      const input = api.drinks.create.input.parse(req.body);
      const drink = await storage.createDrink(input);
      res.status(201).json(drink);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      throw err;
    }
  });

  app.patch(api.drinks.update.path, requireAuth, async (req, res) => {
    const id = parseInt(req.params.id as string);
    const input = api.drinks.update.input.parse(req.body);
    const updated = await storage.updateDrink(id, input);
    res.json(updated);
  });

  app.delete(api.drinks.delete.path, requireAuth, async (req, res) => {
    await storage.deleteDrink(parseInt(req.params.id as string));
    res.sendStatus(204);
  });

  // Order Routes
  app.get(api.orders.list.path, requireAuth, async (req, res) => {
    const user = req.user as any;
    const filters: any = {};
    
    // Employees only see their own orders
    if (user.role === 'employee') {
      filters.userId = user.id;
    } else if (req.query.userId) {
      filters.userId = parseInt(req.query.userId as string);
    }

    if (req.query.status) {
      const statusStr = req.query.status as string;
      filters.status = statusStr;
    }

    console.log(`Fetching orders for user ${user.id} (${user.role}) with filters:`, filters);
    const ordersData = await storage.getOrders(filters);
    res.json(ordersData);
  });

  app.post(api.orders.create.path, requireAuth, async (req, res) => {
    try {
      const input = api.orders.create.input.parse(req.body);
      const order = await storage.createOrder(input);
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
    const ordersData = await storage.getOrders();
    const popularDrinks = await storage.getPopularDrinks();
    const orderStats = await storage.getOrderStats();

    const stats = {
      totalOrders: ordersData.length,
      ordersByStatus: orderStats,
      popularDrinks: popularDrinks
    };
    res.json(stats);
  });

  // Seed Data
  await seed();

  return httpServer;
}

async function seed() {
  const adminUser = await storage.getUserByUsername("admin");
  if (!adminUser) {
    // Create Users
    await storage.createUser({ 
      username: "admin", 
      email: "admin@company.com",
      password: "password123", 
      role: "admin",
      name: "System Admin"
    });
    await storage.createUser({ 
      username: "kitchen", 
      email: "kitchen@company.com",
      password: "password123", 
      role: "kitchen",
      name: "Kitchen Staff"
    });
    await storage.createUser({ 
      username: "employee1", 
      email: "employee1@company.com",
      password: "password123", 
      role: "employee",
      name: "John Doe"
    });

    // Create Drinks
    const drinksList = [
      { name: "Tea", imageUrl: "https://images.unsplash.com/photo-1594631252845-29fc45865157?w=800&q=80", category: "Tea", preparationTime: 3, isAvailable: true, description: "Classic hot tea" },
      { name: "Turkish Coffee", imageUrl: "https://images.unsplash.com/photo-1578314675249-a6910f80cc4e?w=800&q=80", category: "Coffee", preparationTime: 5, isAvailable: true, description: "Traditional Turkish coffee" },
      { name: "French Coffee", imageUrl: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=800&q=80", category: "Coffee", preparationTime: 5, isAvailable: true, description: "Smooth French press coffee" },
      { name: "Nescafe", imageUrl: "https://images.unsplash.com/photo-1541167760496-1628856ab752?w=800&q=80", category: "Coffee", preparationTime: 2, isAvailable: true, description: "Quick instant coffee" },
      { name: "Espresso", imageUrl: "https://images.unsplash.com/photo-1510591509098-f4fdc6d0ff04?w=800&q=80", category: "Coffee", preparationTime: 2, isAvailable: true, description: "Strong single shot" },
      { name: "Herbs", imageUrl: "https://images.unsplash.com/photo-1564890369478-c89ca6d9cde9?w=800&q=80", category: "Tea", preparationTime: 4, isAvailable: true, description: "Assorted herbal infusion" }
    ];

    for (const drink of drinksList) {
      await storage.createDrink(drink);
    }
  }
}
