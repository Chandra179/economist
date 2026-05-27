# Economist — AGENTS.md

Pure markdown documentation repository — economics study notes.

## Content

| Directory | Topic | Files |
|-----------|-------|-------|
| `micro/`  | Microeconomics | 9 |
| `macro/`  | Macroeconomics | 8 |
| `global/` | Global finance | 12 |
| `behavioral/` | Behavioral economics | 1 |
| root      | `README.md`, `overview.md`, `SUMMARY.md`, `ROADMAP.md` | 4 |

### Key files

- **`overview.md`** — mermaid diagram showing micro–macro–global linkages; best starting point
- **`SUMMARY.md`** — GitBook table of contents; update when adding/renaming pages
- **`ROADMAP.md`** — content quality ratings per section
- **`init`** — empty file; ignore

### Markdown workflow

No formatter, linter, typechecker, or test runner. Just edit markdown directly. Published via GitBook (synced to GitHub). Do not break relative links between `.md` files.

---

## `ui/` — React + TypeScript + Vite app

Standalone dashboard project with its own `package.json`, config, and dependencies.

### Stack

- React 19, TypeScript 6, Vite 8
- **Tailwind CSS v4** (no config file, no PostCSS — uses `@tailwindcss/vite` plugin + `@import "tailwindcss"` in `index.css`)
- **Recharts** for line charts
- **Frankfurter API** (free, no key) — live and historical exchange rates for CNY, IDR
- **FRED API** (free, requires API key) — Fed rate (`DFF`) and reserves (`TRESEGCNM052N`, `TRESEGIDM052N`)

### Commands

```sh
npm run dev       # Vite dev server with proxy
npm run build     # tsc -b && vite build (order matters — run typecheck first)
npm run lint      # eslint .
```

### FRED API key

Required for FRED data (Fed rate + reserves). Copy `.env.example` to `.env.local` and add your key:

```
VITE_FRED_API_KEY=your_32_char_key
```

The `.env.local` file is gitignored. Vite exposes it as `import.meta.env.VITE_FRED_API_KEY`.

### Dev proxy

`vite.config.ts` proxies `/api/fred/*` → `https://api.stlouisfed.org/*` to avoid CORS. Only works in dev. No production deployment setup exists yet.

### Data sources

| Data | API | Auth | Frequency |
|------|-----|------|-----------|
| USD/CNY, USD/IDR rates | Frankfurter | None | Daily (live) |
| 6mo–MAX FX history | Frankfurter | None | Daily/weekly/monthly |
| Fed effective rate | FRED `DFF` | API key | Daily |
| China reserves | FRED `TRESEGCNM052N` | API key | Monthly |
| Indonesia reserves | FRED `TRESEGIDM052N` | API key | Monthly |

### Architecture

```
src/
├── App.tsx                  — dashboard layout, all fetch orchestration
├── types.ts                 — shared types
├── index.css                — just @import "tailwindcss"
├── data/
│   ├── api.ts               — Frankfurter + FRED fetch functions
│   ├── countries.ts         — 3 country profiles (metadata only, no numeric data)
│   ├── frankfurter-rates.json   — API response reference
│   ├── frankfurter-history.json — API response reference
│   └── fred-observations.json   — API response reference
└── components/
    ├── CountryCard.tsx       — single country display card
    └── TrendChart.tsx        — FX chart with range selector + currency filter
```

- No routing, no state library, no test framework — plain React with `useState`/`useEffect`
- No CSS files other than `index.css` (all styling is Tailwind utility classes in JSX)
- `noUnusedLocals` and `noUnusedParameters` are strict in tsconfig — dead code causes build failure
