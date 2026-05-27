# Economist — Improvement Roadmap

---

## Current State

| Section | Rating | Key strength | Key weakness |
|---------|:------:|-------------|-------------|
| Microeconomics | 5/10 | `market-structures.md` and `production.md` are solid | `supply-demand.md` is a 19-line fragment missing the actual supply/demand framework |
| Macroeconomics | 4/10 | Follows Mankiw outline; `growth-finance.md` is decent | `unemployment.md` is 3 lines; no IS-LM, no Solow model; generally skeletal |
| Global Finance | 8/10 | `financial-crises.md` is the standout file; strong applied institutional knowledge | `exchange-rates.md` (was `currency.md`) expanded and renamed; China case study retained as subsection |
| **Overall** | **6/10** | | |

---

## Priority Order

1. Rewrite `micro/supply-demand.md` (foundation of all micro)
2. Add IS-LM model → AD curve derivation in `macro/ad-as.md`
3. Expand `macro/unemployment.md` from 3 lines
4. Add new file: `macro/solow-growth.md` (Solow growth model); update `SUMMARY.md`
5. Add Coase theorem to `micro/externalities.md`
6. Expand remaining macro files (`monetary.md`, `open-economy.md`, `phillips-curve.md`, `gdp-cpi.md`)
7. Fill remaining micro gaps (`welfare-efficiency.md`, `labor-markets.md`, `game-theory.md`)
8. Fill global gaps — renamed `currency.md` → `exchange-rates.md`, expanded globally; added Minsky hypothesis to `financial-crises.md`; added Triffin dilemma, exorbitant privilege, Plaza/Louvre to `dollar-system.md`; expanded `shadow-banking.md`; updated all cross-references

---

### Process

Each priority item includes a **review step** before moving to the next:
- Verify facts against standard textbooks
- Check LaTeX equations for correctness
- Test relative links between `.md` files
- Update `SUMMARY.md` if files are added or renamed
- Confirm no broken cross-references

---

## Section Plans

### Macro — Full Rebuild (highest priority)

#### New File: IS-LM Model (to be folded into `ad-as.md` or stand-alone)
- Derive IS curve from goods market equilibrium (Y = C + I + G + NX)
- Derive LM curve from money market equilibrium (M/P = L(Y, i))
- Effects of expansionary/contractionary fiscal policy (IS shifts right/left)
- Effects of expansionary/contractionary monetary policy (LM shifts right/left)
- How varying P shifts LM → traces AD curve
- Limitations: fixed price level, no inflation expectations, closed economy

#### New File: Solow Growth Model (`macro/solow-growth.md`)
- Aggregate production function: Y = A F(K, L, H, N)
- Capital accumulation equation: Δk = s f(k) − δ k
- Steady state and convergence (catch-up effect)
- Golden rule level of capital
- Technological progress and the steady state with labor-augmenting tech
- Endogenous growth theory (Romer) vs. exogenous (Solow)
- Growth accounting: TFP residual decomposition

#### Expand: `macro/unemployment.md` (currently 3 lines)
- U3 vs U6 unemployment measures
- Labor force participation rate, employment-population ratio
- Natural rate of unemployment (NAIRU)
- Okun's Law: relationship between output gap and cyclical unemployment
- Efficiency wage models (shirking, turnover, selection, morale)
- Insider-outsider model and hysteresis
- Unemployment insurance and search theory (Mortensen-Pissarides)
- Beveridge curve (vacancy-unemployment relationship)

#### Expand: `macro/ad-as.md` (currently 15 lines)
- Full IS-LM → AD curve derivation (see above)
- Wealth effect, interest-rate effect, exchange-rate effect on AD
- SRAS theories: sticky wages, sticky prices, worker misperceptions
- Supply shocks (positive and negative) and stagflation
- Fiscal policy multiplier and crowding-out
- Automatic stabilizers vs. discretionary fiscal policy
- Supply-side economics (Laffer curve, marginal tax rate incentives)

#### Expand: `macro/phillips-curve.md` (currently 18 lines)
- Phillips curve equation: π = πᵉ − β(u − uⁿ) + v
- NAIRU: Non-Accelerating Inflation Rate of Unemployment
- Adaptive vs. rational expectations
- Lucas critique: policy evaluation must account for expectation changes
- Volcker disinflation (1979–1982) as case study
- Sacrifice ratio and credibility
- Hysteresis: cyclical unemployment becoming structural
- Fill in the empty "Six Debates" section with actual arguments

