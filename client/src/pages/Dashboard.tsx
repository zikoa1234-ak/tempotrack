import { useMemo, useState } from "react";
import {
  CheckCircle2,
  Flame,
  AlertTriangle,
  Target,
  Plus,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend,
  LabelList,
} from "recharts";
import { Link } from "wouter";
import { AppLayout } from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { StatCard } from "@/components/StatCard";
import { TaskDialog } from "@/components/TaskDialog";
import {
  useTasks,
  isOverdue,
  focusScore,
  formatDate,
} from "@/lib/tasks";
import { useChartColors } from "@/lib/chartColors";
import type { Task } from "@shared/schema";

export default function Dashboard() {
  const { data: tasks, isLoading } = useTasks();
  const [dialogOpen, setDialogOpen] = useState(false);
  const colors = useChartColors();
  const palette = [colors.chart1, colors.chart2, colors.chart3, colors.chart4, colors.chart5, colors.chart6];

  const stats = useMemo(() => {
    if (!tasks) return null;
    const total = tasks.length;
    const done = tasks.filter((t) => t.status === "done").length;
    const overdue = tasks.filter((t) => isOverdue(t)).length;
    const highPriority = tasks.filter((t) => t.priority === "high" && t.status !== "done").length;
    const completionRate = total === 0 ? 0 : Math.round((done / total) * 100);
    return { total, done, overdue, highPriority, completionRate };
  }, [tasks]);

  const periodData = useMemo(() => {
    if (!tasks) return [];
    const horizons = [
      { key: "day", label: "Day", includes: ["day"] },
      { key: "month", label: "Month", includes: ["day", "month"] },
      { key: "year", label: "Year", includes: ["day", "month", "year"] },
    ] as const;
    return horizons.map((horizon) => {
      const subset = tasks.filter((t) => horizon.includes.includes(t.period as any));
      const total = subset.length;
      const done = subset.filter((t) => t.status === "done").length;
      const inProgress = subset.filter((t) => t.status === "in_progress").length;
      const todo = subset.filter((t) => t.status === "todo").length;
      const avgProgress = total === 0 ? 0 : Math.round(subset.reduce((s, t) => s + t.progress, 0) / total);
      return { period: horizon.label, done, "In progress": inProgress, "To do": todo, avgProgress, total };
    });
  }, [tasks]);

  const categoryData = useMemo(() => {
    if (!tasks) return [];
    const map = new Map<string, number>();
    tasks.forEach((t) => map.set(t.category, (map.get(t.category) ?? 0) + 1));
    return Array.from(map.entries()).map(([name, value]) => ({ name, value }));
  }, [tasks]);

  const priorityData = useMemo(() => {
    if (!tasks) return [];
    const order: Array<"high" | "medium" | "low"> = ["high", "medium", "low"];
    return order.map((p) => {
      const subset = tasks.filter((t) => t.priority === p);
      return {
        priority: p.charAt(0).toUpperCase() + p.slice(1),
        done: subset.filter((t) => t.status === "done").length,
        active: subset.filter((t) => t.status !== "done").length,
        total: subset.length,
      };
    });
  }, [tasks]);

  const score = useMemo(() => (tasks ? focusScore(tasks) : 0), [tasks]);

  const upcoming = useMemo(() => {
    if (!tasks) return [];
    return tasks
      .filter((t) => t.status !== "done" && t.dueDate)
      .sort((a, b) => (a.dueDate! < b.dueDate! ? -1 : 1))
      .slice(0, 5);
  }, [tasks]);

  return (
    <AppLayout
      title="Dashboard"
      subtitle="A clear pulse on day, month, and year."
      actions={
        <Button
          size="sm"
          onClick={() => setDialogOpen(true)}
          data-testid="button-new-task"
          className="gap-1.5"
        >
          <Plus className="h-4 w-4" />
          New task
        </Button>
      }
    >
      {/* KPI grid */}
      <section
        className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4"
        aria-label="Key metrics"
      >
        {isLoading || !stats ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-[110px] rounded-xl" />
          ))
        ) : (
          <>
            <StatCard
              label="Completion"
              value={`${stats.completionRate}%`}
              delta={`${stats.done} of ${stats.total} tasks done`}
              icon={CheckCircle2}
              tone="positive"
              testId="card-stat-completion"
            />
            <StatCard
              label="Focus score"
              value={score}
              delta="Completion · momentum · on-time"
              icon={Sparkles}
              testId="card-stat-focus"
            />
            <StatCard
              label="High priority"
              value={stats.highPriority}
              delta="Active and important"
              icon={Flame}
              tone="warning"
              testId="card-stat-high-priority"
            />
            <StatCard
              label="Overdue"
              value={stats.overdue}
              delta={stats.overdue > 0 ? "Needs attention" : "All clear"}
              icon={AlertTriangle}
              tone={stats.overdue > 0 ? "negative" : "default"}
              testId="card-stat-overdue"
            />
          </>
        )}
      </section>

      {/* Charts row */}
      <section className="mt-6 grid grid-cols-1 xl:grid-cols-3 gap-4">
        {/* Period progress */}
        <div
          className="xl:col-span-2 rounded-xl border border-card-border bg-card p-5"
          data-testid="card-chart-period"
        >
          <div className="flex items-baseline justify-between">
            <div>
              <h2 className="text-base font-semibold tracking-tight">Progress by period</h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Cumulative view: day, month-to-date, and full year.
              </p>
            </div>
          </div>
          <div className="mt-4 h-[260px]">
            {isLoading ? (
              <Skeleton className="h-full w-full" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={periodData} barGap={6} barCategoryGap="25%">
                  <CartesianGrid stroke={colors.border} strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="period" stroke={colors.mutedForeground} fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke={colors.mutedForeground} fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{
                      background: colors.popover,
                      border: `1px solid ${colors.popoverBorder}`,
                      borderRadius: 8,
                      fontSize: 12,
                      color: colors.popoverForeground,
                    }}
                    cursor={{ fill: colors.accent, opacity: 0.4 }}
                  />
                  <Legend
                    wrapperStyle={{ fontSize: 12, color: colors.mutedForeground, paddingTop: 6 }}
                    iconType="circle"
                  />
                  <Bar dataKey="done" name="Done" stackId="a" fill={colors.chart1} radius={[0, 0, 0, 0]} />
                  <Bar dataKey="In progress" stackId="a" fill={colors.chart2} />
                  <Bar dataKey="To do" stackId="a" fill={colors.chart3} radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Category distribution */}
        <div
          className="rounded-xl border border-card-border bg-card p-5"
          data-testid="card-chart-category"
        >
          <h2 className="text-base font-semibold tracking-tight">By category</h2>
          <p className="text-xs text-muted-foreground mt-0.5">Where your focus lives.</p>
          <div className="mt-4 h-[220px]">
            {isLoading ? (
              <Skeleton className="h-full w-full" />
            ) : categoryData.length === 0 ? (
              <EmptyState label="No tasks yet" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryData}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={2}
                  >
                    {categoryData.map((_, i) => (
                      <Cell key={i} fill={palette[i % palette.length]} stroke={colors.card} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      background: colors.popover,
                      border: `1px solid ${colors.popoverBorder}`,
                      borderRadius: 8,
                      fontSize: 12,
                      color: colors.popoverForeground,
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
          <ul className="mt-3 grid grid-cols-2 gap-x-3 gap-y-1.5 text-xs">
            {categoryData.map((cat, i) => (
              <li key={cat.name} className="flex items-center gap-2 text-muted-foreground" data-testid={`legend-category-${cat.name}`}>
                <span
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ background: palette[i % palette.length] }}
                  aria-hidden
                />
                <span className="text-foreground truncate">{cat.name}</span>
                <span className="ml-auto tabular-nums">{cat.value}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Priority + upcoming row */}
      <section className="mt-4 grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div
          className="rounded-xl border border-card-border bg-card p-5"
          data-testid="card-chart-priority"
        >
          <h2 className="text-base font-semibold tracking-tight">Priority pulse</h2>
          <p className="text-xs text-muted-foreground mt-0.5">Done vs. active, labeled by total tasks.</p>
          <div className="mt-4 h-[220px]">
            {isLoading ? (
              <Skeleton className="h-full w-full" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={priorityData} layout="vertical" barCategoryGap="30%" margin={{ top: 8, right: 22, bottom: 18, left: 4 }}>
                  <CartesianGrid stroke={colors.border} strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" stroke={colors.mutedForeground} fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
                  <YAxis type="category" dataKey="priority" stroke={colors.mutedForeground} fontSize={12} tickLine={false} axisLine={false} width={60} />
                  <Tooltip
                    contentStyle={{
                      background: colors.popover,
                      border: `1px solid ${colors.popoverBorder}`,
                      borderRadius: 8,
                      fontSize: 12,
                      color: colors.popoverForeground,
                    }}
                    cursor={{ fill: colors.accent, opacity: 0.4 }}
                  />
                  <Legend wrapperStyle={{ fontSize: 12, color: colors.mutedForeground, paddingTop: 6 }} iconType="circle" />
                  <Bar dataKey="done" name="Done" stackId="a" fill={colors.chart1} />
                  <Bar dataKey="active" name="Active" stackId="a" fill={colors.chart4} radius={[0, 6, 6, 0]}>
                    <LabelList dataKey="total" position="right" fill={colors.mutedForeground} fontSize={11} />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Avg progress trend */}
        <div className="rounded-xl border border-card-border bg-card p-5" data-testid="card-chart-trend">
          <h2 className="text-base font-semibold tracking-tight">Avg. progress</h2>
          <p className="text-xs text-muted-foreground mt-0.5">Across each tracking horizon.</p>
          <div className="mt-4 h-[220px]">
            {isLoading ? (
              <Skeleton className="h-full w-full" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={periodData}>
                  <CartesianGrid stroke={colors.border} strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="period" stroke={colors.mutedForeground} fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke={colors.mutedForeground} fontSize={12} tickLine={false} axisLine={false} domain={[0, 100]} />
                  <Tooltip
                    contentStyle={{
                      background: colors.popover,
                      border: `1px solid ${colors.popoverBorder}`,
                      borderRadius: 8,
                      fontSize: 12,
                      color: colors.popoverForeground,
                    }}
                    formatter={(v: any) => `${v}%`}
                  />
                  <Line type="monotone" dataKey="avgProgress" stroke={colors.primary} strokeWidth={2.5} dot={{ r: 4, strokeWidth: 0, fill: colors.primary }} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Upcoming list */}
        <div
          className="rounded-xl border border-card-border bg-card p-5 flex flex-col"
          data-testid="card-upcoming"
        >
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold tracking-tight">Up next</h2>
              <p className="text-xs text-muted-foreground mt-0.5">Soonest target dates first.</p>
            </div>
            <Link
              href="/tasks"
              className="text-xs text-primary hover:underline inline-flex items-center gap-1"
              data-testid="link-view-all-tasks"
            >
              View all <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          <ul className="mt-3 flex-1 divide-y divide-border">
            {isLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <li key={i} className="py-2.5">
                  <Skeleton className="h-4 w-2/3" />
                  <Skeleton className="mt-2 h-3 w-1/3" />
                </li>
              ))
            ) : upcoming.length === 0 ? (
              <li className="py-6">
                <EmptyState label="Nothing scheduled" />
              </li>
            ) : (
              upcoming.map((t) => <UpcomingRow key={t.id} task={t} />)
            )}
          </ul>
        </div>
      </section>

      <TaskDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </AppLayout>
  );
}

function UpcomingRow({ task }: { task: Task }) {
  const overdue = isOverdue(task);
  return (
    <li className="py-2.5" data-testid={`row-upcoming-${task.id}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium">{task.title}</p>
          <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
            <Badge variant="outline" className="font-normal capitalize" data-testid={`badge-period-${task.id}`}>
              {task.period}
            </Badge>
            <span className={overdue ? "text-destructive" : ""}>
              {overdue ? "Overdue · " : ""}{formatDate(task.dueDate)}
            </span>
          </div>
        </div>
        <div className="w-16 shrink-0">
          <Progress value={task.progress} className="h-1.5" />
          <p className="mt-1 text-right text-[10px] tabular-nums text-muted-foreground">{task.progress}%</p>
        </div>
      </div>
    </li>
  );
}

function EmptyState({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center justify-center text-center h-full gap-2 py-4">
      <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center" aria-hidden>
        <Target className="h-4 w-4 text-muted-foreground" />
      </div>
      <p className="text-sm text-muted-foreground">{label}</p>
    </div>
  );
}
