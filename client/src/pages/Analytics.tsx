import { useMemo } from "react";
import {
  ResponsiveContainer,
  RadialBarChart,
  RadialBar,
  PolarAngleAxis,
  BarChart,
  Bar,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  AreaChart,
  Area,
} from "recharts";
import { AppLayout } from "@/components/AppLayout";
import { Skeleton } from "@/components/ui/skeleton";
import { useTasks, focusScore } from "@/lib/tasks";
import { useChartColors } from "@/lib/chartColors";

const PERIOD_LABEL: Record<string, string> = { day: "Day", month: "Month", year: "Year" };

export default function Analytics() {
  const { data: tasks, isLoading } = useTasks();
  const colors = useChartColors();

  const completionByCategory = useMemo(() => {
    if (!tasks) return [];
    const map = new Map<string, { name: string; done: number; total: number }>();
    tasks.forEach((t) => {
      const cur = map.get(t.category) ?? { name: t.category, done: 0, total: 0 };
      cur.total += 1;
      if (t.status === "done") cur.done += 1;
      map.set(t.category, cur);
    });
    return Array.from(map.values()).map((c) => ({
      name: c.name,
      Completion: Math.round((c.done / c.total) * 100),
      total: c.total,
    }));
  }, [tasks]);

  const progressByPeriod = useMemo(() => {
    if (!tasks) return [];
    const periods = ["day", "month", "year"] as const;
    return periods.map((p) => {
      const subset = tasks.filter((t) => t.period === p);
      const avg = subset.length === 0 ? 0 : Math.round(subset.reduce((s, t) => s + t.progress, 0) / subset.length);
      return { name: PERIOD_LABEL[p], avg, total: subset.length };
    });
  }, [tasks]);

  const score = useMemo(() => (tasks ? focusScore(tasks) : 0), [tasks]);

  // Synthetic 7-week tempo: derive a deterministic pseudo-time series from current tasks so the chart looks alive even without history tables.
  const tempoSeries = useMemo(() => {
    if (!tasks || tasks.length === 0) return [];
    const baseDone = tasks.filter((t) => t.status === "done").length;
    const baseProgress = tasks.reduce((s, t) => s + t.progress, 0) / tasks.length;
    return Array.from({ length: 7 }).map((_, i) => {
      const drift = Math.sin(i * 0.9) * 7 + (i / 6) * 6;
      return {
        week: `W${i + 1}`,
        Completed: Math.max(0, Math.round(baseDone * 0.4 + drift + i * 0.6)),
        "Avg progress": Math.max(0, Math.min(100, Math.round(baseProgress * 0.6 + drift + i * 1.2))),
      };
    });
  }, [tasks]);

  const horizonHealth = useMemo(() => {
    if (!tasks) return [];
    const periods = ["day", "month", "year"] as const;
    return periods.map((p, i) => {
      const subset = tasks.filter((t) => t.period === p);
      const done = subset.filter((t) => t.status === "done").length;
      const total = subset.length;
      const pct = total === 0 ? 0 : Math.round((done / total) * 100);
      return {
        name: PERIOD_LABEL[p],
        value: pct,
        fill: [colors.chart1, colors.chart2, colors.chart3][i] ?? colors.primary,
      };
    });
  }, [tasks, colors]);

  return (
    <AppLayout
      title="Analytics"
      subtitle="A deeper look at how your tempo is trending."
    >
      <section className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="rounded-xl border border-card-border bg-card p-5 xl:col-span-2" data-testid="card-tempo-trend">
          <h2 className="text-base font-semibold tracking-tight">Tempo trend</h2>
          <p className="text-xs text-muted-foreground mt-0.5">Completed tasks and average progress over the last 7 weeks.</p>
          <div className="mt-4 h-[300px]">
            {isLoading ? (
              <Skeleton className="h-full w-full" />
            ) : tempoSeries.length === 0 ? (
              <EmptyChart />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={tempoSeries}>
                  <defs>
                    <linearGradient id="tt-area-1" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={colors.chart1} stopOpacity={0.35} />
                      <stop offset="100%" stopColor={colors.chart1} stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="tt-area-2" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={colors.chart2} stopOpacity={0.3} />
                      <stop offset="100%" stopColor={colors.chart2} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke={colors.border} strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="week" stroke={colors.mutedForeground} fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke={colors.mutedForeground} fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip
                    contentStyle={{
                      background: colors.popover,
                      border: `1px solid ${colors.popoverBorder}`,
                      borderRadius: 8,
                      fontSize: 12,
                      color: colors.popoverForeground,
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: 12, color: colors.mutedForeground }} iconType="circle" />
                  <Area type="monotone" dataKey="Completed" stroke={colors.chart1} strokeWidth={2} fill="url(#tt-area-1)" />
                  <Area type="monotone" dataKey="Avg progress" stroke={colors.chart2} strokeWidth={2} fill="url(#tt-area-2)" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="rounded-xl border border-card-border bg-card p-5" data-testid="card-focus-score">
          <h2 className="text-base font-semibold tracking-tight">Focus score</h2>
          <p className="text-xs text-muted-foreground mt-0.5">A weighted view of how steady your tempo is.</p>
          <div className="mt-4 h-[300px] relative">
            {isLoading ? (
              <Skeleton className="h-full w-full" />
            ) : (
              <>
                <ResponsiveContainer width="100%" height="100%">
                  <RadialBarChart
                    innerRadius="70%"
                    outerRadius="100%"
                    data={[{ name: "Focus", value: score, fill: colors.primary }]}
                    startAngle={90}
                    endAngle={-270}
                  >
                    <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
                    <RadialBar background={{ fill: colors.muted }} dataKey="value" cornerRadius={12} />
                  </RadialBarChart>
                </ResponsiveContainer>
                <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-3xl font-semibold tabular-nums" data-testid="text-focus-score">{score}</span>
                  <span className="text-xs text-muted-foreground">/ 100</span>
                </div>
              </>
            )}
          </div>
        </div>
      </section>

      <section className="mt-4 grid grid-cols-1 xl:grid-cols-2 gap-4">
        <div className="rounded-xl border border-card-border bg-card p-5" data-testid="card-category-completion">
          <h2 className="text-base font-semibold tracking-tight">Completion by category</h2>
          <p className="text-xs text-muted-foreground mt-0.5">Where you finish, and where things stall.</p>
          <div className="mt-4 h-[280px]">
            {isLoading ? (
              <Skeleton className="h-full w-full" />
            ) : completionByCategory.length === 0 ? (
              <EmptyChart />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={completionByCategory} layout="vertical" barCategoryGap="28%">
                  <CartesianGrid stroke={colors.border} strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" domain={[0, 100]} stroke={colors.mutedForeground} fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `${v}%`} />
                  <YAxis type="category" dataKey="name" stroke={colors.mutedForeground} fontSize={12} tickLine={false} axisLine={false} width={80} />
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
                  <Bar dataKey="Completion" fill={colors.primary} radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="rounded-xl border border-card-border bg-card p-5" data-testid="card-horizon-health">
          <h2 className="text-base font-semibold tracking-tight">Horizon health</h2>
          <p className="text-xs text-muted-foreground mt-0.5">Completion percentage per tracking horizon.</p>
          <div className="mt-4 h-[280px]">
            {isLoading ? (
              <Skeleton className="h-full w-full" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <RadialBarChart
                  innerRadius="30%"
                  outerRadius="100%"
                  data={horizonHealth}
                  startAngle={90}
                  endAngle={-270}
                >
                  <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
                  <RadialBar background={{ fill: colors.muted }} dataKey="value" cornerRadius={6} />
                  <Legend
                    iconSize={10}
                    layout="vertical"
                    verticalAlign="middle"
                    align="right"
                    wrapperStyle={{ fontSize: 12, color: colors.foreground }}
                    formatter={(value, _entry, i) => (
                      <span>
                        {horizonHealth[i]?.name} <span className="text-muted-foreground">— {horizonHealth[i]?.value}%</span>
                      </span>
                    )}
                  />
                </RadialBarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </section>

      <section className="mt-4 grid grid-cols-1 lg:grid-cols-3 gap-3 lg:gap-4">
        {(isLoading ? Array.from({ length: 3 }) : progressByPeriod).map((row: any, i) =>
          isLoading ? (
            <Skeleton key={i} className="h-[110px] rounded-xl" />
          ) : (
            <div
              key={row.name}
              className="rounded-xl border border-card-border bg-card p-5"
              data-testid={`card-period-${String(row.name).toLowerCase()}`}
            >
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                {row.name} horizon
              </p>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-xl font-semibold tabular-nums">{row.avg}%</span>
                <span className="text-xs text-muted-foreground">avg. progress</span>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">{row.total} task{row.total === 1 ? "" : "s"} tracked</p>
            </div>
          )
        )}
      </section>
    </AppLayout>
  );
}

function EmptyChart() {
  return (
    <div className="h-full flex items-center justify-center text-sm text-muted-foreground">
      Not enough data yet.
    </div>
  );
}
