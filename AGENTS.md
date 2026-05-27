# Economist — AGENTS.md

Pure markdown documentation repository — economics study notes.

## Structure

| Directory | Topic | Files |
|-----------|-------|-------|
| `micro/`  | Microeconomics | 9 |
| `macro/`  | Macroeconomics | 8 |
| `global/` | Global finance | 12 |
| `behavioral/` | Behavioral economics | 1 |
| `ui/`     | React + Vite app (separate project) | — |
| root      | `README.md`, `overview.md`, `SUMMARY.md`, `ROADMAP.md` | 4 |

## Key files

- **`overview.md`** — mermaid diagram showing micro–macro–global linkages; best starting point
- **`SUMMARY.md`** — GitBook table of contents; **update when adding/renaming pages**
- **`ROADMAP.md`** — improvement priorities and content quality ratings per section
- **`init`** — empty file; ignore

## Workflows

- **Markdown content**: no formatter, linter, typechecker, or test runner. Just edit markdown directly. Published via GitBook (synced to GitHub). Do not break relative links between `.md` files.
- **`ui/`**: standalone React + TypeScript + Vite app. Uses `tsc -b && vite build` for build, `eslint .` for lint, `vite` for dev server. Has its own `package.json` and config.
