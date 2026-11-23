# Development log

## Current phase
**M6 complete — v0.2.0 (interface redesign) released and live** at https://mohammad-abulibdeh.github.io/mawrid/.
Next phase: field validation and multi-device sync (see [ROADMAP.md](ROADMAP.md)).

## Status board

| Area | Implemented | Tested | Deployed |
|---|---|---|---|
| Coverage analytics & dashboard | ✅ | ✅ unit + UI | ✅ |
| Water-quality gate | ✅ | ✅ unit + UI | ✅ |
| Dispatch planner | ✅ | ✅ unit + UI + live manual | ✅ |
| Map | ✅ | manual (live) | ✅ |
| Registries, logs, forms | ✅ | ✅ UI workflow | ✅ |
| JSON/CSV import/export | ✅ | ✅ unit | ✅ |
| Arabic RTL | ✅ | ✅ UI + manual | ✅ |
| Offline service worker | ✅ | manual (registration/activation) | ✅ |
| Welcome page and guided steps | ✅ | ✅ UI + journey unit + manual | ✅ |
| Cream/ink identity, bundled fonts, SVG icons, no emoji | ✅ | ✅ automated no-emoji check + manual (desktop, phone, both languages) | ✅ |
| Multi-device sync, fuel constraints, road distances | ❌ planned | — | — |

## Known issues
- Map and service-worker offline mode are verified manually, not in CI.
- Distances are straight-line (haversine), not road distance.
- Values just under a threshold display rounded (e.g. 5.97 shows "6.0" but is *critical*).
- OpenStreetMap public tiles are suitable for demonstration only; operational use needs its own tile source.

## Log

### 2026-11-23 — M6: interface redesign (v0.2.0)
- New welcome page at `#/` (the overview moved to `#/dashboard`), a guided four-step journey with
  progress on every step page and in the menu, tips and field help, and clearer labels.
- New identity: cream base, ink outlines, offset shadows, soft accents; IBM Plex Sans Arabic and
  Baloo Bhaijaan 2 bundled for offline use; Lucide icons; no emoji anywhere (enforced by a test).
- Logic, data model and stored data unchanged; every existing test still passes, with labels
  updated.
- Browser check found the step bar overflowing on phones in the column layout (`flex-wrap` made the
  line as wide as its content). Fixed and verified: no sideways scrolling on any of the 10 pages at
  375 px in Arabic.
- Running the tests locally on Node 26 needed an in-memory `localStorage` in the test setup (Node's
  own global hides jsdom's); CI on Node 22 is unaffected. 66 tests passing.

### 2026-11-23 — M5: verification and documentation
- Verified live site: dashboard, map (16 sites, 12 points, tiles), planner (100 loads, 41 routes,
  people < 6 L 191,000 → 129,300), service worker activated, no console errors.
- Planner now reports `sourcesExhausted` per site (found during live check).
- Added architecture (Mermaid), data schema + example CSVs (tested), user guide, deployment guide,
  test report, screenshots (headless Edge, `docs/screenshots/`). Bumped GitHub Actions to
  Node 24-based versions.
- Added shareable links `#/planner?run=1` and `?lang=ar|en`. 55 tests passing.
- Process note: a scripted bulk edit corrupted four docs in commit 067abc6; restored from the
  previous commit in the next commit.

### 2026-11-23 — M4: CI/CD
- GitHub Actions: lint → typecheck → tests with coverage (JUnit + coverage artifact) → build →
  deploy to Pages → smoke test of live URL. First run green.

### 2026-11-23 — M2/M3: UI, Arabic, offline
- All pages, Leaflet map (lazy-loaded), SVG charts with hover tooltips, error boundary.
- Browser testing found: planner double-counted recent trucking (fixed: plan from non-trucked
  supply); RTL chart overflow (fixed). UI test found validation text inside labels (fixed).
- Demo data rebalanced to 4.7 L/person/day average.
- 54 tests passing.

### 2026-11-23 — M1: domain engine
- Analytics, quality rules, planner, CSV, validation, demo data. 42 unit tests.
- Tests exposed a tie-breaking flaw in the first planner ranking; replaced by weighted shortfall.

### 2026-11-23 — M0: research and planning
- Chose the problem: equitable allocation of scarce (mostly trucked) water across displacement
  sites in Gaza. Architecture decision: offline-first static SPA (ADR-001).

## Commits
See `git log` or https://github.com/Mohammad-Abulibdeh/mawrid/commits/main
