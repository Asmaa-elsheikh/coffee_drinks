import { supabase } from "./db.js";
import { type User, type InsertUser, type Drink, type InsertDrink, type Order, type InsertOrder, type Branch, type InsertBranch } from "@shared/schema";
import bcrypt from "bcrypt";

const SALT_ROUNDS = 10;

export function toCamel(obj: any): any {
  if (!obj) return obj;
  const newObj: any = {};
  for (const key of Object.keys(obj)) {
    const camelKey = key.replace(/_([a-z])/g, (g) => g[1].toUpperCase());

    // Also handle nested objects (for joins)
    if (obj[key] !== null && typeof obj[key] === "object" && !Array.isArray(obj[key]) && !(obj[key] instanceof Date)) {
      newObj[camelKey] = toCamel(obj[key]);
    } else {
      newObj[camelKey] = obj[key];
    }
  }
  return newObj;
}

export function toSnake(obj: any): any {
  if (!obj) return obj;
  const newObj: any = {};
  for (const key of Object.keys(obj)) {
    const snakeKey = key.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
    newObj[snakeKey] = obj[key];
  }
  return newObj;
}

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
  updateUserRole(id: number, role: string): Promise<User>;

  // Branches
  getBranch(id: number): Promise<Branch | undefined>;
  getBranches(): Promise<Branch[]>;
  createBranch(branch: InsertBranch): Promise<Branch>;
  getDrinks(branchId?: number): Promise<Drink[]>;
  getDrink(id: number): Promise<Drink | undefined>;
  createDrink(drink: InsertDrink): Promise<Drink>;
  updateDrink(id: number, updates: Partial<InsertDrink>): Promise<Drink>;
  deleteDrink(id: number): Promise<void>;

  // Orders
  getOrders(filters?: { status?: string, userId?: number, userIds?: number[], branchId?: number, kitchenId?: number }): Promise<(Order & { drink: Drink, user: User })[]>;
  getOrder(id: number): Promise<Order | undefined>;
  createOrder(order: InsertOrder): Promise<Order>;
  updateOrderStatus(id: number, status: string, rejectionReason?: string): Promise<Order>;
  getPopularDrinks(branchId?: number): Promise<{ name: string, count: number }[]>;
  getOrderStats(branchId?: number): Promise<Record<string, number>>;
}

