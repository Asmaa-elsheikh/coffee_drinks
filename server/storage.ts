import { db } from "./db";
import { users, drinks, orders, type User, type InsertUser, type Drink, type InsertDrink, type Order, type InsertOrder } from "@shared/schema";
import { eq, desc, and } from "drizzle-orm";

export interface IStorage {
  // Users
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Drinks
  getDrinks(): Promise<Drink[]>;
  getDrink(id: number): Promise<Drink | undefined>;
  createDrink(drink: InsertDrink): Promise<Drink>;
  updateDrink(id: number, updates: Partial<InsertDrink>): Promise<Drink>;
  deleteDrink(id: number): Promise<void>;

  // Orders
  getOrders(filters?: { status?: string, userId?: number }): Promise<(Order & { drink: Drink, user: User })[]>;
  getOrder(id: number): Promise<Order | undefined>;
  createOrder(order: InsertOrder): Promise<Order>;
  updateOrderStatus(id: number, status: string, rejectionReason?: string): Promise<Order>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(user: InsertUser): Promise<User> {
    const [newUser] = await db.insert(users).values(user).returning();
    return newUser;
  }

  async getDrinks(): Promise<Drink[]> {
    return await db.select().from(drinks).orderBy(drinks.name);
  }

  async getDrink(id: number): Promise<Drink | undefined> {
    const [drink] = await db.select().from(drinks).where(eq(drinks.id, id));
    return drink;
  }

  async createDrink(drink: InsertDrink): Promise<Drink> {
    const [newDrink] = await db.insert(drinks).values(drink).returning();
    return newDrink;
  }

  async updateDrink(id: number, updates: Partial<InsertDrink>): Promise<Drink> {
    const [updated] = await db.update(drinks).set(updates).where(eq(drinks.id, id)).returning();
    return updated;
  }

  async deleteDrink(id: number): Promise<void> {
    await db.delete(drinks).where(eq(drinks.id, id));
  }

  async getOrders(filters?: { status?: string, userId?: number }): Promise<(Order & { drink: Drink, user: User })[]> {
    const query = db.query.orders.findMany({
      with: {
        drink: true,
        user: true,
      },
      orderBy: desc(orders.createdAt),
      where: (orders, { eq, and }) => {
        const conditions = [];
        if (filters?.status) conditions.push(eq(orders.status, filters.status));
        if (filters?.userId) conditions.push(eq(orders.userId, filters.userId));
        return conditions.length ? and(...conditions) : undefined;
      },
    });
    return query;
  }

  async getOrder(id: number): Promise<Order | undefined> {
    const [order] = await db.select().from(orders).where(eq(orders.id, id));
    return order;
  }

  async createOrder(order: InsertOrder): Promise<Order> {
    const [newOrder] = await db.insert(orders).values(order).returning();
    return newOrder;
  }

  async updateOrderStatus(id: number, status: string, rejectionReason?: string): Promise<Order> {
    const [updated] = await db
      .update(orders)
      .set({ 
        status, 
        rejectionReason,
        updatedAt: new Date() 
      })
      .where(eq(orders.id, id))
      .returning();
    return updated;
  }
}

export const storage = new DatabaseStorage();
