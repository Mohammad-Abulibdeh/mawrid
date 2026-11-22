# Roadmap

| Milestone | Content | Status |
|---|---|---|
| M0 | Research, sources, plan, architecture decision | ✅ Done |
| M1 | Domain engine (analytics, quality, planner, validation, CSV) + unit tests | ✅ Done |
| M2 | Full UI: dashboard, map, registries, logs, planner, data import/export | ✅ Done |
| M3 | Arabic RTL + offline PWA | ✅ Done |
| M4 | CI (lint, typecheck, tests+coverage, build) + GitHub Pages deployment + smoke test | ✅ Done |
| M5 | Live verification, documentation, screenshots, test report | ✅ Done |

## Next (planned, not implemented)

| Priority | Item | Why |
|---|---|---|
| High | Field validation with WASH partners; adjust fields and thresholds to their forms | The tool is only useful if it fits existing reporting |
| High | Multi-device sync (optional self-hosted backend, e.g. FastAPI + PostgreSQL, end-to-end encrypted) | Several coordinators editing the same picture; the domain layer is already server-ready |
| High | Merge-import (combine two devices' JSON files with conflict report) instead of replace | Works today only by CSV merge |
| Medium | Fuel and truck-shift constraints in the planner; per-truck route sheets | Fuel is the binding constraint in practice |
| Medium | Road-network distances and no-go zones | Straight-line distance underestimates real haul |
| Medium | Printable daily plan (PDF) in Arabic | Drivers and site committees need paper |
| Medium | Household-level water-quality follow-up (FRC at point of use) | Decay between tap and container |
| Low | Demand trend (moving average) per site; population change log | Populations move with evacuation orders |
| Low | Playwright end-to-end tests in CI including offline mode | Automate what is now verified manually |