export class SupabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    const { data } = await supabase.from('users').select('*').eq('id', id).single();
    return data ? toCamel(data) : undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const { data } = await supabase.from('users').select('*').eq('username', username).single();
    return data ? toCamel(data) : undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const { data } = await supabase.from('users').select('*').eq('email', email).single();
    return data ? toCamel(data) : undefined;
  }

  async getUsersByRole(role: string): Promise<User[]> {
    const { data } = await supabase.from('users').select('*').eq('role', role);
    return (data || []).map(toCamel);
  }

  async getDemoUserIds(): Promise<number[]> {
    const demoEmails = ['asmaali.elsheikh@gmail.com', 'kitchen@company.com', 'employee1@company.com'];
    const { data } = await supabase.from('users').select('id').in('email', demoEmails);
    return (data || []).map(u => u.id);
  }

  async createUser(user: InsertUser): Promise<User> {
    console.log(`Storage: Creating user ${user.email}...`);
    console.log(`Storage: Hashing password for ${user.email}...`);
    const hashedPassword = await bcrypt.hash(user.password, SALT_ROUNDS);
    console.log(`Storage: Password hashed. Inserting into Supabase...`);
    const insertData = toSnake({ ...user, password: hashedPassword });
    const { data, error } = await supabase.from('users').insert(insertData).select().single();
    if (error) {
      console.error(`Storage: Error creating user ${user.email}:`, error.message);
      throw new Error(error.message);
    }
    console.log(`Storage: User ${user.email} created successfully with ID ${data.id}`);
    return toCamel(data);
  }

  async updateUser(id: number, updates: Partial<InsertUser>): Promise<User> {
    console.log(`Storage: Updating user ID ${id}...`);
    const finalUpdates = { ...updates };
    if (updates.password) {
      finalUpdates.password = await bcrypt.hash(updates.password, SALT_ROUNDS);
    }
    const updateData = toSnake(finalUpdates);
    const { data, error } = await supabase.from('users').update(updateData).eq('id', id).select().single();
    if (error) {
      console.error(`Storage: Error updating user ID ${id}:`, error.message);
      throw new Error(error.message);
    }
    console.log(`Storage: User ID ${id} updated successfully.`);
    return toCamel(data);
  }

  async deleteUser(id: number): Promise<void> {
    await supabase.from('users').delete().eq('id', id);
  }

  async updateUserRole(id: number, role: string): Promise<User> {
    const { data, error } = await supabase.from('users').update({ role }).eq('id', id).select().single();
    if (error) throw new Error(error.message);
    return toCamel(data);
  }

  // Branches
  async getBranch(id: number): Promise<Branch | undefined> {
    const { data } = await supabase.from('branches').select('*').eq('id', id).single();
    return data ? toCamel(data) : undefined;
  }

  async getBranches(): Promise<Branch[]> {
    const { data } = await supabase.from('branches').select('*').order('name');
    return (data || []).map(toCamel);
  }

  async createBranch(branch: InsertBranch): Promise<Branch> {
    const { data, error } = await supabase.from('branches').insert(toSnake(branch)).select().single();
    if (error) throw new Error(error.message);
    return toCamel(data);
  }

  async getDrinks(branchId?: number): Promise<Drink[]> {
    let query = supabase.from('drinks').select('*').eq('deleted', false);
    if (branchId) {
      query = query.eq('branch_id', branchId);
    }
    const { data } = await query.order('name');
    const drinks = (data || []).map(toCamel);
    if (drinks.length === 0 && !branchId) {
      // Return hardcoded basic list if DB is empty and no specific branch requested
      return [
        { id: 1, name: "Tea", category: "Tea", preparationTime: 3, isAvailable: true, description: "Classic hot tea", deleted: false, imageUrl: null, branchId: null },
        { id: 2, name: "Turkish Coffee", category: "Coffee", preparationTime: 5, isAvailable: true, description: "Traditional Turkish coffee", deleted: false, imageUrl: null, branchId: null },
        { id: 3, name: "Nescafe", category: "Coffee", preparationTime: 2, isAvailable: true, description: "Quick instant coffee", deleted: false, imageUrl: null, branchId: null }
      ];
    }
    return drinks;
  }

  async getDrink(id: number): Promise<Drink | undefined> {
    const { data } = await supabase.from('drinks').select('*').eq('id', id).single();
    return data ? toCamel(data) : undefined;
  }

  async createDrink(drink: InsertDrink): Promise<Drink> {
    const { data, error } = await supabase.from('drinks').insert(toSnake(drink)).select().single();
    if (error) throw new Error(error.message);
    return toCamel(data);
  }

  async updateDrink(id: number, updates: Partial<InsertDrink>): Promise<Drink> {
    const { data, error } = await supabase.from('drinks').update(toSnake(updates)).eq('id', id).select().single();
    if (error) throw new Error(error.message);
    return toCamel(data);
  }

  async deleteDrink(id: number): Promise<void> {
    await supabase.from('drinks').update({ deleted: true }).eq('id', id);
  }

  async getOrders(filters?: { status?: string, userId?: number, userIds?: number[], branchId?: number, kitchenId?: number }): Promise<(Order & { drink: Drink, user: User })[]> {
    let query = supabase.from('orders').select(`
      *,
      user:user_id(*),
      drink:drink_id(*)
    `).order('created_at', { ascending: false });

    if (filters?.status) {
      const statusList = filters.status.split(',');
      query = query.in('status', statusList);
    }
    if (filters?.userId) {
      query = query.eq('user_id', filters.userId);
    }
    if (filters?.userIds && filters.userIds.length > 0) {
      query = query.in('user_id', filters.userIds);
    }
    if (filters?.branchId) {
      query = query.eq('branch_id', filters.branchId);
    }
    if (filters?.kitchenId) {
      query = query.eq('kitchen_id', filters.kitchenId);
    }

    const { data, error } = await query;
    if (error) throw new Error(error.message);

    return (data || []).map(toCamel);
  }

  async getOrder(id: number): Promise<Order | undefined> {
    const { data } = await supabase.from('orders').select('*').eq('id', id).single();
    return data ? toCamel(data) : undefined;
  }

  async getPopularDrinks(branchId?: number): Promise<{ name: string, count: number }[]> {
    let query = supabase.from('orders').select(`
      drink: drinks(name)
    `);

    if (branchId) {
      query = query.eq('branch_id', branchId);
    }

    const { data } = await query;

    if (!data) return [];

    const countMap: Record<string, number> = {};
    for (const row of data as any) {
      if (row.drink && row.drink.name) {
        countMap[row.drink.name] = (countMap[row.drink.name] || 0) + 1;
      }
    }

    return Object.entries(countMap)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }

  async getOrderStats(branchId?: number): Promise<Record<string, number>> {
    let query = supabase.from('orders').select('status');

    if (branchId) {
      query = query.eq('branch_id', branchId);
    }

    const { data } = await query;
    const stats: Record<string, number> = {};
    for (const row of (data || [])) {
      stats[row.status] = (stats[row.status] || 0) + 1;
    }
    return stats;
  }

  async createOrder(order: InsertOrder): Promise<Order & { drink: Drink, user: User }> {
    const { data, error } = await supabase.from('orders').insert(toSnake(order)).select(`
      *,
      user:user_id(*),
      drink:drink_id(*)
    `).single();
    if (error) throw new Error(error.message);
    return toCamel(data);
  }

  async updateOrderStatus(id: number, status: string, rejectionReason?: string): Promise<Order & { drink: Drink, user: User }> {
    const updateData: any = { status, updated_at: new Date().toISOString() };
    if (rejectionReason !== undefined) {
      updateData.rejection_reason = rejectionReason;
    }
    const { data, error } = await supabase.from('orders').update(updateData).eq('id', id).select(`
      *,
      user:user_id(*),
      drink:drink_id(*)
    `).single();
    if (error) throw new Error(error.message);
    return toCamel(data);
  }
}

export const storage = new SupabaseStorage();
