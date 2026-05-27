# Economist — Improvement Roadmap

---

## Current State

| Section | Rating | Key strength | Key weakness |
|---------|:------:|-------------|-------------|
| Microeconomics | 7/10 | `supply-demand.md` fully rebuilt; game theory, externalities, and welfare all expanded | `frontiers.md` (24 lines) and `market-intervention.md` (33 lines) could go deeper |
| Macroeconomics | 7/10 | IS-LM model added to `ad-as.md`; Solow growth model created; unemployment expanded from 3 to 66 lines | `growth-finance.md` still at 15 lines — never expanded from the original short version |
| Global Finance | 8/10 | `trade.md` (169 lines), `dollar-system.md` (235 lines), `financial-crises.md` (178 lines) all strong; `exchange-rates.md` renamed and expanded | `supply-chain.md` (26 lines) and `shadow-banking.md` (50 lines) could use more depth |
| **Overall** | **7/10** | | |

---

## Remaining Work

1. **Expand `macro/growth-finance.md`** — only priority item never implemented. Needs sections on private vs. public saving, twin deficits, financial intermediation, risk-return tradeoff, EMH critiques, yield curve (see original plan in section below)
2. **Expand `global/supply-chain.md`** (26 lines) — current content is thin relative to the topic's importance
3. **Consider cross-cutting additions**: case studies (Volcker disinflation, Japan lost decade, Eurozone crisis, COVID response), more mermaid diagrams for IS-LM → AD, Solow steady-state, Mundell-Fleming

---

## Original Section Plans (kept for reference)

### Macro — REMAINING

#### Expand: `macro/growth-finance.md` (currently 15 lines)
- Distinguish private saving, public saving, and national saving
- Twin deficits hypothesis
- Financial intermediation: how banks, bonds, and stocks channel saving
- Risk-return tradeoff and the equity premium
- Critiques of the efficient markets hypothesis (behavioral finance, bubbles)
- Yield curve and its relationship to recessions

### Cross-Cutting Standards (mostly complete)

#### Equations
Most macro files now have `$$` LaTeX blocks. The key models are covered.

#### File Length Targets
All files that were below 25 lines have been expanded except `growth-finance.md` (15 lines).

---

## Verification Checklist

After any improvement:
- [ ] Facts are accurate against standard textbooks (Mankiw, Blanchard, Krugman)
- [ ] Equations are correctly formatted in LaTeX
- [ ] Relative links to other files in the repo still work
- [ ] `SUMMARY.md` updated if files were added or renamed
- [ ] No broken cross-references
