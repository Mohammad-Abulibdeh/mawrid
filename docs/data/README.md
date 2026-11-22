# Dataset documentation

## The bundled demo dataset is synthetic

`src/domain/seed.ts` generates a **synthetic** dataset relative to today's date: 16 sites,
12 water points, ~14 days of deliveries, 9 quality tests. Names start with "Demo", locations are
placed inland along an approximation of the coastline, and the app shows a banner while it is
loaded. **No record describes a real site, plant, well or delivery.**

Magnitudes were tuned so the overall picture resembles published figures: population-weighted
average ≈ 4.7 L/person/day (OCHA via UNICEF: 4.5–6 L in late March 2026), most people below the
6 L critical floor, one desalination plant down, one source failing E. coli, and habitual trucking
routes that over-serve some sites while others get nothing — the pattern the planner corrects.

## Formats

- Full dataset: JSON, see [schema.json](schema.json). Export from *Data & settings*.
- Per-entity CSV (UTF-8 with BOM so Excel shows Arabic correctly). Headers are case-insensitive.

| Entity | Columns |
|---|---|
| sites | id, name, governorate, lat, lng, population, vulnerability, fixedSupplyLpd, notes |
| points | id, name, type, status, lat, lng, capacityLpd, taps, notes |
| deliveries | id, date, pointId, siteId, litres |
| tests | id, date, pointId, frc, turbidity, ecoli |

Allowed values: governorate ∈ {North Gaza, Gaza, Deir al-Balah, Khan Younis, Rafah};
type ∈ {desalination, well, network, filling, distribution}; status ∈ {functional, partial, down};
dates are `YYYY-MM-DD` and cannot be in the future. Coordinates must fall inside the Gaza Strip
bounding box (31.21–31.60 N, 34.20–34.58 E).

Example files: [examples/](examples/).

## What is *not* collected

No names of people, phone numbers, ID numbers, household locations or photos. Only site-level
totals. Do not add such fields when extending the schema.

## Sources for real data

When used operationally, inputs typically come from: site focal-point headcounts, WASH Cluster
partner trucking logs, water-quality monitoring by WASH partners, and municipal/utility status of
plants and wells. See [../research/03-sources.md](../research/03-sources.md) for the published
figures used in the research.
