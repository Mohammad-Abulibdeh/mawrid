# Project plan

## Product
**Mawrid (مورد — "water source")**: an offline-first web app that helps WASH coordinators
in Gaza see the water gap per displacement site and plan tomorrow's water trucking fairly.

## Users and workflows
1. **Coordinator** opens the dashboard → sees sites ranked by L/person/day gap.
2. **Site focal point** records a delivery (date, source, site, litres).
3. **Quality monitor** records a test (FRC, turbidity, E. coli) → unsafe sources are flagged
   and excluded from planning.
4. **Coordinator** runs the dispatch planner (trucks × trips × load size, haul limit) → gets
   a trip list, before/after coverage, and unreachable sites → exports it as CSV to share.
5. Anyone exports/imports the dataset as JSON or CSV to sync between devices.

## Architecture decision (ADR-001)
Static single-page app (React + TypeScript + Vite), state in the browser (localStorage with
versioned schema), service worker for offline use, GitHub Pages hosting.

Rejected: a hosted backend + Postgres. Reasons: (a) field connectivity is intermittent, so a
server-dependent app fails exactly when needed; (b) a central database of site locations in an
active conflict concentrates sensitive data; (c) free hosting for a backend is unreliable.
The domain logic is isolated in `src/domain/` (pure functions) so a sync backend can be added
later without rewriting it. See [architecture.md](architecture.md).

## Milestones
- M0 Research + plan (this commit)
- M1 Domain engine (types, standards, analytics, planner, quality rules, CSV) + unit tests
- M2 UI: dashboard, map, sites, water points, deliveries, quality, planner, data, methodology
- M3 i18n (Arabic RTL) + offline PWA
- M4 CI (lint, typecheck, tests, build) + GitHub Pages deployment
- M5 Verification on the live URL, documentation, screenshots
