import { Link, useLocation } from "wouter";
import {
  LayoutDashboard,
  ListChecks,
  BarChart3,
  CalendarDays,
  LogOut,
  Moon,
  Sun,
  Menu,
  X,
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { useTheme } from "@/lib/theme";
import { useAuth } from "@/lib/auth";
import { useI18n } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { LanguageSelector } from "@/components/LanguageSelector";
import { LogoWordmark } from "./Logo";

const NAV = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard, testId: "link-nav-dashboard" },
  { href: "/tasks", label: "Tasks", icon: ListChecks, testId: "link-nav-tasks" },
  { href: "/analytics", label: "Analytics", icon: BarChart3, testId: "link-nav-analytics" },
  { href: "/timeline", label: "Timeline", icon: CalendarDays, testId: "link-nav-timeline" },
];

function NavList({ onNavigate }: { onNavigate?: () => void }) {
  const [location] = useLocation();
  const { t } = useI18n();
  return (
    <nav className="flex flex-col gap-0.5 px-3" aria-label="Primary">
      {NAV.map(({ href, label, icon: Icon, testId }) => {
        const active = location === href || (href !== "/" && location.startsWith(href));
        return (
          <Link
            key={href}
            href={href}
            onClick={onNavigate}
            data-testid={testId}
            className={cn(
              "group flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm transition-colors",
              "hover-elevate",
              active
                ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                : "text-sidebar-foreground/80"
            )}
          >
            <Icon className={cn("h-4 w-4", active ? "text-primary" : "text-sidebar-foreground/60")} />
            {t(`navigation.${label.toLowerCase()}`)}
          </Link>
        );
      })}
    </nav>
  );
}

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "U";
}

function SidebarFooter() {
  const { user } = useAuth();
  const { t } = useI18n();
  if (!user) return null;
  return (
    <div className="border-t border-sidebar-border px-4 py-4">
      <p className="text-[11px] uppercase tracking-wider text-sidebar-foreground/50">
        {t("dashboard.workspace")}
      </p>
      <div className="mt-2 flex items-center gap-2.5">
        <div
          className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/15 text-primary font-semibold text-sm"
          aria-hidden
        >
          {initials(user.name)}
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-medium" data-testid="text-workspace-name">{user.name}</p>
          <p className="truncate text-xs text-sidebar-foreground/60" data-testid="text-workspace-email">{user.email}</p>
        </div>
      </div>
    </div>
  );
}

function ThemeButton() {
  const { theme, toggleTheme } = useTheme();
  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleTheme}
      aria-label="Toggle theme"
      data-testid="button-toggle-theme"
    >
      {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </Button>
  );
}

export function AppLayout({ children, title, subtitle, actions }: {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { logout } = useAuth();
  const { t } = useI18n();

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Sidebar — desktop */}
      <aside
        className="hidden lg:flex fixed inset-y-0 left-0 w-64 flex-col bg-sidebar text-sidebar-foreground border-r border-sidebar-border"
        aria-label="Sidebar"
      >
        <div className="px-5 py-5">
          <LogoWordmark />
        </div>
        <div className="px-3 pb-1">
          <p className="px-2.5 py-1.5 text-[11px] uppercase tracking-wider text-sidebar-foreground/50">
            {t("navigation.navigate")}
          </p>
        </div>
        <NavList />
        <div className="mt-auto">
          <SidebarFooter />
        </div>
      </aside>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div
            className="absolute inset-0 bg-foreground/40 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
            aria-hidden
          />
          <aside className="relative flex w-64 flex-col bg-sidebar text-sidebar-foreground border-r border-sidebar-border">
            <div className="flex items-center justify-between px-5 py-5">
              <LogoWordmark />
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setMobileOpen(false)}
                aria-label="Close menu"
                data-testid="button-close-mobile-nav"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <NavList onNavigate={() => setMobileOpen(false)} />
            <div className="mt-auto">
              <SidebarFooter />
            </div>
          </aside>
        </div>
      )}

      {/* Main */}
      <div className="lg:pl-64">
        <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-border bg-background/85 backdrop-blur px-4 sm:px-6 lg:px-8 h-14">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setMobileOpen(true)}
            aria-label="Open menu"
            data-testid="button-open-mobile-nav"
          >
            <Menu className="h-4 w-4" />
          </Button>
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-base font-semibold tracking-tight" data-testid="text-page-title">
              {title}
            </h1>
            {subtitle && (
              <p className="truncate text-xs text-muted-foreground" data-testid="text-page-subtitle">
                {subtitle}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            {actions}
            <LanguageSelector />
            <ThemeButton />
            <Button
              variant="ghost"
              size="icon"
              onClick={logout}
              aria-label={t("navigation.logout")}
              data-testid="button-logout"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </header>
        <main className="px-4 sm:px-6 lg:px-8 py-6 lg:py-8 max-w-[1400px]">
          {children}
        </main>
      </div>
    </div>
  );
}
