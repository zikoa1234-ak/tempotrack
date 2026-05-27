import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Task, InsertTask, UpdateTask } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";

const TASKS_KEY = ["/api/tasks"] as const;

export function useTasks() {
  return useQuery<Task[]>({ queryKey: TASKS_KEY });
}

export function useCreateTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: InsertTask) => {
      const res = await apiRequest("POST", "/api/tasks", data);
      return (await res.json()) as Task;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: TASKS_KEY }),
  });
}

export function useUpdateTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, patch }: { id: number; patch: UpdateTask }) => {
      const res = await apiRequest("PATCH", `/api/tasks/${id}`, patch);
      return (await res.json()) as Task;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: TASKS_KEY }),
  });
}

export function useDeleteTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/tasks/${id}`);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: TASKS_KEY }),
  });
}

// ---- Helpers ----
export function isOverdue(t: Task): boolean {
  if (!t.dueDate || t.status === "done") return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(t.dueDate + "T00:00:00");
  return due.getTime() < today.getTime();
}

export function formatDate(iso: string | null | undefined): string {
  if (!iso) return "No date";
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

export function periodLabel(p: string): string {
  return p.charAt(0).toUpperCase() + p.slice(1);
}

export function priorityLabel(p: string): string {
  return p.charAt(0).toUpperCase() + p.slice(1);
}

export function statusLabel(s: string): string {
  if (s === "in_progress") return "In progress";
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

// Focus score: weighted blend of completion, on-time delivery, and momentum.
export function focusScore(tasks: Task[]): number {
  if (tasks.length === 0) return 0;
  const total = tasks.length;
  const done = tasks.filter((t) => t.status === "done").length;
  const inProgress = tasks.filter((t) => t.status === "in_progress").length;
  const overdue = tasks.filter((t) => isOverdue(t)).length;
  const avgProgress = tasks.reduce((s, t) => s + t.progress, 0) / total;

  // 60% completion %, 25% progress %, 15% on-time (overdue penalty)
  const completion = (done / total) * 100;
  const onTime = Math.max(0, 100 - (overdue / total) * 200);
  const momentum = Math.min(100, avgProgress + (inProgress / total) * 8);
  const score = completion * 0.6 + momentum * 0.25 + onTime * 0.15;
  return Math.round(score);
}
