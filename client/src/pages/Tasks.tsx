import { useMemo, useState } from "react";
import { Plus, Search, Pencil, Trash2, Check, CalendarDays, Sparkle } from "lucide-react";
import { AppLayout } from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TaskDialog } from "@/components/TaskDialog";
import {
  useTasks,
  useDeleteTask,
  useUpdateTask,
  isOverdue,
  formatDate,
  statusLabel,
  priorityLabel,
} from "@/lib/tasks";
import { useToast } from "@/hooks/use-toast";
import type { Task } from "@shared/schema";
import { cn } from "@/lib/utils";

type Period = "all" | "day" | "month" | "year";

const PRIORITY_TONE: Record<string, string> = {
  high: "bg-[hsl(var(--chart-5))]/15 text-[hsl(var(--chart-5))] border-[hsl(var(--chart-5))]/30",
  medium: "bg-[hsl(var(--chart-4))]/15 text-[hsl(var(--chart-4))] border-[hsl(var(--chart-4))]/30",
  low: "bg-muted text-muted-foreground border-border",
};

const STATUS_TONE: Record<string, string> = {
  done: "bg-[hsl(var(--chart-1))]/15 text-[hsl(var(--chart-1))] border-[hsl(var(--chart-1))]/30",
  in_progress: "bg-[hsl(var(--chart-2))]/15 text-[hsl(var(--chart-2))] border-[hsl(var(--chart-2))]/30",
  todo: "bg-muted text-muted-foreground border-border",
};

export default function Tasks() {
  const { data: tasks, isLoading } = useTasks();
  const deleteMutation = useDeleteTask();
  const updateMutation = useUpdateTask();
  const { toast } = useToast();

  const [period, setPeriod] = useState<Period>("all");
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [editing, setEditing] = useState<Task | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const filtered = useMemo(() => {
    if (!tasks) return [];
    const q = query.trim().toLowerCase();
    return tasks
      .filter((t) => (period === "all" ? true : t.period === period))
      .filter((t) => (statusFilter === "all" ? true : t.status === statusFilter))
      .filter((t) => (priorityFilter === "all" ? true : t.priority === priorityFilter))
      .filter((t) =>
        q
          ? t.title.toLowerCase().includes(q) ||
            t.category.toLowerCase().includes(q) ||
            (t.notes ?? "").toLowerCase().includes(q)
          : true
      );
  }, [tasks, period, query, statusFilter, priorityFilter]);

  const counts = useMemo(() => {
    if (!tasks) return { all: 0, day: 0, month: 0, year: 0 };
    return {
      all: tasks.length,
      day: tasks.filter((t) => t.period === "day").length,
      month: tasks.filter((t) => t.period === "month").length,
      year: tasks.filter((t) => t.period === "year").length,
    };
  }, [tasks]);

  function openNew() {
    setEditing(null);
    setDialogOpen(true);
  }

  function openEdit(t: Task) {
    setEditing(t);
    setDialogOpen(true);
  }

  async function markDone(t: Task) {
    const next = t.status === "done" ? "in_progress" : "done";
    await updateMutation.mutateAsync({
      id: t.id,
      patch: { status: next, progress: next === "done" ? 100 : Math.min(t.progress, 95) },
    });
    toast({
      title: next === "done" ? "Marked done" : "Reopened",
      description: t.title,
    });
  }

  async function handleDelete(t: Task) {
    await deleteMutation.mutateAsync(t.id);
    toast({ title: "Task deleted", description: t.title });
  }

  return (
    <AppLayout
      title="Tasks"
      subtitle="Capture, organize, and complete what matters."
      actions={
        <Button size="sm" onClick={openNew} data-testid="button-new-task" className="gap-1.5">
          <Plus className="h-4 w-4" /> New task
        </Button>
      }
    >
      <Tabs value={period} onValueChange={(v) => setPeriod(v as Period)}>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <TabsList data-testid="tabs-period">
            <TabsTrigger value="all" data-testid="tab-all">All <span className="ml-1.5 text-xs text-muted-foreground tabular-nums">{counts.all}</span></TabsTrigger>
            <TabsTrigger value="day" data-testid="tab-day">Day <span className="ml-1.5 text-xs text-muted-foreground tabular-nums">{counts.day}</span></TabsTrigger>
            <TabsTrigger value="month" data-testid="tab-month">Month <span className="ml-1.5 text-xs text-muted-foreground tabular-nums">{counts.month}</span></TabsTrigger>
            <TabsTrigger value="year" data-testid="tab-year">Year <span className="ml-1.5 text-xs text-muted-foreground tabular-nums">{counts.year}</span></TabsTrigger>
          </TabsList>

          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Search tasks…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="pl-8 w-48"
                data-testid="input-search"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-36" data-testid="select-filter-status"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="todo">To do</SelectItem>
                <SelectItem value="in_progress">In progress</SelectItem>
                <SelectItem value="done">Done</SelectItem>
              </SelectContent>
            </Select>
            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger className="w-36" data-testid="select-filter-priority"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All priorities</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <TabsContent value={period} className="mt-5 focus-visible:outline-none">
          {isLoading ? (
            <div className="space-y-2.5">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-[78px] rounded-xl" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <EmptyTaskState onCreate={openNew} hasAny={(tasks?.length ?? 0) > 0} />
          ) : (
            <ul className="space-y-2.5" data-testid="list-tasks">
              {filtered.map((t) => (
                <TaskRow
                  key={t.id}
                  task={t}
                  onEdit={() => openEdit(t)}
                  onDelete={() => handleDelete(t)}
                  onMarkDone={() => markDone(t)}
                />
              ))}
            </ul>
          )}
        </TabsContent>
      </Tabs>

      <TaskDialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) setEditing(null);
        }}
        task={editing}
        defaultPeriod={(period === "all" ? "day" : period) as any}
      />
    </AppLayout>
  );
}

