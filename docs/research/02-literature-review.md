# Literature and standards review

This review covers the standards the tool encodes and the evidence that motivates it.
Source keys (`[S1]` …) refer to [03-sources.md](03-sources.md).

## 1. Situation evidence

**Quantity.** OCHA and UNICEF reporting through 2025–2026 consistently shows average
water availability far below the 15 L emergency benchmark. UNICEF's May 2026 WASH update,
citing OCHA, puts average availability at about 4.5–6 L/person/day by late March 2026 and
says up to 70% of people cannot collect 6 L for drinking and cooking [S1]. OCHA's June 2025
update reported that most people were receiving less than 15 L and that 93% of surveyed
households experienced water insecurity [S2]. OCHA Situation Update #327 reported about one
million people unable to access 6 L of drinking water daily [S3].

**Infrastructure.** UNICEF reported that, of three large desalination plants, only two
were working at reduced capacity in 2025, and aid organisations estimated over 80% of WASH
facilities damaged or destroyed [S4]. IRC (July 2025) reported nearly three-quarters of
desalination plants, wells and wastewater pumping stations non-functional [S7]. Fuel is a
single point of failure: without it, plants stop and so does trucking [S8].

**Trucking is the swing supply.** When a source fails, partners replace it with trucks. After
trucking from Al Mansoura stopped in April 2026, UNICEF replaced ~2 million L/day by trucking
from desalination plants at roughly USD 40,000/day extra [S1]. UNICEF also contracted 15 private
desalination plants to supply water for free trucking [S4]. Trucked volume is therefore the
quantity a planner can actually move each day — which is exactly what the dispatch planner
allocates.

**Health.** The WASH collapse is associated with outbreaks of diarrhoeal disease, hepatitis A
and skin infections; a 2026 Journal of Water and Health case study frames it as a public-health
collapse [S9]. This motivates treating quality failures as blocking, not advisory.

## 2. Standards encoded in the tool

| Standard | Threshold used | Source |
|---|---|---|
| Water quantity (Sphere) | ≥15 L/person/day ("survival level"); up to 20 L in hot climates | [S6] |
| Gaza WASH Cluster floor | 6 L drinking + 9 L domestic = 15 L; 6 L treated as *critical* floor | [S3] |
| Distance (Sphere) | nearest water point ≤500 m from any household | [S6] |
| Queue (Sphere) | ≤30 min incl. waiting and filling | [S6] |
| Users per tap (Sphere) | ≤250 people per tap (at 7.5 L/min flow) | [S6] |
| Free residual chlorine | 0.2–0.5 mg/L at distribution point (normal risk); 0.5–1.0 mg/L in outbreak conditions; never >5 mg/L | Sphere via [S10], IFRC [S11] |
| Turbidity | <5 NTU target; <20 NTU tolerated in initial emergency phase | MSF [S12] |
| E. coli | 0 CFU/100 mL for treated water; >10 CFU/100 mL in untreated water is unacceptable | MSF [S12], WHO GDWQ |

The tool lets the user switch between **normal** and **outbreak** chlorine thresholds,
because guidance differs on which applies, and between a 15 L and 20 L target.

## 3. Allocation method

Allocating a fixed volume among sites so that the worst-off site is as well-off as possible
is a **max-min fairness** problem (also called "water-filling"). For divisible goods with
equal weights the optimal solution raises the lowest sites to a common level until supply
runs out. Two real constraints make the problem non-trivial:

1. Water moves in **discrete truck loads** (commonly 6–20 m³ tankers).
2. Each **source has limited daily output** and only *safe, functional* sources may be used.
3. **Travel distance** matters: in Gaza, routes are long, dangerous and fuel-limited.

Mawrid uses a greedy discrete water-filling heuristic:

```
repeat:
    s ← site with the lowest projected L/person/day (ties → larger population)
    if s already ≥ target: stop
    p ← nearest safe, functional source with remaining capacity ≥ one load
        and within max haul distance
    if none: mark s unreachable, continue
    assign one load p → s; update projections and capacities; decrement trips
until trips or capacity exhausted
```

Greedy max-min with unit increments is optimal for the continuous single-source case and
is a well-known, explainable heuristic for the discrete multi-source case. Explainability was
weighted over optimality: a coordinator has to be able to justify a plan to site committees.
An optional vulnerability weight (e.g. sites hosting health facilities or many children)
scales a site's effective population.

## 4. Design implications from the context

- **Intermittent connectivity and power** → offline-first PWA, no mandatory server,
  small bundle, file-based (CSV/JSON) data exchange that works over WhatsApp/USB.
- **Arabic-speaking users** → full Arabic interface with right-to-left layout.
- **Safety of civilians** → aggregate site data only; no names, phone numbers or household
  coordinates. Map tiles are fetched from OpenStreetMap only when online; nothing is uploaded.
- **Low trust in black boxes** → every number in the UI is traceable to a simple rule
  (shown in the "Methodology" page).

## 5. Why no ML

Machine learning was considered for demand forecasting. It was rejected for this version:
there is no reliable, open, site-level time series to train on, populations move abruptly
with evacuation orders, and a model trained on synthetic data would give false confidence.
A simple 7-day moving average of delivered volume is shown instead.
