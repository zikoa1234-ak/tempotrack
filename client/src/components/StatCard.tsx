import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

export function StatCard({
  label,
  value,
  delta,
  icon: Icon,
  tone = "default",
  testId,
}: {
  label: string;
  value: string | number;
  delta?: string;
  icon: LucideIcon;
  tone?: "default" | "positive" | "warning" | "negative";
  testId?: string;
}) {
  const toneClass =
    tone === "positive"
      ? "text-[hsl(var(--chart-1))]"
      : tone === "warning"
      ? "text-[hsl(var(--chart-4))]"
      : tone === "negative"
      ? "text-destructive"
      : "text-foreground";

  return (
    <div
      className="rounded-xl border border-card-border bg-card p-4 lg:p-5"
      data-testid={testId}
    >
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</p>
        <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary/10 text-primary">
          <Icon className="h-3.5 w-3.5" />
        </div>
      </div>
      <p className={cn("mt-3 text-xl font-semibold tabular-nums tracking-tight", toneClass)}>
        {value}
      </p>
      {delta && <p className="mt-1 text-xs text-muted-foreground">{delta}</p>}
    </div>
  );
}
