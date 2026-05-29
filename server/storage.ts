import { tasks, users, sessions } from "@shared/schema";
import type { Task, InsertTask, UpdateTask, SafeUser, AuthResponse, User } from "@shared/schema";
import { drizzle } from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";
import { and, desc, eq, gt } from "drizzle-orm";
import { createHash, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

const sqlite = new Database(process.env.DATABASE_PATH ?? "data.db");
sqlite.pragma("journal_mode = WAL");

// Ensure core tables exist (lightweight bootstrap so we don't need drizzle-kit at runtime)
sqlite.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    phone TEXT,
    country_code TEXT,
    password_hash TEXT NOT NULL,
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    token_hash TEXT NOT NULL UNIQUE,
    expires_at TEXT NOT NULL,
    created_at TEXT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL DEFAULT 1,
    title TEXT NOT NULL,
    notes TEXT,
    period TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'todo',
    progress INTEGER NOT NULL DEFAULT 0,
    priority TEXT NOT NULL DEFAULT 'medium',
    category TEXT NOT NULL DEFAULT 'general',
    due_date TEXT,
    start_date TEXT,
    end_date TEXT,
    time_estimate INTEGER,
    metric_target INTEGER,
    metric_unit TEXT,
    created_at TEXT NOT NULL
  );
`);

// Add new columns if they don't exist
const userColumns = sqlite.prepare("PRAGMA table_info(users)").all() as Array<{ name: string }>;
if (!userColumns.some((c) => c.name === "phone")) {
  sqlite.exec("ALTER TABLE users ADD COLUMN phone TEXT;");
}
if (!userColumns.some((c) => c.name === "country_code")) {
  sqlite.exec("ALTER TABLE users ADD COLUMN country_code TEXT;");
}

const taskColumns = sqlite.prepare("PRAGMA table_info(tasks)").all() as Array<{ name: string }>;
if (!taskColumns.some((c) => c.name === "user_id")) {
  sqlite.exec("ALTER TABLE tasks ADD COLUMN user_id INTEGER NOT NULL DEFAULT 1;");
}
if (!taskColumns.some((c) => c.name === "start_date")) {
  sqlite.exec("ALTER TABLE tasks ADD COLUMN start_date TEXT;");
}
if (!taskColumns.some((c) => c.name === "end_date")) {
  sqlite.exec("ALTER TABLE tasks ADD COLUMN end_date TEXT;");
}

export const db = drizzle(sqlite);

export interface IStorage {
  listTasks(userId: number): Promise<Task[]>;
  getTask(id: number, userId: number): Promise<Task | undefined>;
  createTask(task: InsertTask, userId: number): Promise<Task>;
  updateTask(id: number, userId: number, patch: UpdateTask): Promise<Task | undefined>;
  deleteTask(id: number, userId: number): Promise<boolean>;
  registerUser(input: { name: string; email: string; password: string; phone?: string; countryCode?: string }): Promise<AuthResponse>;
  loginUser(input: { email: string; password: string }): Promise<AuthResponse | undefined>;
  getUserByToken(token: string): Promise<SafeUser | undefined>;
  logout(token: string): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  async listTasks(userId: number): Promise<Task[]> {
    const tasksList = await db.select().from(tasks).where(eq(tasks.userId, userId)).orderBy(desc(tasks.createdAt)).all();
    
    // Update task status to overdue if end date has passed and task is not done
    const now = new Date();
    for (const task of tasksList) {
      if (task.status !== "done" && task.endDate) {
        const endDate = new Date(task.endDate + "T23:59:59");
        if (endDate < now) {
          await this.updateTask(task.id, userId, { status: "overdue" });
        }
      }
    }
    
    return tasksList;
  }

  async getTask(id: number, userId: number): Promise<Task | undefined> {
    return db.select().from(tasks).where(and(eq(tasks.id, id), eq(tasks.userId, userId))).get();
  }

  async createTask(task: InsertTask, userId: number): Promise<Task> {
    const row = {
      ...task,
      userId,
      notes: task.notes ?? null,
      dueDate: task.dueDate ?? null,
      startDate: task.startDate ?? null,
      endDate: task.endDate ?? null,
      timeEstimate: task.timeEstimate ?? null,
      metricTarget: task.metricTarget ?? null,
      metricUnit: task.metricUnit ?? null,
      createdAt: new Date().toISOString(),
    };
    return db.insert(tasks).values(row).returning().get();
  }

  async updateTask(id: number, userId: number, patch: UpdateTask): Promise<Task | undefined> {
    if (Object.keys(patch).length === 0) return this.getTask(id, userId);
    const updated = db
      .update(tasks)
      .set(patch as Partial<Task>)
      .where(and(eq(tasks.id, id), eq(tasks.userId, userId)))
      .returning()
      .get();
    return updated;
  }

  async deleteTask(id: number, userId: number): Promise<boolean> {
    const res = db.delete(tasks).where(and(eq(tasks.id, id), eq(tasks.userId, userId))).run();
    return res.changes > 0;
  }

  async registerUser(input: { name: string; email: string; password: string; phone?: string; countryCode?: string }): Promise<AuthResponse> {
    const existing = db.select().from(users).where(eq(users.email, input.email)).get();
    if (existing) throw new Error("EMAIL_EXISTS");
    const created = db.insert(users).values({
      name: input.name.trim(),
      email: input.email,
      phone: input.phone?.trim() || null,
      countryCode: input.countryCode?.trim() || null,
      passwordHash: hashPassword(input.password),
      createdAt: new Date().toISOString(),
    }).returning().get();
    // Removed seedStarterTasks call - new accounts start with zero tasks
    return createSession(created);
  }

  async loginUser(input: { email: string; password: string }): Promise<AuthResponse | undefined> {
    const user = db.select().from(users).where(eq(users.email, input.email)).get();
    if (!user || !verifyPassword(input.password, user.passwordHash)) return undefined;
    return createSession(user);
  }

  async getUserByToken(token: string): Promise<SafeUser | undefined> {
    const tokenHash = hashToken(token);
    const row = db
      .select({ user: users })
      .from(sessions)
      .innerJoin(users, eq(sessions.userId, users.id))
      .where(and(eq(sessions.tokenHash, tokenHash), gt(sessions.expiresAt, new Date().toISOString())))
      .get();
    return row ? safeUser(row.user) : undefined;
  }

  async logout(token: string): Promise<void> {
    db.delete(sessions).where(eq(sessions.tokenHash, hashToken(token))).run();
  }
}

export const storage = new DatabaseStorage();

// ---------- Auth helpers ----------
function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

function verifyPassword(password: string, stored: string): boolean {
  const [salt, original] = stored.split(":");
  if (!salt || !original) return false;
  const candidate = scryptSync(password, salt, 64);
  const originalBuffer = Buffer.from(original, "hex");
  return originalBuffer.length === candidate.length && timingSafeEqual(originalBuffer, candidate);
}

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

function safeUser(user: User): SafeUser {
  return { 
    id: user.id, 
    name: user.name, 
    email: user.email, 
    phone: user.phone ?? undefined,
    countryCode: user.countryCode ?? undefined,
    createdAt: user.createdAt 
  };
}

function createSession(user: User): AuthResponse {
  const token = randomBytes(32).toString("hex");
  const expires = new Date(Date.now() + 1000 * 60 * 60 * 24 * 30).toISOString();
  db.insert(sessions).values({
    userId: user.id,
    tokenHash: hashToken(token),
    expiresAt: expires,
    createdAt: new Date().toISOString(),
  }).run();
  return { user: safeUser(user), token };
}

// Removed seedStarterTasks function completely
// Removed seedDemoAccount function call - demo account seeding is no longer needed
