# Economics Dashboard — Enhancement Tasks

## Phase 1 — Inflation (CPI) ✅ DONE

**Source**: FRED — all monthly index levels. YoY inflation computed on frontend.

| # | Task | File(s) | Status |
|---|------|---------|--------|
| 1 | Add `FredCpiSeries *string` to `Country` struct | `server/internal/config/config.go` | ✅ |
| 2 | Configure CPI series: US=`CPIAUCSL`, CN=`CHNCPIALLMINMEI`, ID=`IDNCPIALLMINMEI` | `server/internal/config/config.go` | ✅ |
| 3 | Add `fredCpiSeries` to `CountryData` type | `ui/src/types.ts` | ✅ |
| 4 | Fetch CPI history in App.tsx (same pattern as `rateHistoryData`) | `ui/src/App.tsx` | ✅ |
| 5 | Compute YoY inflation % from CPI index levels — `(idx_M − idx_M−12) / idx_M−12 × 100` | `ui/src/App.tsx` + `GdpTable.tsx` | ✅ |
| 6 | Add CPI dashed line to Rate chart panel (shared % axis) | `ui/src/components/GdpTable.tsx` | ✅ |
| 7 | Show latest inflation on CountryCards | `ui/src/components/CountryCard.tsx` | ✅ |

## Phase 2 — Quick Wins

| # | Task | Source | Status |
|---|------|--------|--------|
| 1 | Reserves history chart panel | FRED: `TRESEGCNM052N`, `TRESEGIDM052N` (already in config) | Data fetched, chart pending |
| 2 | Debt % on CountryCards | Already fetched in `debtData` | Just needs card render |
| 3 | GDP per capita | `GDP ÷ population` — WB `SP.POP.TOTL` | WB data confirmed for all 3 |
| 4 | Wire up `IntervalSelector` for FX chart frequency | Component exists, dead code | Connect to `fxInterval` |

## Phase 3 — Medium Effort

| # | Task | Source | Status |
|---|------|--------|--------|
| 1 | Correlation scatter plot (X=debt/GDP, Y=rate, color=GDP growth) | All data already in memory | Compute only |
| 2 | M2 money supply chart | US: FRED `M2SL` (current). CN/ID: WB `FM.LBL.BMNY.GD.ZS` (% GDP) | FRED M2 for CN/ID stale (ends 2017-2019) |
| 3 | REER chart (Real Effective Exchange Rate) | FRED BIS series: `RBCNBIS` (CN), `RBIDBIS` (ID), `RBUSBIS` (US) | Monthly, current, Index 2020=100 |

## Phase 4 — Need New Data Source or Verification

| # | Task | Source | Status |
|---|------|--------|--------|
| 1 | Trade balance / current account | WB `BN.CAB.XOKA.GD.ZS` (CN, ID), FRED `BOPGSTB` (US) | Confirmed — data exists |
| 2 | Commodity prices (oil, coal, palm oil, LNG) | FRED: `DCOILWTICO`, `DCOILBRENTEU`, `PCOALAUUSDM`, `PPOILUSDM`, `PNGASJPUSDM` | Confirmed — all exist, monthly |
| 3 | Gini / inequality | WB `SI.POV.GINI` | US: 41.8, ID: 34.4. CN: **no data** |
| 4 | GDP per capita (PPP-adjusted) | WB `NY.GDP.PCAP.PP.CD` | Confirmed — all 3 countries |

## Notes

- FRED M2 for CN (`MYAGM2CNM189N`) ends Aug 2019, ID (`MYAGM2IDM189N`) ends Apr 2017 — too stale
- China Gini not available on World Bank
- BIS REER series copyright BIS — require citation
- IMF commodity prices copyright IMF — require citation
