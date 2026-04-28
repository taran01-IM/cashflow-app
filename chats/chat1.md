# Financial Dashboard Prototype

_Started 2026-04-28 06:29 UTC_

---

## User



## Assistant

I'll design a high-fidelity, interactive Cash Flow Management web app prototype. Since you've attached the Hi-fi design + Interactive prototype skills, I'll focus on a polished, working React prototype rather than producing a backend implementation document. Let me ask a few quick questions to nail the direction.

_[tool: questions_v2]_

## User

Questions answered:
- scope: Full interactive prototype of the whole app (dashboard, banks, inflow, outflow, reports)
- aesthetic: Dense data-app (Linear/Stripe dashboard style, compact)
- accent: 0
- screens: All of the above
- depth: Fully wired with mock data (add/edit/delete actually mutates state)
- currency: Decide for me
- bu_default: Decide for me
- charts: Yes — inflow vs outflow trend, category breakdown
- data_density: Realistic (10–30 rows per table)
- tweaks: Dark/light mode, User role (Admin/User), Language (EN/HI), Accent color, Density (compact/comfortable), Sidebar collapsed/expanded
- variations: 1 — pick the strongest

## Assistant

Got it. Building a dense, Linear/Stripe-style cash flow app — INR currency, MOPL default, fully wired mock state, charts on dashboard, all screens, single strongest variation with the requested tweaks.

**System I'll commit to:**
- **Type:** Inter for UI, JetBrains Mono for tabular numbers
- **Palette:** Deep navy `#0B1220` canvas (dark) / off-white `#FAFAF7` (light), with a green accent `oklch(0.72 0.14 150)` for positives, red for negatives, muted slate for chrome
- **Density:** 32px row height comfortable / 26px compact, 12–13px body, 11px labels uppercase tracked
- **Layout:** Left rail nav (collapsible), top bar with BU switcher + user, content area with sticky sub-headers
- **Charts:** Hand-rolled SVG (line for trend, stacked bars for category) — no library bloat

_[tool: update_todos]_

_[tool: copy_starter_component]_

_[tool: read_file]_

Now let me build the app. I'll split it into multiple files to keep each manageable.

_[tool: write_file]_

_[tool: write_file]_

_[tool: snip]_

Now the styles and helpers:

_[tool: write_file]_

_[tool: snip]_

Now the shared UI primitives + helpers:

_[tool: write_file]_

_[tool: snip]_

Now the dashboard, banks, inflow, outflow, reports, settings pages:

_[tool: write_file]_

_[tool: snip]_

_[tool: write_file]_

_[tool: snip]_

Now banks, inflow, outflow, reports, settings:

_[tool: write_file]_

_[tool: write_file]_

_[tool: snip]_

_[tool: write_file]_

_[tool: snip]_

_[tool: write_file]_

_[tool: write_file]_

_[tool: snip]_

_[tool: done]_

_[tool: fork_verifier_agent]_

Built a dense Linear/Stripe-style cash flow management app. **Quick login** with any seeded user, then explore:

- **Dashboard** — 5 KPI cards, 30-day inflow/outflow trend (hover for daily values), category breakdown, recent activity, bank balances
- **Banks / Inflow / Outflow** — fully wired CRUD; toggle outflow status to see balance update live
- **Reports** — 4 reports with date filters
- **Top-bar BU switcher** — filters everything; "All units" for Admins
- **Tweaks panel** — dark/light, accent color, density, sidebar collapse, EN/HI, Admin/User role

Try toggling role to **User** while signed in as Priya — IMS disappears from the BU switcher.

