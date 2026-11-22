# Changelog

All notable changes to this project are documented here. Format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/); versions follow [SemVer](https://semver.org/).

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
