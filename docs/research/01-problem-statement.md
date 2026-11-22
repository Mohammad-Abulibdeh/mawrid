# Problem statement — Water allocation for displacement sites in the Gaza Strip

## The problem

Since October 2023, most of the Gaza Strip's water infrastructure has been destroyed,
damaged, or left without fuel and spare parts. Displaced families live in hundreds of
informal sites, shelters and tent camps whose populations change week to week.
Water reaches them through a patchwork of sources:

- a small number of seawater/brackish desalination plants (public, NGO and private),
- surviving municipal wells,
- the partially restored Mekorot connection lines,
- **water trucking** from those sources to distribution points in the sites.

Reported figures (see [sources](03-sources.md)):

| Indicator | Value | Source |
|---|---|---|
| Pre-war average availability | ~82.7 L/person/day | Oxfam [S5] |
| Average availability, late March 2026 | ~4.5–6 L/person/day | OCHA via UNICEF [S1] |
| People unable to collect the 6 L drinking/cooking minimum | up to 70% | UNICEF, May 2026 [S1] |
| Households reporting water insecurity (June 2025 survey) | 93% | WASH Cluster via OCHA [S2] |
| Emergency (Sphere) minimum | 15 L/person/day, ≤500 m, ≤30 min queue, ≤250 people per tap | Sphere [S6] |
| WASH Cluster Gaza-specific floor | 6 L drinking + 9 L domestic | OCHA [S3] |
| Extra cost of replacing one lost source by trucking | ~USD 40,000/day | UNICEF, May 2026 [S1] |

Total supply is far below need, so **every litre that is trucked has to go where the gap
is largest**. That decision is made daily by WASH partners and local committees — often
with spreadsheets, WhatsApp messages and phone calls, on intermittent connectivity and
intermittent electricity.

## Who has the problem

1. **Site focal points / camp committees** — know their site population and how much
   water actually arrived, but have no simple way to record and report it.
2. **WASH partner coordinators** (NGOs, municipalities, UN-contracted trucking) — must
   decide which sites each truck goes to tomorrow, given which sources are working.
3. **Water-quality monitors** — test free residual chlorine (FRC), turbidity and E. coli
   at sources and delivery points and need to flag unsafe water quickly.

## The concrete gaps this project addresses

| Gap | What goes wrong today | What Mawrid does |
|---|---|---|
| No shared picture of supply vs. need per site | Trucks follow habit or whoever calls loudest | Computes L/person/day per site against Sphere/Cluster thresholds and ranks sites by gap |
| Allocation is manual | Some sites get 3 trucks, neighbours get none | Max-min fair **dispatch planner** that allocates the day's available volume and truck trips |
| Distance to water is invisible | Families walk >500 m, often past broken points | Geospatial check: distance from each site to nearest *functional* point |
| Quality results are scattered | Unsafe water keeps being distributed | Rule engine flags FRC/turbidity/E. coli failures per source and blocks unsafe sources in the planner |
| Connectivity is unreliable | Online-only dashboards fail in the field | Offline-first PWA; data stays on the device and moves as CSV/JSON files |

## Scope and non-goals

- **In scope:** registry of water points and sites, delivery log, quality log, gap
  analytics, dispatch planning, map, import/export, Arabic + English interface.
- **Not in scope:** collecting personal data about individuals or households;
  real-time tracking of trucks or people. The tool works only with site-level aggregates,
  deliberately, because location data about civilians in an active conflict is sensitive.
- The bundled dataset is **synthetic demonstration data**. It is not a record of real
  sites, real plants or real deliveries.

## Why software helps (and where it does not)

The binding constraint in Gaza is physical: fuel, spare parts, access and safety. No app
creates water. What software can do is make the allocation of a scarce, already-available
volume more equitable and transparent, and shorten the time between a failed quality test
and a stopped distribution. The design is judged against that narrow goal.
