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
    time_estimate INTEGER,
    metric_target INTEGER,
    metric_unit TEXT,
    created_at TEXT NOT NULL
  );
`);

const taskColumns = sqlite.prepare("PRAGMA table_info(tasks)").all() as Array<{ name: string }>;
if (!taskColumns.some((c) => c.name === "user_id")) {
  sqlite.exec("ALTER TABLE tasks ADD COLUMN user_id INTEGER NOT NULL DEFAULT 1;");
}

export const db = drizzle(sqlite);

export interface IStorage {
  listTasks(userId: number): Promise<Task[]>;
  getTask(id: number, userId: number): Promise<Task | undefined>;
  createTask(task: InsertTask, userId: number): Promise<Task>;
  updateTask(id: number, userId: number, patch: UpdateTask): Promise<Task | undefined>;
  deleteTask(id: number, userId: number): Promise<boolean>;
  registerUser(input: { name: string; email: string; password: string }): Promise<AuthResponse>;
  loginUser(input: { email: string; password: string }): Promise<AuthResponse | undefined>;
  getUserByToken(token: string): Promise<SafeUser | undefined>;
  logout(token: string): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  async listTasks(userId: number): Promise<Task[]> {
    return db.select().from(tasks).where(eq(tasks.userId, userId)).orderBy(desc(tasks.createdAt)).all();
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

  async registerUser(input: { name: string; email: string; password: string }): Promise<AuthResponse> {
    const existing = db.select().from(users).where(eq(users.email, input.email)).get();
    if (existing) throw new Error("EMAIL_EXISTS");
    const created = db.insert(users).values({
      name: input.name.trim(),
      email: input.email,
      passwordHash: hashPassword(input.password),
      createdAt: new Date().toISOString(),
    }).returning().get();
    seedStarterTasks(created.id);
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
  return { id: user.id, name: user.name, email: user.email, createdAt: user.createdAt };
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

// ---------- Seed starter data ----------
function seedStarterTasks(userId: number) {
  const count = sqlite.prepare("SELECT COUNT(*) as c FROM tasks WHERE user_id = ?").get(userId) as { c: number };
  if (count.c > 0) return;
  const today = new Date();
  const iso = (d: Date) => d.toISOString().slice(0, 10);
  const addDays = (n: number) => {
    const d = new Date(today);
    d.setDate(d.getDate() + n);
    return iso(d);
  };
  const addMonths = (n: number) => {
    const d = new Date(today);
    d.setMonth(d.getMonth() + n);
    return iso(d);
  };

  const seedRows: Omit<Task, "id">[] = [
    // -------- Day items --------
    { userId, title: "Morning deep work block", notes: "Two pomodoros on the API refactor.", period: "day", status: "done", progress: 100, priority: "high", category: "Work", dueDate: iso(today), timeEstimate: 90, metricTarget: null, metricUnit: null, createdAt: new Date(Date.now() - 86400000 * 2).toISOString() },
    { userId, title: "30 minute strength workout", notes: "Push day — bench, OHP, accessories.", period: "day", status: "done", progress: 100, priority: "medium", category: "Health", dueDate: iso(today), timeEstimate: 30, metricTarget: null, metricUnit: null, createdAt: new Date(Date.now() - 86400000 * 1).toISOString() },
    { userId, title: "Review PRs from team", notes: null, period: "day", status: "in_progress", progress: 45, priority: "high", category: "Work", dueDate: iso(today), timeEstimate: 45, metricTarget: null, metricUnit: null, createdAt: new Date(Date.now() - 3600_000 * 5).toISOString() },
    { userId, title: "Read 20 pages of current book", notes: "Currently: Designing Data-Intensive Apps.", period: "day", status: "todo", progress: 0, priority: "low", category: "Learning", dueDate: iso(today), timeEstimate: 25, metricTarget: 20, metricUnit: "pages", createdAt: new Date(Date.now() - 3600_000 * 3).toISOString() },
    { userId, title: "Inbox zero before EOD", notes: null, period: "day", status: "todo", progress: 30, priority: "medium", category: "Work", dueDate: iso(today), timeEstimate: 20, metricTarget: null, metricUnit: null, createdAt: new Date(Date.now() - 3600_000 * 2).toISOString() },
    { userId, title: "Plan tomorrow in journal", notes: "Three priorities + one big rock.", period: "day", status: "todo", progress: 0, priority: "low", category: "Personal", dueDate: iso(today), timeEstimate: 10, metricTarget: null, metricUnit: null, createdAt: new Date(Date.now() - 3600_000).toISOString() },
    { userId, title: "Cook dinner at home", notes: null, period: "day", status: "todo", progress: 0, priority: "low", category: "Personal", dueDate: iso(today), timeEstimate: 40, metricTarget: null, metricUnit: null, createdAt: new Date().toISOString() },
    { userId, title: "Call mom", notes: "Sunday catch-up.", period: "day", status: "done", progress: 100, priority: "medium", category: "Personal", dueDate: addDays(-1), timeEstimate: 20, metricTarget: null, metricUnit: null, createdAt: new Date(Date.now() - 86400000 * 1).toISOString() },
    { userId, title: "Submit expense report", notes: null, period: "day", status: "todo", progress: 0, priority: "high", category: "Finance", dueDate: addDays(-1), timeEstimate: 15, metricTarget: null, metricUnit: null, createdAt: new Date(Date.now() - 86400000 * 2).toISOString() },

    // -------- Month items --------
    { userId, title: "Ship analytics v2 milestone", notes: "Cohort retention + onboarding funnel.", period: "month", status: "in_progress", progress: 65, priority: "high", category: "Work", dueDate: addDays(12), timeEstimate: 2400, metricTarget: null, metricUnit: null, createdAt: new Date(Date.now() - 86400000 * 12).toISOString() },
    { userId, title: "Run 60 km this month", notes: "Build base for fall half-marathon.", period: "month", status: "in_progress", progress: 42, priority: "medium", category: "Health", dueDate: addDays(20), timeEstimate: null, metricTarget: 60, metricUnit: "km", createdAt: new Date(Date.now() - 86400000 * 15).toISOString() },
    { userId, title: "Finish System Design course", notes: "12 of 20 modules complete.", period: "month", status: "in_progress", progress: 60, priority: "medium", category: "Learning", dueDate: addDays(18), timeEstimate: 900, metricTarget: 20, metricUnit: "modules", createdAt: new Date(Date.now() - 86400000 * 22).toISOString() },
    { userId, title: "Save $1,200 toward emergency fund", notes: null, period: "month", status: "in_progress", progress: 75, priority: "high", category: "Finance", dueDate: addDays(15), timeEstimate: null, metricTarget: 1200, metricUnit: "USD", createdAt: new Date(Date.now() - 86400000 * 20).toISOString() },
    { userId, title: "Publish two blog essays", notes: null, period: "month", status: "todo", progress: 25, priority: "low", category: "Creative", dueDate: addDays(22), timeEstimate: 600, metricTarget: 2, metricUnit: "posts", createdAt: new Date(Date.now() - 86400000 * 10).toISOString() },
    { userId, title: "Quarterly team 1:1 round", notes: "Schedule 30-min sessions with each report.", period: "month", status: "done", progress: 100, priority: "medium", category: "Work", dueDate: addDays(-3), timeEstimate: 240, metricTarget: null, metricUnit: null, createdAt: new Date(Date.now() - 86400000 * 25).toISOString() },
    { userId, title: "Cook a new recipe every week", notes: null, period: "month", status: "in_progress", progress: 50, priority: "low", category: "Personal", dueDate: addDays(14), timeEstimate: null, metricTarget: 4, metricUnit: "recipes", createdAt: new Date(Date.now() - 86400000 * 18).toISOString() },

    // -------- Year items --------
    { userId, title: "Reach intermediate Spanish (B1)", notes: "Daily Anki + weekly tutor session.", period: "year", status: "in_progress", progress: 40, priority: "medium", category: "Learning", dueDate: addMonths(8), timeEstimate: null, metricTarget: null, metricUnit: null, createdAt: new Date(Date.now() - 86400000 * 120).toISOString() },
    { userId, title: "Run a half marathon under 1:50", notes: null, period: "year", status: "in_progress", progress: 35, priority: "high", category: "Health", dueDate: addMonths(6), timeEstimate: null, metricTarget: 110, metricUnit: "minutes", createdAt: new Date(Date.now() - 86400000 * 80).toISOString() },
    { userId, title: "Save $20,000", notes: "Increase 401(k) contribution + cut subscriptions.", period: "year", status: "in_progress", progress: 55, priority: "high", category: "Finance", dueDate: addMonths(7), timeEstimate: null, metricTarget: 20000, metricUnit: "USD", createdAt: new Date(Date.now() - 86400000 * 150).toISOString() },
    { userId, title: "Read 24 books", notes: null, period: "year", status: "in_progress", progress: 58, priority: "low", category: "Learning", dueDate: addMonths(9), timeEstimate: null, metricTarget: 24, metricUnit: "books", createdAt: new Date(Date.now() - 86400000 * 200).toISOString() },
    { userId, title: "Launch side project to 100 users", notes: "Beta open, 38 signups so far.", period: "year", status: "in_progress", progress: 38, priority: "high", category: "Creative", dueDate: addMonths(5), timeEstimate: null, metricTarget: 100, metricUnit: "users", createdAt: new Date(Date.now() - 86400000 * 100).toISOString() },
    { userId, title: "Take two weeks off-grid", notes: "Plan in early autumn.", period: "year", status: "todo", progress: 10, priority: "medium", category: "Personal", dueDate: addMonths(4), timeEstimate: null, metricTarget: null, metricUnit: null, createdAt: new Date(Date.now() - 86400000 * 50).toISOString() },
    { userId, title: "Reach senior engineer level", notes: "Mentor two juniors + lead one cross-team project.", period: "year", status: "in_progress", progress: 50, priority: "high", category: "Work", dueDate: addMonths(10), timeEstimate: null, metricTarget: null, metricUnit: null, createdAt: new Date(Date.now() - 86400000 * 180).toISOString() },
  ];

  const insert = sqlite.prepare(`
    INSERT INTO tasks (user_id, title, notes, period, status, progress, priority, category, due_date, time_estimate, metric_target, metric_unit, created_at)
    VALUES (@userId, @title, @notes, @period, @status, @progress, @priority, @category, @dueDate, @timeEstimate, @metricTarget, @metricUnit, @createdAt)
  `);
  const tx = sqlite.transaction((rows: typeof seedRows) => {
    for (const r of rows) insert.run(r as any);
  });
  tx(seedRows);
}

function seedDemoAccount() {
  let demo = db.select().from(users).where(eq(users.email, "demo@tempotrack.app")).get();
  if (!demo) {
    demo = db.insert(users).values({
      name: "Demo User",
      email: "demo@tempotrack.app",
      passwordHash: hashPassword("demo123"),
      createdAt: new Date().toISOString(),
    }).returning().get();
  }
  sqlite.prepare("UPDATE tasks SET user_id = ? WHERE user_id IS NULL OR user_id = 1").run(demo.id);
  seedStarterTasks(demo.id);
}

seedDemoAccount();