function TaskRow({
  task,
  onEdit,
  onDelete,
  onMarkDone,
}: {
  task: Task;
  onEdit: () => void;
  onDelete: () => void;
  onMarkDone: () => void;
}) {
  const overdue = isOverdue(task);
  const done = task.status === "done";

  return (
    <li
      className={cn(
        "group rounded-xl border bg-card p-4 transition-colors",
        done ? "border-card-border opacity-90" : "border-card-border hover:border-primary/30"
      )}
      data-testid={`row-task-${task.id}`}
    >
      <div className="flex items-start gap-3">
        <button
          type="button"
          onClick={onMarkDone}
          aria-label={done ? "Reopen task" : "Mark task done"}
          data-testid={`button-toggle-done-${task.id}`}
          className={cn(
            "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition-colors",
            done
              ? "bg-[hsl(var(--chart-1))] border-[hsl(var(--chart-1))] text-white"
              : "border-input hover:border-primary"
          )}
        >
          {done && <Check className="h-3 w-3" />}
        </button>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <h3
              className={cn(
                "text-sm font-medium leading-snug",
                done && "line-through text-muted-foreground"
              )}
              data-testid={`text-task-title-${task.id}`}
            >
              {task.title}
            </h3>
            <Badge variant="outline" className="capitalize font-normal" data-testid={`badge-period-${task.id}`}>
              {task.period}
            </Badge>
            <Badge
              variant="outline"
              className={cn("capitalize font-normal", PRIORITY_TONE[task.priority])}
              data-testid={`badge-priority-${task.id}`}
            >
              {priorityLabel(task.priority)}
            </Badge>
            <Badge
              variant="outline"
              className={cn("font-normal", STATUS_TONE[task.status])}
              data-testid={`badge-status-${task.id}`}
            >
              {statusLabel(task.status)}
            </Badge>
            <span className="text-xs text-muted-foreground" data-testid={`text-category-${task.id}`}>
              {task.category}
            </span>
          </div>

          {task.notes && (
            <p className="mt-1.5 text-sm text-muted-foreground line-clamp-2">{task.notes}</p>
          )}

          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-muted-foreground">
            {task.dueDate && (
              <span className={cn("inline-flex items-center gap-1.5", overdue && "text-destructive")}>
                <CalendarDays className="h-3.5 w-3.5" />
                {overdue ? "Overdue · " : ""}{formatDate(task.dueDate)}
              </span>
            )}
            {task.metricTarget != null && (
              <span className="inline-flex items-center gap-1.5">
                <Sparkle className="h-3.5 w-3.5" />
                Target {task.metricTarget}{task.metricUnit ? ` ${task.metricUnit}` : ""}
              </span>
            )}
            {task.timeEstimate != null && task.timeEstimate > 0 && (
              <span>{task.timeEstimate} min</span>
            )}
          </div>

          <div className="mt-3 flex items-center gap-3">
            <Progress value={task.progress} className="h-1.5 flex-1" />
            <span className="text-xs tabular-nums text-muted-foreground w-9 text-right" data-testid={`text-progress-${task.id}`}>
              {task.progress}%
            </span>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-1">
          <Button
            size="icon"
            variant="ghost"
            aria-label="Edit task"
            onClick={onEdit}
            data-testid={`button-edit-${task.id}`}
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                size="icon"
                variant="ghost"
                aria-label="Delete task"
                data-testid={`button-delete-${task.id}`}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete this task?</AlertDialogTitle>
                <AlertDialogDescription>
                  "{task.title}" will be removed from your tracker. This can't be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel data-testid="button-cancel-delete">Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={onDelete}
                  data-testid="button-confirm-delete"
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    </li>
  );
}

function EmptyTaskState({ onCreate, hasAny }: { onCreate: () => void; hasAny: boolean }) {
  return (
    <div
      className="rounded-xl border border-dashed border-border bg-card/50 p-10 text-center"
      data-testid="empty-tasks"
    >
      <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
        <Plus className="h-4 w-4" />
      </div>
      <h3 className="mt-3 text-sm font-semibold">
        {hasAny ? "No tasks match these filters" : "Start tracking your tempo"}
      </h3>
      <p className="mt-1 text-sm text-muted-foreground max-w-sm mx-auto">
        {hasAny
          ? "Try clearing search or switching periods."
          : "Add your first task to begin building daily, monthly, and yearly momentum."}
      </p>
      {!hasAny && (
        <Button size="sm" className="mt-4" onClick={onCreate} data-testid="button-empty-create">
          Create your first task
        </Button>
      )}
    </div>
  );
}
