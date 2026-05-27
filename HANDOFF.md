# TempoTrack — Project Handoff

A polished SaaS-style productivity tracker built on the webapp template (React + Express + SQLite + Drizzle ORM + Tailwind + shadcn/ui + Recharts).

## Project path

`/home/user/workspace/tempotrack`

## Run

```bash
cd /home/user/workspace/tempotrack
npm install      # already done
npm run dev      # dev (Vite + Express on port 5000)
npm run build    # production build → dist/index.cjs + dist/public/
npm start        # production server: NODE_ENV=production node dist/index.cjs
```

## Deploy

```ts
start_server({
  command: "NODE_ENV=production node dist/index.cjs",
  project_path: "/home/user/workspace/tempotrack",
  port: 5000,
});
deploy_website({
  project_path: "/home/user/workspace/tempotrack/dist/public",
  site_name: "TempoTrack",
  entry_point: "index.html",
});
```

The frontend uses `__PORT_5000__` in `client/src/lib/queryClient.ts` so API calls get proxied correctly after `deploy_website` rewrites the placeholder.

## Key files

| Area | Path |
|------|------|
| Data model + Zod schemas | `shared/schema.ts` |
| SQLite storage + seed | `server/storage.ts` |
| API routes (`/api/tasks`) | `server/routes.ts` |
| App shell + sidebar nav | `client/src/components/AppLayout.tsx` |
| Inline SVG logo | `client/src/components/Logo.tsx` |
| Theme provider (dark/light) | `client/src/lib/theme.tsx` |
| Resolved chart colors hook | `client/src/lib/chartColors.ts` |
| Task CRUD hooks + helpers | `client/src/lib/tasks.ts` |
| Task create/edit dialog | `client/src/components/TaskDialog.tsx` |
| Stat card | `client/src/components/StatCard.tsx` |
| Dashboard page | `client/src/pages/Dashboard.tsx` |
| Tasks page (filters, CRUD) | `client/src/pages/Tasks.tsx` |
| Analytics page (4 charts) | `client/src/pages/Analytics.tsx` |
| Timeline page (date buckets) | `client/src/pages/Timeline.tsx` |
| Routing | `client/src/App.tsx` |
| Palette/theme tokens | `client/src/index.css` |

## Data model

`tasks` table (SQLite, auto-created on first boot):

| Column | Type | Notes |
|--------|------|-------|
| id | integer PK auto | |
| title | text | required, ≤200 chars |
| notes | text | optional |
| period | text | `day` / `month` / `year` |
| status | text | `todo` / `in_progress` / `done` |
| progress | integer | 0–100 |
| priority | text | `low` / `medium` / `high` |
| category | text | free-form, seeded with Work, Health, Learning, Personal, Finance, Creative |
| dueDate | text | ISO date (YYYY-MM-DD) |
| timeEstimate | integer | minutes, optional |
| metricTarget | integer | numeric goal, optional |
| metricUnit | text | e.g. km, books, USD |
| createdAt | text | ISO timestamp |

Seeded with 23 realistic items spanning all three periods so charts feel populated on first launch.

## API

| Verb | Path | Description |
|------|------|-------------|
| GET | `/api/tasks` | List all tasks (newest first) |
| GET | `/api/tasks/:id` | Get one |
| POST | `/api/tasks` | Create — body validated against `insertTaskSchema` |
| PATCH | `/api/tasks/:id` | Partial update |
| DELETE | `/api/tasks/:id` | Delete |

## Design decisions

- **Palette**: Teal-700 primary (`hsl(175 70% 38%)`), brightened in dark mode. Inferred from "tempo / cadence" theme — calm and energetic, not the generic blue default.
- **Chart palette**: 5 distinct hues from primary through warm orange and rose so distribution charts stay readable even with one color per category.
- **Inline SVG logo**: Three concentric arcs representing day / month / year horizons plus a clock hand, gradient-filled with the primary and chart-2 hues.
- **Font**: Inter, loaded via the template's Google Fonts link.
- **`text-xl` heading cap** per the webapp design system; KPI numbers use `text-xl font-semibold tabular-nums`.
- **Dark mode**: First-class. Seeded from `prefers-color-scheme` via `ThemeProvider`. No persistence to localStorage/cookies (sandbox-safe).
- **Sidebar**: Custom (not the shadcn cookie-driven sidebar) so behavior is fully predictable and there are no cookie writes; mobile uses a drawer.
- **Routing**: wouter with `useHashLocation` (template default). All hash routes wired in `App.tsx`.
- **Chart colors**: Recharts SVG `fill`/`stroke` attributes don't resolve `var()` references, so `lib/chartColors.ts` reads computed values from CSS variables and returns concrete `hsl(H S% L%)` strings that update on theme change.
- **Focus score**: Weighted blend (60 % completion %, 25 % momentum, 15 % on-time) computed client-side from the same task list.
- **Seed-derived synthetic 7-week tempo series** on Analytics so the area chart looks alive without a separate history table.
- **Empty + loading states**: Skeletons for every chart card; explicit empty illustrations on Tasks and Timeline with a primary call-to-action.

## Test IDs

Interactive elements and meaningful data carry `data-testid` attributes:

- Navigation: `link-nav-{dashboard|tasks|analytics|timeline}`, `button-toggle-theme`, `button-open-mobile-nav`, `button-close-mobile-nav`.
- Task actions: `button-new-task`, `button-edit-{id}`, `button-delete-{id}`, `button-toggle-done-{id}`, `button-confirm-delete`, `button-cancel-delete`.
- Dialog inputs: `input-title`, `input-notes`, `input-due-date`, `input-time-estimate`, `input-metric-target`, `input-metric-unit`, `select-period`, `select-priority`, `select-status`, `select-category`, `slider-progress`, `button-save-task`, `button-cancel-task`.
- Filters: `tabs-period`, `tab-{all|day|month|year}`, `input-search`, `select-filter-status`, `select-filter-priority`.
- Display: `card-stat-{completion|focus|high-priority|overdue}`, `text-page-title`, `text-task-title-{id}`, `badge-period-{id}`, `badge-priority-{id}`, `badge-status-{id}`, `text-progress-{id}`, `row-task-{id}`, `text-focus-score`.

## Functional QA performed

- All four pages render in light and dark mode at desktop (1440 px) and mobile (390 px).
- Created a task through the dialog → confirmed it persists in SQLite and shows in the list (Playwright + API check).
- Edited that task → confirmed update via API.
- Deleted that task → confirmed removal via API.
- Toggled "mark done" → status flips to `done` (progress=100) then back to `in_progress` (progress=95) on re-toggle.
- Period filter tab switches between all/day/month/year, search and status/priority filters compose with the tab.
- Production build (`npm run build`) succeeds; production server (`npm start`) serves the bundle and the same API surface.

## Limitations & follow-ups

- **Single-user**: No authentication. Tasks are global per SQLite file. Adding auth (e.g. Passport, already listed in dependencies) is a natural next step.
- **No history table**: The 7-week tempo trend chart is derived deterministically from current state, not real time-series history. If you want real trends, add a `task_events` table that records each status change.
- **No CSV/PDF export** — easy to add a `GET /api/tasks/export` route and a button in the toolbar.
- **No reminders / notifications**: Target dates are surfaced visually but there's no scheduling.
- **Bundle warning**: `assets/index-*.js` is ~950 kB (gzipped 273 kB) because Recharts is bundled in full. Acceptable for an internal SaaS demo; for production, lazy-load Recharts by page or switch to chart skeleton islands.
- **Recharts v2 deprecation warning** during install — works fine; migration to v3 is a future task.