#### Expand: `macro/monetary.md` (currently 13 lines)
- Federal Reserve dual mandate (price stability + maximum employment)
- Taylor rule and monetary policy rules
- Transmission mechanism: fed funds → market rates → spending → output/inflation
- Liquidity trap and zero lower bound (ZLB)
- Quantitative easing and qualitative easing (balance sheet policy)
- Modern operating framework: ample reserves, IORB, ON RRP facility
- Central bank independence and time inconsistency problem
- Seigniorage and the inflation tax (expand beyond current mention)

#### Expand: `macro/open-economy.md` (currently 11 lines)
- Mundell-Fleming model (IS-LM for open economy)
- Floating vs. fixed exchange rates under capital mobility
- Impossible trinity (trilemma): pick two of three
- Interest rate parity (covered and uncovered)
- J-curve and Marshall-Lerner condition
- Balance of payments: current account, capital account, financial account
- Currency crises and speculative attacks (first and second generation models)
- Sterilization of capital inflows

#### Expand: `macro/gdp-cpi.md` (currently 11 lines)
- Value-added approach to GDP calculation
- Income vs. expenditure approaches
- GNP vs. GDP distinction
- GDP limitations: home production, underground economy, leisure, environment
- Chained-dollar methodology for real GDP
- GDP deflator vs. CPI: differences in scope and construction
- Chained CPI, PCE price index, core vs. headline inflation

#### Expand: `macro/growth-finance.md` (currently 15 lines)
- Distinguish private saving, public saving, and national saving
- Twin deficits hypothesis
- Financial intermediation: how banks, bonds, and stocks channel saving
- Risk-return tradeoff and the equity premium
- Critiques of the efficient markets hypothesis (behavioral finance, bubbles)
- Yield curve and its relationship to recessions

---

### Micro — Strengthen Fundamentals

#### Rewrite: `micro/supply-demand.md` (currently 19 lines — needs complete rebuild)
- Law of demand and demand curve (downward sloping)
- Law of supply and supply curve (upward sloping)
- Determinants of demand (income, preferences, prices of related goods, expectations, number of buyers)
- Determinants of supply (input prices, technology, expectations, number of sellers, weather)
- Shifts vs. movements along the curves
- Market equilibrium: excess supply and excess demand
- Comparative statics: analyzing what happens when curves shift
- Price elasticity of demand: midpoint formula, determinants
- Income elasticity, cross-price elasticity
- Price elasticity of supply: time horizon
- Consumer surplus and producer surplus (link to `welfare-efficiency.md`)

#### Expand: `micro/welfare-efficiency.md` (currently 22 lines)
- Deadweight loss from taxation (with diagram logic)
- Pareto efficiency definition
- First Welfare Theorem: competitive equilibrium is Pareto efficient
- Second Welfare Theorem: any Pareto efficient outcome can be achieved by redistribution then markets
- Conditions for market failure (market power, externalities, public goods, asymmetric information)
- Kaldor-Hicks efficiency as an alternative to Pareto

