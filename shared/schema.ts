import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = sqliteTable("users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  phone: text("phone"),
  countryCode: text("country_code"),
  passwordHash: text("password_hash").notNull(),
  createdAt: text("created_at").notNull(),
});

export const sessions = sqliteTable("sessions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id").notNull().references(() => users.id),
  tokenHash: text("token_hash").notNull().unique(),
  expiresAt: text("expires_at").notNull(),
  createdAt: text("created_at").notNull(),
});

// Tasks/goals table — covers day, month, and year horizons
export const tasks = sqliteTable("tasks", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id").notNull().references(() => users.id),
  title: text("title").notNull(),
  notes: text("notes"),
  period: text("period").notNull(), // "day" | "month" | "year"
  status: text("status").notNull().default("todo"), // "todo" | "in_progress" | "done" | "overdue"
  progress: integer("progress").notNull().default(0), // 0-100
  priority: text("priority").notNull().default("medium"), // "low" | "medium" | "high"
  category: text("category").notNull().default("general"),
  dueDate: text("due_date"), // ISO date string YYYY-MM-DD
  startDate: text("start_date"), // ISO date string YYYY-MM-DD
  endDate: text("end_date"), // ISO date string YYYY-MM-DD
  timeEstimate: integer("time_estimate"), // minutes
  metricTarget: integer("metric_target"), // optional numeric goal
  metricUnit: text("metric_unit"),
  createdAt: text("created_at").notNull(),
});

export const insertTaskSchema = createInsertSchema(tasks).omit({
  id: true,
  userId: true,
  createdAt: true,
}).extend({
  period: z.enum(["day", "month", "year"]),
  status: z.enum(["todo", "in_progress", "done", "overdue"]).default("todo"),
  priority: z.enum(["low", "medium", "high"]).default("medium"),
  progress: z.number().int().min(0).max(100).default(0),
  title: z.string().min(1, "Title is required").max(200),
  category: z.string().min(1).max(60).default("general"),
  notes: z.string().max(2000).nullable().optional(),
  dueDate: z.string().nullable().optional(),
  startDate: z.string().nullable().optional(),
  endDate: z.string().nullable().optional(),
  timeEstimate: z.number().int().min(0).nullable().optional(),
  metricTarget: z.number().int().min(0).nullable().optional(),
  metricUnit: z.string().max(20).nullable().optional(),
});

export const updateTaskSchema = insertTaskSchema.partial();

export const registerSchema = z.object({
  name: z.string().min(1, "Name is required").max(80),
  email: z.string().email("Enter a valid email").max(160).transform((v) => v.toLowerCase().trim()),
  phone: z.string().max(20).optional(),
  countryCode: z.string().max(5).optional(),
  password: z.string().min(6, "Password must be at least 6 characters").max(120),
});

export const loginSchema = z.object({
  email: z.string().email("Enter a valid email").max(160).transform((v) => v.toLowerCase().trim()),
  password: z.string().min(1, "Password is required").max(120),
});

export type InsertTask = z.infer<typeof insertTaskSchema>;
export type UpdateTask = z.infer<typeof updateTaskSchema>;
export type Task = typeof tasks.$inferSelect;
export type User = typeof users.$inferSelect;
export type SafeUser = Pick<User, "id" | "name" | "email" | "phone" | "countryCode" | "createdAt">;
export type AuthResponse = { user: SafeUser; token: string };

export const PERIODS = ["day", "month", "year"] as const;
export const STATUSES = ["todo", "in_progress", "done", "overdue"] as const;
export const PRIORITIES = ["low", "medium", "high"] as const;
export const CATEGORIES = [
  "Work",
  "Health",
  "Learning",
  "Personal",
  "Finance",
  "Creative",
] as const;
