# User guide

Open **https://mohammad-abulibdeh.github.io/mawrid/**. Switch language with the button at the
top (English / العربية). The app opens with synthetic demo data so you can try everything; press
**Start with an empty dataset** when you are ready to enter real data.

## 1. Set up your sites and water points (once, then update)

- **Sites** → *Add site*: name, governorate, location (type coordinates or *Pick on map*),
  population, vulnerability weight (1.0 normal, up to 2.0 for sites with a clinic or many young
  children), and any water reaching the site without trucks (litres/day).
- **Water points** → *Add water point*: plants, wells, network points and filling points that
  trucks load from (enter today's available output), and distribution points with taps.
  Update **status** whenever a source goes down or comes back.

Or import a spreadsheet: **Data & settings → CSV** — download a template, fill it, import.

## 2. Record daily activity

- **Deliveries**: date, source, site, litres. Coverage is the average over the last 7 days.
- **Water quality**: chlorine (FRC), turbidity, E. coli. A failing result immediately marks the
  source *Unsafe*: it disappears from access calculations and is never used by the planner.

## 3. Read the dashboard

- *Average supply* is weighted by population, in litres per person per day.
- *People below 6 L* is the critical group.
- The bar chart shows every site, worst first; red = critical, yellow = below target,
  green = meets target. Hover a bar for details.
- *Alerts* lists unsafe sources, sites more than 500 m from a usable tap, and crowded taps.

## 4. Plan tomorrow's trucking

**Dispatch planner**: enter trucks, trips per truck, litres per load, maximum haul distance and
the target. *Run plan* produces:

- a **trip list** (source → site, loads, litres, distance) — *Export CSV* to share it,
- the **effect per site** (today's coverage → planned coverage),
- the routes on a map, and the sources not used with the reason.

The plan starts from each site's non-trucked supply and always gives the next load to the site
with the largest (vulnerability-weighted) shortfall, from the nearest safe source that still has
water.

## 5. Share data between devices

**Data & settings → Export full dataset (JSON)** and send the file (WhatsApp, USB, email). On the
other device, **Import dataset (JSON)**. Data never leaves the device otherwise.

## 6. Thresholds

**Data & settings → Thresholds**: target (15 L, or 20 L in hot weather), critical floor, maximum
distance, people per tap, averaging window, how long a quality test stays valid, and chlorine
mode (*Outbreak* raises the minimum FRC to 0.5 mg/L).
