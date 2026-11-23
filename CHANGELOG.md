# Changelog

All notable changes to this project are documented here. Format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/); versions follow [SemVer](https://semver.org/).

## [0.2.0] — 2026-11-23

Interface redesign. The planning logic, data model, stored data and all routes are unchanged,
except that the overview moved from `#/` to `#/dashboard` to make room for the welcome page.

### Added
- Welcome page at `#/`: what Mawrid is and the problem in plain words, a "Start now" button that
  goes to the next unfinished step, the four steps with live progress, a choice between sample
  data and your own data, and privacy/offline reassurance.
- Guided journey: "Step n of 4" label, progress bar and "Next: …" button on Sites, Water points,
  Deliveries, Water quality and Truck plan; numbered steps with checkmarks in the side menu.
- Short tips on every page and help text under every planner field.
- Language switch with both options visible (العربية / English).
- Tests: welcome page, guided steps, language switch, journey logic, a check that no string or
  source file contains emoji, and a check that every English string has an Arabic translation
  (66 tests).

### Changed
- New visual identity: cream base, warm ink outlines with offset shadows, soft accent colours,
  new logo and app icon.
- Fonts bundled with the app (IBM Plex Sans Arabic for text, Baloo Bhaijaan 2 for headings), so
  Arabic and English share one style and keep working offline.
- All icons are now Lucide SVG icons; every emoji and text-symbol icon was removed, including the
  map markers.
- Clearer names: "Overview" (was Dashboard), "Truck plan" (was Dispatch planner),
  "Build the plan" (was Run plan).
- Mobile: menu with overlay, no sideways scrolling on any page, full-width main buttons.
- Service-worker cache version bumped so returning visitors get the new interface.

### Removed
- Automatic dark theme (the identity is cream-based; a warm dark variant may come back later).

## [0.1.0] — 2026-11-23

First public release. Live at https://mohammad-abulibdeh.github.io/mawrid/

### Added
- Research: problem statement, literature and standards review, sources.
- Domain engine: per-site coverage analytics, priority score, access/tap checks, water-quality
  rule engine (normal/outbreak chlorine modes), weighted max-min dispatch planner, CSV reader/writer
  with formula-injection protection, dataset validation, deterministic synthetic demo dataset.
- UI: dashboard (KPIs, coverage chart, daily volume chart, alerts, priority table), map, sites,
  water points, deliveries, quality, dispatch planner, data & settings, method & sources.
- English/Arabic interface with RTL layout.
- JSON dataset and per-entity CSV import/export with row-level error reports.
- Offline service worker (app shell + map tile cache), web manifest.
- Error boundary per page.
- Shareable links: `#/planner?run=1` runs the plan on arrival; `?lang=ar|en` sets the language.
- CI: lint, typecheck, tests with coverage, build; deploy to GitHub Pages; post-deploy smoke test.
- Documentation: architecture, data schema and examples, user guide, deployment guide, test report.

### Changed
- Planner ranks by vulnerability-weighted shortfall instead of `projected / vulnerability`
  (could not break ties at 0 L).
- Planner plans the whole trucking round from non-trucked supply (previously added on top of
  recent trucking, double-counting).
- Demo data rebalanced to ~4.7 L/person/day to match published figures.

### Fixed
- RTL: chart labels overflowed into the sidebar (SVG `text-anchor` flips under `dir=rtl`).
- Accessibility: validation messages were inside `<label>`, changing input names.
- Planner now reports sites held back because nearby sources ran dry.
