# Overview

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

### Quick links

- [Supply & Demand](micro/supply-demand.md)
- [Market Intervention](micro/market-intervention.md)
- [Welfare & Efficiency](micro/welfare-efficiency.md)
- [Externalities & Public Goods](micro/externalities.md)
- [Costs of Production](micro/production.md)
- [Market Structures](micro/market-structures.md)
- [Labor Markets & Inequality](micro/labor-markets.md)
- [Frontiers of Microeconomics](micro/frontiers.md)
- [GDP & Cost of Living](macro/gdp-cpi.md)
- [Growth & Finance](macro/growth-finance.md)
- [Unemployment](macro/unemployment.md)
- [Monetary System & Inflation](macro/monetary.md)
- [Open Economy](macro/open-economy.md)
- [Aggregate Demand & Supply](macro/ad-as.md)
- [Inflation & Unemployment](macro/phillips-curve.md)
- [Currency & Exchange Rates](global/currency.md)
- [Supply Chain Advantages](global/supply-chain.md)
- [Shadow Banking](global/shadow-banking.md)
- [The Dollar System](global/dollar-system.md)