#### Expand: `micro/externalities.md` (currently 93 lines — biggest omission: no Coase theorem)
- **Coase theorem**: if transaction costs are zero, private bargaining → efficient outcome regardless of initial property rights
- Limitations: high transaction costs, free-rider problems with many parties
- Tradable pollution permits (cap and trade)
- Lindahl pricing for public goods
- Free-rider problem formal treatment
- Samuelson condition for optimal public good provision
- Move tax system overview to a separate section or remove (it's unrelated to externalities)

#### Expand: `micro/labor-markets.md` (currently 23 lines)
- Marginal product of labor as determinant of wages (MPL × P = wage)
- Monopsony in labor markets: artificial wage depression
- Minimum wage analysis in competitive vs. monopsonistic labor markets
- Gini coefficient and Lorenz curve
- Backward-bending labor supply curve (income vs. substitution effects)
- Efficiency wage theory detail (shirking, turnover, selection, morale)
- Discrimination models (taste-based, statistical)

#### New: Game Theory material (fold into `market-structures.md` or new file)
- Prisoners' dilemma: payoff matrix, dominant strategy equilibrium
- Nash equilibrium definition
- Cournot duopoly model (quantity competition) — extends the oligopoly discussion
- Bertrand duopoly model (price competition) — paradox of competitive outcome
- First-mover advantage (Stackelberg model) — optional, advanced

#### Expand: `micro/production.md` (currently 50 lines — decent but missing some frameworks)
- Returns to scale: constant, increasing, decreasing
- Economies of scale vs. economies of scope
- Long-run average cost curve: envelope of SRATC curves
- Isoquant and isocost framework (optional, more advanced)
- Cost minimization and the expansion path (optional, more advanced)

---

### Global — Fill Niche Gaps

#### Rename/Expand: `global/exchange-rates.md` (moved from `currency.md`, 24 → 61 lines)
- General exchange rate regimes: floating, fixed, pegged, managed float, currency board, dollarization
- Purchasing power parity (absolute and relative)
- Covered and uncovered interest rate parity
- Real effective exchange rate (REER)
- Balassa-Samuelson effect
- Carry trade and the forward premium puzzle
- Retain China case study as a subsection

#### Expand: `global/dollar-system.md` (currently 192 lines)
- Triffin dilemma: the inherent tension in a national currency serving as global reserve
- Exorbitant privilege: benefits and costs to the US
- Bretton Woods institutions (IMF, World Bank) in more detail
- Plaza Accord (1985) and Louvre Accord (1987) as historical exchange rate coordination

#### Expand: `global/financial-crises.md` (currently 153 lines — strongest file)
- Minsky's financial instability hypothesis (hedge → speculative → Ponzi units)
- 2022 UK gilt crisis (LDI pension fund margin calls) as modern shadow-banking episode

#### Expand: `global/shadow-banking.md` (assess and expand if needed)
- Review current content
- Link explicitly to the crisis propagation model in `financial-crises.md`

---

## Cross-Cutting Standards

### Equations
Add `$$` LaTeX blocks throughout **macro** files. The models are not learnable without the math:

| Model | Key equation(s) |
|-------|----------------|
| Solow growth | Δk = s f(k) − δ k |
| Phillips curve | π = πᵉ − β(u − uⁿ) + v |
| IS curve | Y = C(Y−T) + I(r) + G + NX(ε) |
| LM curve | M/P = L(Y, i) |
| AD curve | P shifts LM → derives AD |
| Taylor rule | i = r* + π + α(π − π*) + β(y − ȳ) |
| Mundell-Fleming | IS* and LM* with e on vertical axis |
| Quantity theory | M V = P Y |
| Money multiplier | m = 1/R |

### Case Studies
Bring the global section's case-study approach to macro:

- **Volcker disinflation** (1979–1982): Phillips curve + sacrifice ratio in practice
- **Japan's lost decade** (1990s–present): Liquidity trap, ZLB, QE
- **Eurozone sovereign debt crisis** (2010–2012): Currency union without fiscal union
- **COVID-19 fiscal response** (2020–2021): Modern monetary-fiscal coordination, supply chain inflation

### Diagrams
Add mermaid flowcharts for:
- IS-LM → AD curve derivation
- Solow steady-state dynamics
- Mundell-Fleming under floating vs. fixed regimes
- Phillips curve with shifts (expectations, supply shocks)

### File Length Targets
- **Short files (<25 lines)**: `supply-demand.md` (19), `unemployment.md` (3), `gdp-cpi.md` (11), `open-economy.md` (11), `monetary.md` (13), `ad-as.md` (15), `growth-finance.md` (15) — all needed significant expansion (now all expanded)
- **Target**: no topic file below ~50 lines of substantive content (equations, diagrams, prose)

---

## Verification Checklist

After each improvement (and before moving to the next priority item):
- [ ] Facts are accurate against standard textbooks (Mankiw, Blanchard, Krugman)
- [ ] Equations are correctly formatted in LaTeX
- [ ] Relative links to other files in the repo still work
- [ ] `SUMMARY.md` updated if files were added or renamed
- [ ] No broken cross-references
- [ ] File meets ~50-line substantive content target
