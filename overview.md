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

  %% Global finance
  NX -->|trade policy| Tariff[Trade & Tariffs<br/>Tariffs, WTO, Trade Blocs]
  Tariff -->|retaliation| ExportCtrl[Export Controls<br/>chip war, rare earths]
  ExportCtrl -->|supply shock| Cost
  Tariff -->|supply chain shift| SC[Supply Chain<br/>advantages, relocation]
  SC -->|lower cost| Cost
  SC -->|resilience vs efficiency| Tariff

  Int -->|hot money flows| CapitalFlows[Capital Flows<br/>boom-bust cycle]
  Leverage[Leverage & Maturity Mismatch<br/>bank runs, repo, shadow banking] -->|crisis| Crisis[Financial Crises<br/>contagion, bailouts]
  Crisis -->|credit crunch| Output
  Crisis -->|wholesale run| CapitalFlows
  CapitalFlows -->|currency crisis| NX
  CapitalFlows -->|default risk| Debt[Sovereign Debt<br/>IMF bailouts]
  Debt -->|austerity| Gov
  Debt -->|devaluation| Inf

  Dollar[Dollar System<br/>reserve currency, sanctions] -->|prices oil| NX
  Dollar -->|printing| Inf
  Dollar -->|Fed rates| Int
  Dollar -->|sanctions| Tariff

  Energy[Energy Geopolitics<br/>OPEC, gas, transition] -->|oil price| Cost
  Energy -->|inflation| Inf
  Energy -->|supply| NX

  Digital[Digital Currencies<br/>CBDCs, de-dollarization] -->|challenge| Dollar
  Climate[Climate Finance<br/>carbon markets, CBAM] -->|carbon tax| Tariff
  Climate -->|green investment| Invest

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
- [Trade & Tariffs](global/trade.md)
- [Financial Crises](global/financial-crises.md)
- [Capital Flows & Crises](global/capital-flows.md)
- [Sovereign Debt & IMF](global/sovereign-debt.md)
- [Energy Geopolitics](global/energy-geopolitics.md)
- [Digital Currencies](global/digital-currency.md)
- [Climate Finance](global/climate-finance.md)
- [Export Controls](global/export-controls.md)
- [Supply Chain Advantages](global/supply-chain.md)
- [Shadow Banking](global/shadow-banking.md)
- [The Dollar System](global/dollar-system.md)
