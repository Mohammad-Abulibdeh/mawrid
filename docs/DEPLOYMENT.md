# Installation and deployment

## Run locally

Requirements: Node.js 20+ (CI uses 22) and npm.

```bash
git clone https://github.com/Mohammad-Abulibdeh/mawrid.git
cd mawrid
npm ci
npm run dev        # http://localhost:5173/mawrid/
```

| Command | Purpose |
|---|---|
| `npm run dev` | Development server with hot reload |
| `npm test` | All unit + UI tests (Vitest) |
| `npm run coverage` | Tests with coverage of `src/domain` |
| `npm run lint` | ESLint |
| `npm run typecheck` | TypeScript strict check |
| `npm run build` | Production build into `dist/` |
| `npm run preview` | Serve the production build locally |
| `npm run check` | lint + typecheck + test + build (what CI runs) |

No environment variables or secrets are needed. There is no backend to configure.

## Production hosting: GitHub Pages (free)

Live URL: **https://mohammad-abulibdeh.github.io/mawrid/**

Pipeline — `.github/workflows/ci-deploy.yml`:

1. On every push to `main` (and on pull requests): `npm ci` → lint → typecheck → tests with
   coverage → build. Test results and coverage are uploaded as an artifact.
2. On `main` only, if all checks pass: `dist/` is uploaded and deployed with
   `actions/deploy-pages`.
3. A smoke test then fetches the live URL and checks it serves the app bundle.

A failing check blocks deployment, so the live site always matches the latest commit on `main`
that passed CI.

One-time setup (already done for this repository): *Settings → Pages → Source: GitHub Actions*
(equivalently `gh api -X POST repos/<owner>/<repo>/pages -f build_type=workflow`).

### Hosting under a different path

The app is built for the sub-path `/mawrid/` (`base` in `vite.config.ts`). For a fork with a
different repository name, or a custom domain at the root, change `base` accordingly
(e.g. `'/'`). Routing uses URL hashes (`#/planner`), so no server rewrite rules are needed.

## Self-hosting / offline distribution

`dist/` is a set of static files. It can be served by any static web server (nginx, Caddy,
`python -m http.server`) on a local network — for example on a laptop in a coordination office
without internet. After one visit the service worker caches the app for offline use.

## Cost

GitHub Pages and GitHub Actions are free for public repositories. OpenStreetMap tiles are used
under the OSM tile usage policy; for heavy operational use, a dedicated tile provider or
self-hosted tiles should be configured in `src/components/WaterMap.tsx`.
