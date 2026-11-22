# Test report

Date: 2026-11-23 · Commit range: M1–M5 · Runner: Vitest 2.1.8 (jsdom), Node 22 in CI.

## Automated tests — 55 passing

| Suite | File | Tests | What it covers |
|---|---|---|---|
| Quality rules | `tests/domain/quality.test.ts` | 9 | FRC normal/outbreak ranges, >5 mg/L toxic, turbidity 5/20 NTU, E. coli, incomplete tests, latest-test-within-window selection |
| Analytics | `tests/domain/analytics.test.ts` | 9 | Haversine distance, 7-day averaging with zero days, bands, per-capita/gap, unsafe points excluded from access, priority ranking, summary KPIs, daily series |
| Planner | `tests/domain/planner.test.ts` | 11 | Max-min fairness, equalisation, target stop, source capacity + `sourcesExhausted`, exclusion of down/unsafe/tap/untested sources, haul limit, nearest source, vulnerability tie-break, no over-serving, plans from non-trucked baseline, demo-scale improvement without exceeding capacity |
| Data | `tests/domain/data.test.ts` | 18 | CSV round-trip (quotes/newlines/BOM/CRLF), formula-injection neutralisation, strict ISO dates, form/CSV validation, Gaza bounds, references and future dates, dataset import with error report, schema version, CSV import for every entity, documented example files, demo determinism and self-validation |
| UI integration | `tests/ui/app.test.tsx` | 8 | Dashboard KPIs + demo banner + unsafe-source alert; empty state; full **site → water point → delivery** workflow incl. validation errors and coverage band change; unsafe quality result; planner trip list never using unsafe source; shared `?run=1` link; parameter validation; Arabic RTL rendering |

## Coverage (domain layer, `src/domain/**`)

| File | Lines | Branches |
|---|---|---|
| analytics.ts | 100% | 95.2% |
| planner.ts | 100% | 94.1% |
| quality.ts | 100% | 97.1% |
| validate.ts | 97.6% | 80.7% |
| csv.ts | 93.9% | 92.5% |
| io.ts, dates.ts, geo.ts, seed.ts | 100% | 94–100% |
| **All domain files** | **99.1%** | **91.5%** |

CI uploads the JUnit report and coverage as the `test-results` artifact on every run.

## Static checks

- ESLint (typescript-eslint recommended + react-hooks): 0 errors, 0 warnings
- TypeScript `strict`: 0 errors
- Production build: main bundle 251 kB (82 kB gzip); Leaflet map chunk 158 kB (47 kB gzip), lazy-loaded

## Manual / browser verification (live site)

Performed on https://mohammad-abulibdeh.github.io/mawrid/ after deployment:

| Check | Result |
|---|---|
| Dashboard renders with demo data, no console errors | Pass |
| Map: 16 site circles, 12 point markers, OSM tiles load | Pass |
| Service worker registered and `activated` | Pass |
| Planner run: 100/100 loads, 41 routes drawn on map; people < 6 L: 191,000 → 129,300 | Pass |
| Arabic: full RTL layout, chart mirrored, labels translated | Pass (after fixing SVG text-anchor in RTL, see below) |

## Bugs found by testing and fixed

| # | Found by | Problem | Fix |
|---|---|---|---|
| 1 | Unit test | Planner ranked by `projected/vulnerability`, which cannot break ties at 0 L | Switched to weighted shortfall `(target − projected) × vulnerability` |
| 2 | Unit test | A vulnerable site already at target could stop the planner early | Retire sites at target instead of stopping |
| 3 | Browser | Planner added to recent trucking, double-counting trucked water | Plan starts from non-trucked supply; "before" shows actual coverage |
| 4 | Browser | In Arabic (RTL), SVG `text-anchor="end"` flipped and labels overflowed into the sidebar | SVG rendered with explicit `direction="ltr"`; mirroring done in coordinates |
| 5 | UI test | Validation messages were inside `<label>`, polluting the accessible name of inputs | Error/help text moved outside the label element |
| 6 | Browser | Lowest site stayed low with no explanation | Planner reports `sourcesExhausted` per site; UI shows "Nearby sources ran dry" |

## Not covered by automated tests

- Leaflet map rendering (mocked in jsdom; verified manually in the browser)
- Service-worker offline behaviour (verified manually: registration and activation)
- File download/upload dialogs (logic tested through `importCsv`/`exportCsv`/`validateDataset`)
