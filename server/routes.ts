import type { Express, Request, Response } from "express";
import type { Server } from "node:http";
import { storage } from "./storage";
import { insertTaskSchema, loginSchema, registerSchema, updateTaskSchema, type SafeUser } from "@shared/schema";
import { z } from "zod";

type AuthedRequest = Request & { user?: SafeUser; token?: string };

function tokenFrom(req: Request): string | undefined {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) return undefined;
  return header.slice("Bearer ".length).trim();
}

async function requireUser(req: AuthedRequest, res: Response, next: () => void) {
  const token = tokenFrom(req);
  if (!token) return res.status(401).json({ message: "Login required" });
  const user = await storage.getUserByToken(token);
  if (!user) return res.status(401).json({ message: "Session expired. Please log in again." });
  req.user = user;
  req.token = token;
  next();
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  app.post("/api/auth/register", async (req: Request, res: Response) => {
    const parsed = registerSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: "Invalid registration", issues: parsed.error.flatten() });
    }
    try {
      const auth = await storage.registerUser(parsed.data);
      return res.status(201).json(auth);
    } catch (error) {
      if ((error as Error).message === "EMAIL_EXISTS") {
        return res.status(409).json({ message: "This email already has an account." });
      }
      throw error;
    }
  });

  app.post("/api/auth/login", async (req: Request, res: Response) => {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: "Invalid login", issues: parsed.error.flatten() });
    }
    const auth = await storage.loginUser(parsed.data);
    if (!auth) return res.status(401).json({ message: "Email or password is incorrect." });
    res.json(auth);
  });

  app.get("/api/auth/me", requireUser, async (req: AuthedRequest, res: Response) => {
    res.json({ user: req.user });
  });

  app.post("/api/auth/logout", requireUser, async (req: AuthedRequest, res: Response) => {
    if (req.token) await storage.logout(req.token);
    res.status(204).end();
  });

  app.get("/api/tasks", requireUser, async (req: AuthedRequest, res: Response) => {
    const tasks = await storage.listTasks(req.user!.id);
    res.json(tasks);
  });

  app.get("/api/tasks/:id", requireUser, async (req: AuthedRequest, res: Response) => {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) return res.status(400).json({ message: "Invalid id" });
    const task = await storage.getTask(id, req.user!.id);
    if (!task) return res.status(404).json({ message: "Task not found" });
    res.json(task);
  });

  app.post("/api/tasks", requireUser, async (req: AuthedRequest, res: Response) => {
    const parsed = insertTaskSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: "Invalid task", issues: parsed.error.flatten() });
    }
    const created = await storage.createTask(parsed.data, req.user!.id);
    res.status(201).json(created);
  });

  app.patch("/api/tasks/:id", requireUser, async (req: AuthedRequest, res: Response) => {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) return res.status(400).json({ message: "Invalid id" });
    const parsed = updateTaskSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: "Invalid patch", issues: parsed.error.flatten() });
    }
    const updated = await storage.updateTask(id, req.user!.id, parsed.data);
    if (!updated) return res.status(404).json({ message: "Task not found" });
    res.json(updated);
  });

  app.delete("/api/tasks/:id", requireUser, async (req: AuthedRequest, res: Response) => {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) return res.status(400).json({ message: "Invalid id" });
    const ok = await storage.deleteTask(id, req.user!.id);
    if (!ok) return res.status(404).json({ message: "Task not found" });
    res.status(204).end();
  });

  return httpServer;
}
