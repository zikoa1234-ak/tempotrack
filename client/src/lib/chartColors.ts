import { useEffect, useState } from "react";
import { useTheme } from "@/lib/theme";

// Resolve `--chart-N` CSS variables (stored as `H S% L%`) into real `hsl(...)` strings.
// SVG attributes such as `fill="hsl(var(--chart-1))"` are not honored by all browsers (they don't run var() inside attribute strings), so we read the values once and pass concrete colors into Recharts.

function readVar(name: string): string {
  if (typeof window === "undefined") return "#0e9485";
  const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  if (!v) return "#0e9485";
  return `hsl(${v})`;
}

export function useChartColors() {
  const { theme } = useTheme();
  const [colors, setColors] = useState(() => readAll());

  useEffect(() => {
    // Recompute after the DOM has applied the .dark class change.
    const id = requestAnimationFrame(() => setColors(readAll()));
    return () => cancelAnimationFrame(id);
  }, [theme]);

  return colors;
}

function readAll() {
  return {
    chart1: readVar("--chart-1"),
    chart2: readVar("--chart-2"),
    chart3: readVar("--chart-3"),
    chart4: readVar("--chart-4"),
    chart5: readVar("--chart-5"),
    chart6: readVar("--chart-6"),
    primary: readVar("--primary"),
    border: readVar("--border"),
    muted: readVar("--muted"),
    mutedForeground: readVar("--muted-foreground"),
    popover: readVar("--popover"),
    popoverBorder: readVar("--popover-border"),
    popoverForeground: readVar("--popover-foreground"),
    accent: readVar("--accent"),
    card: readVar("--card"),
    destructive: readVar("--destructive"),
    foreground: readVar("--foreground"),
  };
}

export type ChartColors = ReturnType<typeof readAll>;
