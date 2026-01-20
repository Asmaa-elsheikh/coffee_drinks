import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(), // Acts as Employee ID
  password: text("password").notNull(),
  role: text("role", { enum: ["employee", "kitchen", "admin"] }).default("employee").notNull(),
  name: text("name").notNull(),
});

export const drinks = pgTable("drinks", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  category: text("category").notNull(), // Coffee, Tea, Juice, etc.
  description: text("description"),
  preparationTime: integer("preparation_time").default(5), // in minutes
  isAvailable: boolean("is_available").default(true).notNull(),
  deleted: boolean("deleted").default(false).notNull(),
});

export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  drinkId: integer("drink_id").references(() => drinks.id).notNull(),
  status: text("status", {
    enum: ["pending", "accepted", "in_preparation", "ready", "completed", "rejected"]
  }).default("pending").notNull(),
  sugar: text("sugar"), // e.g. "None", "1 Spoon", "2 Spoons", "Custom"
  notes: text("notes"), // Optional notes
  rejectionReason: text("rejection_reason"),
  scheduledFor: timestamp("scheduled_for"), // If null, immediate order
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  orders: many(orders),
}));

export const drinksRelations = relations(drinks, ({ many }) => ({
  orders: many(orders),
}));

export const ordersRelations = relations(orders, ({ one }) => ({
  user: one(users, {
    fields: [orders.userId],
    references: [users.id],
  }),
  drink: one(drinks, {
    fields: [orders.drinkId],
    references: [drinks.id],
  }),
}));

// Schemas
export const insertUserSchema = createInsertSchema(users).omit({ id: true });
export const insertDrinkSchema = createInsertSchema(drinks).omit({ id: true });
export const insertOrderSchema = createInsertSchema(orders).omit({ 
  id: true, 
  createdAt: true, 
  updatedAt: true,
  status: true 
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Drink = typeof drinks.$inferSelect;
export type InsertDrink = z.infer<typeof insertDrinkSchema>;
export type Order = typeof orders.$inferSelect;
export type InsertOrder = z.infer<typeof insertOrderSchema>;
