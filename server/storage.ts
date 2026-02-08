import { db } from "./db";
import { users, drinks, orders, type User, type InsertUser, type Drink, type InsertDrink, type Order, type InsertOrder } from "@shared/schema";
import { eq, desc, and, sql, inArray } from "drizzle-orm";
import bcrypt from "bcrypt";

const SALT_ROUNDS = 10;

export interface IStorage {
  // Users
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUsersByRole(role: string): Promise<User[]>;
  getDemoUserIds(): Promise<number[]>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, updates: Partial<InsertUser>): Promise<User>;
  deleteUser(id: number): Promise<void>;

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
  getPopularDrinks(): Promise<{ name: string, count: number }[]>;
  getOrderStats(): Promise<Record<string, number>>;
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

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async getUsersByRole(role: string): Promise<User[]> {
    return await db.select().from(users).where(eq(users.role, role as any));
  }

  async getDemoUserIds(): Promise<number[]> {
    const demoEmails = ['admin@company.com', 'kitchen@company.com', 'employee1@company.com'];
    const usersList = await db.select().from(users).where(inArray(users.email, demoEmails));
    return usersList.map(u => u.id);
  }

  async createUser(user: InsertUser): Promise<User> {
    const hashedPassword = await bcrypt.hash(user.password, SALT_ROUNDS);
    const [newUser] = await db.insert(users).values({ ...user, password: hashedPassword }).returning();
    return newUser;
  }

  async updateUser(id: number, updates: Partial<InsertUser>): Promise<User> {
    const finalUpdates = { ...updates };
    if (updates.password) {
      finalUpdates.password = await bcrypt.hash(updates.password, SALT_ROUNDS);
    }
    const [updated] = await db.update(users).set(finalUpdates).where(eq(users.id, id)).returning();
    return updated;
  }

  async deleteUser(id: number): Promise<void> {
    await db.delete(users).where(eq(users.id, id));
  }

  async getDrinks(): Promise<Drink[]> {
    return await db.select().from(drinks).where(eq(drinks.deleted, false)).orderBy(drinks.name);
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
    await db.update(drinks).set({ deleted: true }).where(eq(drinks.id, id));
  }

  async getOrders(filters?: { status?: string, userId?: number, userIds?: number[] }): Promise<(Order & { drink: Drink, user: User })[]> {
    const query = db.query.orders.findMany({
      with: {
        drink: true,
        user: true,
      },
      orderBy: desc(orders.createdAt),
      where: (ordersTable, { eq, and, inArray }) => {
        const conditions = [];
        if (filters?.status) {
          const statusList = filters.status.split(',') as any[];
          conditions.push(sql`${ordersTable.status} IN ${statusList}`);
        }
        if (filters?.userId) conditions.push(eq(ordersTable.userId, filters.userId));
        if (filters?.userIds) conditions.push(inArray(ordersTable.userId, filters.userIds));
        return conditions.length ? and(...conditions) : undefined;
      },
    });
    return query as any;
  }

  async getOrder(id: number): Promise<Order | undefined> {
    const [order] = await db.select().from(orders).where(eq(orders.id, id));
    return order;
  }

  async getPopularDrinks(): Promise<{ name: string, count: number }[]> {
    const result = await db
      .select({
        name: drinks.name,
        count: sql<number>`count(${orders.id})`.mapWith(Number),
      })
      .from(orders)
      .innerJoin(drinks, eq(orders.drinkId, drinks.id))
      .groupBy(drinks.name)
      .orderBy(desc(sql`count(${orders.id})`))
      .limit(5);
    return result;
  }

  async getOrderStats(): Promise<Record<string, number>> {
    const result = await db
      .select({
        status: orders.status,
        count: sql<number>`count(${orders.id})`.mapWith(Number),
      })
      .from(orders)
      .groupBy(orders.status);
    
    const stats: Record<string, number> = {};
    result.forEach(row => {
      stats[row.status] = row.count;
    });
    return stats;
  }

  async createOrder(order: InsertOrder): Promise<Order> {
    const [newOrder] = await db.insert(orders).values(order).returning();
    return newOrder;
  }

  async updateOrderStatus(id: number, status: any, rejectionReason?: string): Promise<Order> {
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
