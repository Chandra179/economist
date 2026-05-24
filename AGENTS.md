# Economist — AGENTS.md

Pure markdown documentation repository — economics study notes. No code, no build, no tests.

## Structure

| Directory | Topic |
|-----------|-------|
| `micro/`  | Microeconomics (8 files) |
| `macro/`  | Macroeconomics (7 files) |
| `global/` | Global finance (4 files) |
| root      | `README.md` (landing), `overview.md` (mermaid diagram + index), `SUMMARY.md` (table of contents) |

## Key files

- **`overview.md`** — contains a mermaid diagram showing micro–macro linkages; best starting point
- **`SUMMARY.md`** — GitBook table of contents; update when adding/renaming pages
- **`init`** — empty file; ignore

## Workflows

- All content is markdown; no formatter, linter, or typechecker
- Repo is published via **GitBook** (synced to GitHub); do not break relative links between `.md` files
- No commands to run — just edit markdown directly
