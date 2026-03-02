import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

export const branches = pgTable("branches", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  role: text("role", { enum: ["employee", "kitchen", "admin", "superadmin"] }).default("employee").notNull(),
  name: text("name").notNull(),
  branchId: integer("branch_id").references(() => branches.id),
  assignedKitchenId: integer("assigned_kitchen_id"), // Refers to a user with role 'kitchen'
});

export const drinks = pgTable("drinks", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  category: text("category").notNull(),
  description: text("description"),
  imageUrl: text("image_url"),
  preparationTime: integer("preparation_time").default(5),
  isAvailable: boolean("is_available").default(true).notNull(),
  deleted: boolean("deleted").default(false).notNull(),
  branchId: integer("branch_id").references(() => branches.id),
});

export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  drinkId: integer("drink_id").references(() => drinks.id).notNull(),
  status: text("status", {
    enum: ["pending", "accepted", "in_preparation", "ready", "completed", "rejected", "cancelled"]
  }).default("pending").notNull(),
  sugar: text("sugar"),
  notes: text("notes"),
  rejectionReason: text("rejection_reason"),
  scheduledFor: timestamp("scheduled_for"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  branchId: integer("branch_id").references(() => branches.id),
  kitchenId: integer("kitchen_id").references(() => users.id), // The specific kitchen fulfilling this order
});

// Relations
export const usersRelations = relations(users, ({ many, one }) => ({
  orders: many(orders),
  branch: one(branches, {
    fields: [users.branchId],
    references: [branches.id],
  }),
}));

export const drinksRelations = relations(drinks, ({ many, one }) => ({
  orders: many(orders),
  branch: one(branches, {
    fields: [drinks.branchId],
    references: [branches.id],
  }),
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
export const insertBranchSchema = createInsertSchema(branches).omit({ id: true, createdAt: true });
export const insertUserSchema = createInsertSchema(users).omit({ id: true });
export const insertDrinkSchema = createInsertSchema(drinks).omit({ id: true });
export const insertOrderSchema = createInsertSchema(orders).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  status: true
});

export const selectUserSchema = createInsertSchema(users);
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Drink = typeof drinks.$inferSelect;
export type InsertDrink = z.infer<typeof insertDrinkSchema>;
export type Order = typeof orders.$inferSelect;
export type InsertOrder = z.infer<typeof insertOrderSchema>;
export type Branch = typeof branches.$inferSelect;
export type InsertBranch = z.infer<typeof insertBranchSchema>;
