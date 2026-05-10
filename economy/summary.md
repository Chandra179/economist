# Summary

```mermaid
graph TD
  %% --- Micro core ---
  WTP[Consumer Willingness to Pay<br/>preferences, quality, income] -->|+| D[Demand]
  Cost[Cost of Production] -->|-| S[Supply]
  D -->|price & quantity| Market[Market Price & Quantity]
  S --> Market
  Market -->|-| D
  Market -->|+| S

  %% Policy interventions
  Tax[Tax on Goods<br/>incidence depends on elasticities] -->|wedge| Market
  Pcontrol[Price Controls<br/>ceiling/floor] -->|distortion| Market
  Market -->|shortage / surplus| Pcontrol

  %% Market structure
  MktStr[Monopoly / Oligopoly / Monopolistic Competition] -->|market power| Market
  Market -->|supernormal profits| MktStr

  %% Externalities & regulation
  Ext[Externalities<br/>+/- spillovers] -->|market failure| Reg[Regulation / Pigouvian Taxes]
  Reg --> Tax
  Reg --> Pcontrol

  %% Efficiency & equity
  Market --> Effic[Market Efficiency<br/>allocative: P=MC]
  Effic -->|total surplus| Welfare[Social Welfare]
  Inequality[Inequality & Poverty] -->|pressure for| Redist[Government Redistribution<br/>transfers, progressive taxes]
  Redist -->|alters| Income[Household Income]
  Income --> WTP
  Redist --> Tax
  Redist --> Welfare

  %% Earnings, discrimination
  Earnings[Earnings & Discrimination] --> Income
  Discrimination[Discrimination in Labour Market] -->|-wages| Earnings
  Market -->|derived demand for labour| Earnings

  %% Macro linkages
  AD[Aggregate Demand<br/>C+I+G+NX] --> Output[GDP / Output]
  AS[Aggregate Supply<br/>SRAS & LRAS] --> Output
  Output --> Unemp[Unemployment]
  Unemp -->|Okun's Law| Output
  Unemp -->|wage pressure| Earnings
  Output --> Inf[Inflation]

  %% Phillips curve feedback
  Inf -->|short-run trade-off| Unemp

  %% Monetary & fiscal policy
  Inf --> CB[Monetary Policy<br/>interest rate / money supply]
  CB -->|+/-| Int[Interest Rate]
  Int -->|-| Invest[Investment]
  Invest --> AD
  Gov[Fiscal Policy<br/>G & T] --> AD
  Redist --> Gov

  %% Open economy
  Int -->|exchange rate| NX[Net Exports]
  NX --> AD

  %% Supply side feedback
  Inf -->|inflation expectations| Wage[Wage Demands]
  Wage --> Cost
  Wage --> AS

  %% Production and growth
  Output --> Growth[Long-Run Growth<br/>productivity, saving]
  Growth --> AS

  %% Saving, financial system
  Income --> Saving[Saving]
  Saving --> Invest
  
  %% Measuring cost of living
  Inf --> COL[Cost of Living]
  COL --> WTP

  %% Micro-macro loop
  Market --> Output
```

Control on prices (too low / too high / just right) affects supply (seller) and demand (consumer).

* A price ceiling set below equilibrium creates a shortage (excess demand); a price floor set above equilibrium creates a surplus (excess supply).
* A price at the equilibrium level allows the market to clear without shortage or surplus.

A tax on goods, whether levied on sellers or buyers, affects the market outcome. The division of the tax burden (tax incidence) depends on the relative price elasticities of **both supply and demand**, not just supply elasticity. Other aspects of tax design (progressivity, administrative cost, deadweight loss, etc.) also warrant deep analysis.

Also consider consumer willingness to pay for a good (based on price, quality, preferences, income, etc.).

Market efficiency:

* Allocative efficiency means distributing resources to their highest‑valued uses and producing at the lowest possible cost, which maximises total surplus (consumer + producer surplus).
* Efficiency does **not** guarantee fairness (equity). Whether the government should intervene to redistribute resources is a normative question.

Externalities and regulations that affect markets.

Firms in competitive markets:

* Cost of production
* Revenue of a competitive firm

Monopoly\
Monopolistic competition\
Oligopoly

Earnings and discrimination\
Inequality and poverty\
Theory of consumer choice

**Microeconomics** (topics above +)

**Macroeconomics**\
Measuring a nation’s income\
Measuring the cost of living\
Production and growth\
Saving, investment, and the financial system\
Unemployment\
Monetary system\
Money growth and inflation\
A macroeconomic theory of the open economy\
Aggregate demand and aggregate supply\
The influence of monetary and fiscal policy on aggregate demand\
The short‑run trade‑off between inflation and unemployment
