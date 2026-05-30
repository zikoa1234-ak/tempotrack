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
  periodLabel,
} from "@/lib/tasks";
import { useChartColors } from "@/lib/chartColors";
import { useI18n } from "@/lib/i18n";
import type { Task } from "@shared/schema";

export default function Dashboard() {
  const { data: tasks, isLoading } = useTasks();
  const [dialogOpen, setDialogOpen] = useState(false);
  const colors = useChartColors();
  const { t } = useI18n();
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
      { key: "day", label: t("tasks.day") },
      { key: "month", label: t("tasks.month") },
      { key: "year", label: t("tasks.year") },
    ] as const;
    return horizons.map((horizon) => {
      const subset = tasks.filter((t) => horizon.key === t.period);
      const total = subset.length;
      const done = subset.filter((t) => t.status === "done").length;
      const inProgress = subset.filter((t) => t.status === "in_progress").length;
      const todo = subset.filter((t) => t.status === "todo").length;
      const avgProgress = total === 0 ? 0 : Math.round(subset.reduce((s, t) => s + t.progress, 0) / total);
      return { period: horizon.label, done, "In progress": inProgress, "To do": todo, avgProgress, total };
    });
  }, [tasks, t]);

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
        priority: t(`tasks.${p}`),
        done: subset.filter((t) => t.status === "done").length,
        active: subset.filter((t) => t.status !== "done").length,
        total: subset.length,
      };
    });
  }, [tasks, t]);

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
      title={t("dashboard.dashboard")}
      subtitle={t("dashboard.subtitle")}
      actions={
        <Button
          size="sm"
          onClick={() => setDialogOpen(true)}
          data-testid="button-new-task"
          className="gap-1.5"
        >
          <Plus className="h-4 w-4" />
          {t("tasks.newTask")}
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
              label={t("dashboard.completion")}
              value={`${stats.completionRate}%`}
              delta={t("dashboard.ofTasksDone", { total: stats.total })}
              icon={CheckCircle2}
              tone="positive"
              testId="card-stat-completion"
            />
            <StatCard
              label={t("dashboard.focusScore")}
              value={score}
              delta={t("dashboard.momentum")}
              icon={Sparkles}
              testId="card-stat-focus"
            />
            <StatCard
              label={t("dashboard.highPriority")}
              value={stats.highPriority}
              delta={t("dashboard.activeAndImportant")}
              icon={Flame}
              tone="warning"
              testId="card-stat-high-priority"
            />
            <StatCard
              label={t("dashboard.overdue")}
              value={stats.overdue}
              delta={stats.overdue > 0 ? t("dashboard.needsAttention") : t("dashboard.allClear")}
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
              <h2 className="text-base font-semibold tracking-tight">{t("dashboard.progressByPeriod")}</h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                {t("dashboard.cumulativeView")}
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
                  <Bar dataKey="done" name={t("tasks.done")} stackId="a" fill={colors.chart1} radius={[0, 0, 0, 0]} />
                  <Bar dataKey="In progress" name={t("tasks.inProgress")} stackId="a" fill={colors.chart2} />
                  <Bar dataKey="To do" name={t("tasks.todo")} stackId="a" fill={colors.chart3} radius={[6, 6, 0, 0]} />
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
          <h2 className="text-base font-semibold tracking-tight">{t("dashboard.byCategory")}</h2>
          <p className="text-xs text-muted-foreground mt-0.5">{t("dashboard.whereYourFocusLives")}</p>
          <div className="mt-4 h-[220px]">
            {isLoading ? (
              <Skeleton className="h-full w-full" />
            ) : categoryData.length === 0 ? (
              <EmptyState label={t("dashboard.noTasksYet")} />
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
          <h2 className="text-base font-semibold tracking-tight">{t("dashboard.priorityPulse")}</h2>
          <p className="text-xs text-muted-foreground mt-0.5">{t("dashboard.doneVsActive")}</p>
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
                  <Bar dataKey="done" name={t("tasks.done")} stackId="a" fill={colors.chart1} />
                  <Bar dataKey="active" name={t("dashboard.inProgress")} stackId="a" fill={colors.chart4} radius={[0, 6, 6, 0]}>
                    <LabelList dataKey="total" position="right" fill={colors.mutedForeground} fontSize={11} />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Avg progress trend */}
        <div className="rounded-xl border border-card-border bg-card p-5" data-testid="card-chart-trend">
          <h2 className="text-base font-semibold tracking-tight">{t("dashboard.avgProgress")}</h2>
          <p className="text-xs text-muted-foreground mt-0.5">{t("dashboard.acrossTrackingHorizon")}</p>
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
              <h2 className="text-base font-semibold tracking-tight">{t("dashboard.upNext")}</h2>
              <p className="text-xs text-muted-foreground mt-0.5">{t("dashboard.soonestTargetDates")}</p>
            </div>
            <Link
              href="/tasks"
              className="text-xs text-primary hover:underline inline-flex items-center gap-1"
              data-testid="link-view-all-tasks"
            >
              {t("dashboard.viewAll")} <ArrowRight className="h-3 w-3" />
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
                <EmptyState label={t("dashboard.nothingScheduled")} />
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
  const { t } = useI18n();
  const overdue = isOverdue(task);
  const periodText = periodLabel(task.period);
  
  return (
    <li className="py-2.5" data-testid={`row-upcoming-${task.id}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium">{task.title}</p>
          <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
            <Badge variant="outline" className="font-normal capitalize" data-testid={`badge-period-${task.id}`}>
              {periodText}
            </Badge>
            <span className={overdue ? "text-destructive" : ""}>
              {overdue ? t("tasks.overdue") : ""}{formatDate(task.dueDate)}
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
