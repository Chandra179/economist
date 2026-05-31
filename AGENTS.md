# Economist — AGENTS.md

Pure markdown economics study notes + `ui/` dashboard.

## Root markdown docs

No formatter, linter, typechecker, or test runner. Just edit `.md` files. Published via GitBook (GitHub-synced). Do not break relative links between `.md` files.

- **`overview.md`** — mermaid diagram; best starting point
- **`SUMMARY.md`** — GitBook ToC; update when adding/renaming pages
- **`ROADMAP.md`** — content quality ratings; identifies thin pages needing expansion
- **`init`** — empty sentinel file; ignore

## `Makefile` — root-level commands

```sh
make build       # build server + UI
make run-server  # run Go API server (needs FRED_API_KEY in .env or env var)
make run-ui      # Vite dev server
make lint        # vet Go server + eslint UI
make clean       # remove binaries, cache, dist
make kill        # force-kill whatever's on :8080 (development fix)
```

The server binary installs to `server/economist-server`. The `run-server` target creates `server/data/` for the bbolt cache — it's gitignored. Both binary and data dir are removed by `make clean`.

## `server/` — Go + Gin + bbolt API server

Caches upstream API responses (Frankfurter, FRED, World Bank) in bbolt to avoid rate limits and speed up reloads.

### Setup

Copy `server/.env.example` → `server/.env` and fill in your FRED API key:

```
FRED_API_KEY=your_32_char_key
```

The server loads `.env` via godotenv on startup. Env vars set in the shell take precedence.

### Commands

```sh
make build-server  # or: cd server && go build -o economist-server .
make run-server    # or: FRED_API_KEY=key ./server/economist-server
```

### Env vars

| Var | Default | |
|-----|---------|-|
| `FRED_API_KEY` | — | **Required** for Fed rate, reserves, GDP, debt |
| `ADDR` | `:8080` | Listen address |
| `CACHE_PATH` | `data/cache.db` | bbolt database path |

### API endpoints (proxied to upstream, cached in bbolt)

| Endpoint | Upstream | TTL |
|----------|----------|-----|
| `GET /api/countries` | Static config (server) | 1h |
| `GET /api/exchange-rates?currencies=CNY,IDR` | Frankfurter `/v2/rates` | 6h |
| `GET /api/historical-rates?currencies=...&from=&group=` | Frankfurter `/v2/rates` | 24h |
| `GET /api/fred/latest?series=DTWEXBGS` | FRED observations | 1h |
| `GET /api/fred/batch-latest?series=DFF,GDP,...` | FRED (server fan-out) | 1h |
| `GET /api/fred/history?series=&from=&frequency=` | FRED observations | 24h |
| `GET /api/gdp/usd?countries=CNY,IDR&from=1990` | Computed (FRED + World Bank + FX) | 24h |
| `GET /api/worldbank/debt?country=USD` | World Bank | 24h |
| `GET /api/worldbank/gdp?country=USD` | World Bank | 24h |

FRED API key stays server-side — no client exposure.

### World Bank quirk

World Bank endpoints accept currency codes (USD, CNY, IDR) but map them internally to 2-letter country codes (US, CN, ID). The mapping is in `server/handlers.go:worldbankCountry`.

### Debt source by country

Debt data can come from FRED or World Bank (`DebtSource` in `server/config.go`). US uses `"worldbank"` (no API key needed); CN and IDR use FRED (requires `FRED_API_KEY`).

> **Indonesia debt note**: FRED `GGGDTAIDA188N` covers 2000–2024 (continuous annual). World Bank `GC.DOD.TOTL.GD.ZS` for ID only has 14 records (1990–2009, gaps after 1999). FRED is preferred for Indonesia despite requiring an API key.

### GDP endpoint dual source

`/api/gdp/usd` fetches GDP from FRED for US, but from World Bank `NY.GDP.MKTP.CN` for CN (FRED `NGDPXDCCNA` only covers 1992+) and IDR (FRED `NGDPXDCIDA` only covers 2008+). Config per-country in `server/config.go:GdpSource`. World Bank GDP values are full local currency units (not scaled); FRED series are scaled (billions/millions) — the `GdpMultiplier` field in config normalizes them.

## `ui/` — React + TypeScript + Vite dashboard

Standalone project in `ui/` with its own `package.json`, config, deps. Calls the Go server at `http://localhost:8080` — start the server first.

### Commands

```sh
npm run dev       # Vite dev server
npm run build     # tsc -b && vite build (typecheck first — dead code fails)
npm run lint      # eslint .
npm run preview   # Vite preview (production build preview)
```

### Critical tsconfig rules (in `ui/tsconfig.app.json`)

- `noUnusedLocals: true`, `noUnusedParameters: true` — any dead import/var/param fails build
- `verbatimModuleSyntax: true` — use `import type` for type-only imports
- `erasableSyntaxOnly: true` — no enums, no namespaces, no parameter properties

### Stack quirks

- **Tailwind CSS v4** — no config file, no PostCSS. Uses `@tailwindcss/vite` plugin + `@import "tailwindcss"` in `index.css`
- **ESLint** flat config (`eslint.config.js`) with typescript-eslint, react-hooks, react-refresh
- **Key libraries** — `@tanstack/react-table` (tables), `recharts` (charts)
- No routing, no state library, no test framework — plain `useState`/`useEffect`

### Current components (`ui/src/components/`)

```
CountryCard.tsx       — single country display card
DataTable.tsx         — generic sortable table (used by FxTable, GdpTable)
FxTable.tsx           — FX history with range selector + currency filter
GdpTable.tsx          — GDP comparison table (USD-converted)
IntervalSelector.tsx  — day/week/month toggle
```

### Data sources

| Data | API | Auth | Frequency |
|------|-----|------|-----------|
| USD/CNY, USD/IDR rates | Frankfurter (frankfurter.dev) | None | Daily |
| 1999–MAX FX history | Frankfurter | None | Daily/weekly/monthly |
| Fed rate (DFF), reserves (TRESEG*), GDP (NGDP*), debt (GGGDT*) | FRED | API key | Daily/monthly |
