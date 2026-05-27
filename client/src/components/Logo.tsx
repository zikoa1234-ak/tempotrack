export function Logo({ className = "h-7 w-7" }: { className?: string }) {
  // Three concentric arcs representing day, month, year + a clock hand.
  return (
    <svg
      viewBox="0 0 40 40"
      fill="none"
      aria-label="TempoTrack logo"
      className={className}
      data-testid="img-logo"
    >
      <defs>
        <linearGradient id="tt-grad" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="1" />
          <stop offset="100%" stopColor="hsl(var(--chart-2))" stopOpacity="1" />
        </linearGradient>
      </defs>
      <rect x="1.5" y="1.5" width="37" height="37" rx="9" fill="url(#tt-grad)" />
      <path d="M20 9.5 a10.5 10.5 0 1 1 -10.5 10.5" stroke="white" strokeWidth="2.4" strokeLinecap="round" opacity="0.55" />
      <path d="M20 13.5 a6.5 6.5 0 1 1 -6.5 6.5" stroke="white" strokeWidth="2.4" strokeLinecap="round" opacity="0.8" />
      <circle cx="20" cy="20" r="2.2" fill="white" />
      <path d="M20 20 L26.5 14.5" stroke="white" strokeWidth="2.4" strokeLinecap="round" />
    </svg>
  );
}

export function LogoWordmark({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center gap-2.5 ${className}`} data-testid="link-brand">
      <Logo />
      <span className="text-base font-semibold tracking-tight">TempoTrack</span>
    </div>
  );
}
