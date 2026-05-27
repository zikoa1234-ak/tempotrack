import { useMemo, useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, CalendarDays } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TaskDialog } from "@/components/TaskDialog";
import { useTasks, isOverdue, formatDate } from "@/lib/tasks";
import type { Task } from "@shared/schema";
import { cn } from "@/lib/utils";

const PERIOD_TONE: Record<string, string> = {
  day: "bg-[hsl(var(--chart-1))]",
  month: "bg-[hsl(var(--chart-2))]",
  year: "bg-[hsl(var(--chart-3))]",
};

function bucketKey(t: Task): string {
  if (!t.dueDate) return "No date";
  const due = new Date(t.dueDate + "T00:00:00");
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diff = Math.round((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  if (diff < 0) return "Overdue";
  if (diff === 0) return "Today";
  if (diff === 1) return "Tomorrow";
  if (diff <= 7) return "This week";
  if (diff <= 30) return "This month";
  if (diff <= 90) return "Next 3 months";
  return "Later this year";
}

const BUCKET_ORDER = [
  "Overdue",
  "Today",
  "Tomorrow",
  "This week",
  "This month",
  "Next 3 months",
  "Later this year",
  "No date",
];

export default function Timeline() {
  const { data: tasks, isLoading } = useTasks();
  const [dialogOpen, setDialogOpen] = useState(false);

  const buckets = useMemo(() => {
    if (!tasks) return [] as Array<{ key: string; items: Task[] }>;
    const map = new Map<string, Task[]>();
    for (const t of tasks) {
      if (t.status === "done") continue;
      const k = bucketKey(t);
      const arr = map.get(k) ?? [];
      arr.push(t);
      map.set(k, arr);
    }
    return BUCKET_ORDER.filter((k) => map.has(k)).map((k) => ({
      key: k,
      items: (map.get(k) ?? []).sort((a, b) => (a.dueDate ?? "").localeCompare(b.dueDate ?? "")),
    }));
  }, [tasks]);

  return (
    <AppLayout
      title="Timeline"
      subtitle="Upcoming work, grouped by when it lands."
      actions={
        <Button size="sm" onClick={() => setDialogOpen(true)} data-testid="button-new-task" className="gap-1.5">
          <Plus className="h-4 w-4" /> New task
        </Button>
      }
    >
      {isLoading ? (
        <div className="space-y-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i}>
              <Skeleton className="h-4 w-24 mb-3" />
              <div className="space-y-2">
                {Array.from({ length: 3 }).map((__, j) => (
                  <Skeleton key={j} className="h-[64px] rounded-xl" />
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : buckets.length === 0 ? (
        <div
          className="rounded-xl border border-dashed border-border bg-card/50 p-10 text-center"
          data-testid="empty-timeline"
        >
          <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
            <CalendarDays className="h-4 w-4" />
          </div>
          <h3 className="mt-3 text-sm font-semibold">Your timeline is clear</h3>
          <p className="mt-1 text-sm text-muted-foreground max-w-sm mx-auto">
            Add tasks with target dates to see them scheduled here.
          </p>
          <Button size="sm" className="mt-4" onClick={() => setDialogOpen(true)} data-testid="button-empty-create">
            Add a task
          </Button>
        </div>
      ) : (
        <div className="space-y-7">
          {buckets.map(({ key, items }) => (
            <section key={key} data-testid={`bucket-${key.toLowerCase().replace(/\s+/g, "-")}`}>
              <header className="flex items-baseline gap-3 mb-2.5">
                <h2 className="text-sm font-semibold tracking-tight">{key}</h2>
                <span className="text-xs text-muted-foreground tabular-nums">{items.length}</span>
              </header>
              <ul className="space-y-2">
                {items.map((t) => (
                  <li
                    key={t.id}
                    className="rounded-xl border border-card-border bg-card p-4 flex items-start gap-3"
                    data-testid={`row-timeline-${t.id}`}
                  >
                    <span
                      className={cn("mt-1 h-2 w-2 shrink-0 rounded-full", PERIOD_TONE[t.period])}
                      aria-hidden
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                        <h3 className="text-sm font-medium leading-snug">{t.title}</h3>
                        <Badge variant="outline" className="font-normal capitalize" data-testid={`badge-period-${t.id}`}>
                          {t.period}
                        </Badge>
                        <span className="text-xs text-muted-foreground">{t.category}</span>
                      </div>
                      <div className="mt-2 flex items-center gap-3">
                        <Progress value={t.progress} className="h-1.5 flex-1 max-w-[240px]" />
                        <span className="text-xs tabular-nums text-muted-foreground">{t.progress}%</span>
                      </div>
                    </div>
                    <div className={cn("text-xs whitespace-nowrap", isOverdue(t) && "text-destructive")}>
                      {formatDate(t.dueDate)}
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}

      <TaskDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </AppLayout>
  );
}
