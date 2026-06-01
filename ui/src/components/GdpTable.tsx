import { useMemo, useState, type ReactNode } from 'react';
import { NULL_PLACEHOLDER, STEPS } from '../config';
import DataTable from './DataTable';
import TimeSeriesChart, { type LineConfig } from './TimeSeriesChart';
import { COUNTRY_COLORS } from '../config';
import type { CountryData, GdpRecord, TimeSeriesPoint } from '../types';

type Step = typeof STEPS[number];

interface Props {
  gdpData: Map<string, GdpRecord[]> | null;
  gdpCountries: CountryData[];
  debtData?: Map<string, TimeSeriesPoint[]> | null;
  debtCountries?: CountryData[];
  rateData?: Map<string, TimeSeriesPoint[]> | null;
  rateCountries?: CountryData[];
  cpiData?: Map<string, TimeSeriesPoint[]> | null;
  cpiCountries?: CountryData[];
  loading: boolean;
}

function fmtUsd(v: unknown): string {
  if (v === null || v === undefined) return NULL_PLACEHOLDER;
  const n = v as number;
  if (n >= 1e12) return '$' + (n / 1e12).toFixed(1) + 'T';
  if (n >= 1e9) return '$' + (n / 1e9).toFixed(1) + 'B';
  return '$' + (n / 1e6).toFixed(0) + 'M';
}

function fmtPct(v: unknown): string {
  if (v === null || v === undefined) return NULL_PLACEHOLDER;
  return (v as number).toFixed(1) + '%';
}

function fmtGrowth(n: number | null): ReactNode {
  if (n == null) return null;
  const pct = (n * 100).toFixed(2) + '%';
  if (n > 0) return <span className="text-green-600 ml-1" title="Year-over-year change">(+{pct})</span>;
  if (n < 0) return <span className="text-red-600 ml-1" title="Year-over-year change">({pct})</span>;
  return <span className="text-slate-400 ml-1" title="Year-over-year change">(0.00%)</span>;
}

function makeFormatWithGrowth(growthKey: string, debtKey?: string) {
  return (row: Record<string, unknown>, val: unknown) => {
    const display = fmtUsd(val);
    const growth = (row[growthKey] as number | null | undefined) ?? null;
    const debt = debtKey ? (row[debtKey] as number | null) : null;
    return (
      <span className="inline-flex items-baseline gap-1">
        <span title="Gross Domestic Product in US dollars">{display}</span>
        {debt !== null && <span className="text-slate-400" title="Debt as a percentage of GDP">[{debt.toFixed(1)}%]</span>}
        {fmtGrowth(growth)}
      </span>
    );
  };
}

export default function GdpTable({
  gdpData, gdpCountries, debtData, debtCountries, rateData, rateCountries, cpiData, cpiCountries, loading,
}: Props) {
  const [selectedCode, setSelectedCode] = useState<string | null>(null);
  const [step, setStep] = useState<Step>(1);
  const [showTable, setShowTable] = useState(true);

  const activeCodes = useMemo(() =>
    selectedCode === null
      ? gdpCountries.map((c) => c.code)
      : [selectedCode],
    [selectedCode, gdpCountries]);

  const hasDebt = debtData !== null && debtData !== undefined && (debtCountries?.length ?? 0) > 0;
  const hasRates = rateData !== null && rateData !== undefined && (rateCountries?.length ?? 0) > 0;
  const hasCpi = cpiData !== null && cpiData !== undefined && (cpiCountries?.length ?? 0) > 0;

  const allFilterCountries = useMemo(() => {
    const set = new Set<string>();
    for (const c of gdpCountries) set.add(c.code);
    if (debtCountries) for (const c of debtCountries) set.add(c.code);
    if (rateCountries) for (const c of rateCountries) set.add(c.code);
    if (cpiCountries) for (const c of cpiCountries) set.add(c.code);
    return [...set];
  }, [gdpCountries, debtCountries, rateCountries, cpiCountries]);

  const filterButtons = useMemo(() => {
    const buttons: { code: string; label: string }[] = [{ code: '', label: 'All' }];
    for (const code of allFilterCountries) {
      const c = [...gdpCountries, ...(debtCountries ?? []), ...(rateCountries ?? []), ...(cpiCountries ?? [])].find((x) => x.code === code);
      buttons.push({ code, label: (c?.flag ?? '') + ' ' + code });
    }
    return buttons;
  }, [allFilterCountries, gdpCountries, debtCountries, rateCountries, cpiCountries]);

  const { tableRows, chartRows } = useMemo(() => {
    if (!gdpData || gdpCountries.length === 0) return { tableRows: [], chartRows: [] };

    const allDates = new Set<string>();
    for (const records of gdpData.values()) {
      for (const r of records) allDates.add(r.date);
    }
    if (hasDebt) {
      for (const records of debtData!.values()) {
        for (const r of records) allDates.add(r.date);
      }
    }
    const sorted = [...allDates].sort();

    const merged = sorted.map((date) => {
      const row: Record<string, string | number | null> = { date };
      for (const c of gdpCountries) {
        const records = gdpData.get(c.code) ?? [];
        const rec = records.find((r) => r.date === date);
        row[c.code] = rec?.gdpUsd ?? null;
        row[c.code + '_gr'] = rec?.growth ?? null;
      }
      if (hasDebt) {
        for (const c of debtCountries!) {
          const records = debtData!.get(c.code) ?? [];
          row[c.code + '_debt'] = records.find((r) => r.date === date)?.value ?? null;
        }
      }
      return row;
    });

    const reversed = [...merged].reverse();

    const chartRows = hasDebt ? reversed.map((row) => {
      const r: Record<string, string | number | null> = { date: row.date as string };
      for (const c of debtCountries!) {
        r[c.code] = row[c.code + '_debt'] as number | null;
      }
      return r;
    }) : [];

    return { tableRows: reversed, chartRows };
  }, [gdpData, gdpCountries, debtData, debtCountries, hasDebt]);

  const gdpChartRows = useMemo(() => {
    if (!gdpData || gdpCountries.length === 0) return [];

    const gdpDates = new Set<string>();
    for (const records of gdpData.values()) {
      for (const r of records) gdpDates.add(r.date);
    }

    return [...gdpDates].sort().reverse().map((date) => {
      const r: Record<string, number | string | null> = { date };
      for (const c of gdpCountries) {
        const records = gdpData.get(c.code) ?? [];
        const rec = records.find((rec) => rec.date === date);
        r[c.code] = rec?.gdpUsd ?? null;
      }
      return r;
    });
  }, [gdpData, gdpCountries]);

  const rateChartRows = useMemo(() => {
    if (!hasRates || !rateData) return [];

    const allCodes = rateCountries!.map((c) => c.code);
    const yearMap = new Map<string, Record<string, number[]>>();

    for (const code of allCodes) {
      const records = rateData.get(code) ?? [];
      for (const r of records) {
        if (r.value === null) continue;
        const year = r.date.slice(0, 4);
        if (!yearMap.has(year)) yearMap.set(year, {});
        const acc = yearMap.get(year)!;
        if (!acc[code]) acc[code] = [];
        acc[code].push(r.value);
      }
    }

    return [...yearMap.keys()].sort((a, b) => Number(b) - Number(a)).map((year) => {
      const r: Record<string, number | string | null> = { date: year };
      for (const code of allCodes) {
        const values = yearMap.get(year)?.[code];
        r[code] = values?.length ? +(values.reduce((a, b) => a + b, 0) / values.length).toFixed(2) : null;
      }
      return r;
    });
  }, [rateData, rateCountries, hasRates]);

  const cpiChartRows = useMemo(() => {
    if (!hasCpi || !cpiData) return [];

    const allCodes = cpiCountries!.map((c) => c.code);
    const yearMap = new Map<string, Record<string, number[]>>();

    for (const code of allCodes) {
      const records = cpiData.get(code) ?? [];
      for (const r of records) {
        if (r.value === null) continue;
        const year = r.date.slice(0, 4);
        if (!yearMap.has(year)) yearMap.set(year, {});
        const acc = yearMap.get(year)!;
        if (!acc[code]) acc[code] = [];
        acc[code].push(r.value);
      }
    }

    return [...yearMap.keys()].sort((a, b) => Number(b) - Number(a)).map((year) => {
      const r: Record<string, number | string | null> = { date: year };
      for (const code of allCodes) {
        const values = yearMap.get(year)?.[code];
        r[code] = values?.length ? +(values.reduce((a, b) => a + b, 0) / values.length).toFixed(2) : null;
      }
      return r;
    });
  }, [cpiData, cpiCountries, hasCpi]);

  const debtChartData = useMemo(() => [...chartRows].reverse(), [chartRows]);
  const gdpChartData = useMemo(() => [...gdpChartRows].reverse(), [gdpChartRows]);
  const rateChartData = useMemo(() => [...rateChartRows].reverse(), [rateChartRows]);
  const cpiChartData = useMemo(() => [...cpiChartRows].reverse(), [cpiChartRows]);

  const mergedChartRows = useMemo(() => {
    const allYears = new Set<string>();
    for (const r of rateChartData) allYears.add(r.date as string);
    for (const r of cpiChartData) allYears.add(r.date as string);

    const rateByYear = new Map<string, Record<string, unknown>>();
    for (const r of rateChartData) rateByYear.set(r.date as string, r);
    const cpiByYear = new Map<string, Record<string, unknown>>();
    for (const r of cpiChartData) cpiByYear.set(r.date as string, r);

    const allCodes = [...new Set([
      ...(rateCountries ?? []).map((c) => c.code),
      ...(cpiCountries ?? []).map((c) => c.code),
    ])];

    return [...allYears].sort().map((year) => {
      const row: Record<string, string | number | null> = { date: year };
      const rateRow = rateByYear.get(year);
      const cpiRow = cpiByYear.get(year);
      for (const code of allCodes) {
        if (rateRow && code in rateRow) row[code + '_rate'] = (rateRow[code] as number | null) ?? null;
        if (cpiRow && code in cpiRow) row[code + '_cpi'] = (cpiRow[code] as number | null) ?? null;
      }
      return row;
    });
  }, [rateChartData, cpiChartData, rateCountries, cpiCountries]);

  const mergedLines = useMemo(() => {
    const allCodes = [...new Set([
      ...(rateCountries ?? []).map((c) => c.code),
      ...(cpiCountries ?? []).map((c) => c.code),
    ])];

    const lines: LineConfig[] = [];
    for (const [idx, code] of allCodes.entries()) {
      const country = [...(rateCountries ?? []), ...(cpiCountries ?? [])].find((c) => c.code === code);
      const name = country?.name ?? code;
      const color = COUNTRY_COLORS[idx % COUNTRY_COLORS.length];

      if (hasRates) {
        lines.push({ dataKey: code + '_rate', name: name + ' Rate', color, yAxisId: 'left' });
      }
      if (hasCpi) {
        lines.push({ dataKey: code + '_cpi', name: name + ' Inflation', color, yAxisId: 'left', strokeDasharray: '4 4' });
      }
    }

    if (selectedCode === null) return lines;
    return lines.filter((l) => l.dataKey.startsWith(selectedCode + '_'));
  }, [rateCountries, cpiCountries, hasRates, hasCpi, selectedCode]);

  const filteredTableRows = useMemo(() => {
    return tableRows.filter((_, i) => i % step === 0);
  }, [tableRows, step]);

  const columns = useMemo(() => {
    const cols: Array<{
      key: string;
      header: string;
      format?: (v: unknown) => string | ReactNode;
      formatRow?: (row: Record<string, unknown>, val: unknown) => string | ReactNode;
      sortable?: boolean;
    }> = [{ key: 'date', header: 'Year', format: (v: unknown) => String(v).replace(/-01-01$/, '') }];

    for (const code of activeCodes) {
      const country = gdpCountries.find((c) => c.code === code);
      const debtKey = hasDebt ? code + '_debt' : undefined;
      cols.push({
        key: code,
        header: country?.name ?? code,
        sortable: false,
        formatRow: makeFormatWithGrowth(code + '_gr', debtKey),
      });
    }
    return cols;
  }, [activeCodes, gdpCountries, hasDebt]);

  const chartPanels: { key: string; title: string; render: () => ReactNode }[] = [];

  if (hasDebt) {
    chartPanels.push({
      key: 'debt',
      title: 'Debt/GDP Trend',
      render: () => (
        <TimeSeriesChart
          data={debtChartData}
          valueFormatter={(v: number) => fmtPct(v)}
          countries={debtCountries ?? []}
          selectedCode={selectedCode}
          referenceLines={[{ value: 100, label: '100%' }]}
          hideLegend
        />
      ),
    });
  }

  chartPanels.push({
    key: 'gdp',
    title: 'GDP in USD',
    render: () => (
      <TimeSeriesChart
        data={gdpChartData}
        valueFormatter={(v: number) => fmtUsd(v)}
        countries={gdpCountries}
        selectedCode={selectedCode}
        hideLegend
      />
    ),
  });

  if (hasRates || hasCpi) {
    const mergedTitle = hasRates && hasCpi
      ? 'Interest Rate & Inflation'
      : hasRates ? 'Interest Rate' : 'Inflation (CPI YoY)';

    chartPanels.push({
      key: 'rate-cpi',
      title: mergedTitle,
      render: () => (
        <TimeSeriesChart
          data={mergedChartRows as Record<string, unknown>[]}
          valueFormatter={(v: number) => v.toFixed(1) + '%'}
          lines={mergedLines}
          hideLegend
          groupByCountry
        />
      ),
    });
  }

  const gridCols = 'lg:grid-cols-2';

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-xs text-slate-400 uppercase tracking-wide font-semibold">
          GDP &amp; Debt &amp; Monetary
        </h4>
        <div className="flex items-center gap-2">
          <div className="flex gap-1">
            {filterButtons.map((btn) => (
              <button
                key={btn.code}
                onClick={() => setSelectedCode(btn.code === '' ? null : btn.code)}
                className={`px-2 py-1 text-[10px] font-semibold rounded-md border transition cursor-pointer uppercase tracking-wide
                  ${(btn.code === '' && selectedCode === null) || btn.code === selectedCode
                    ? 'bg-slate-800 text-white border-slate-800'
                    : 'bg-slate-50 text-slate-400 border-slate-200 hover:border-slate-400'
                  }`}
              >
                {btn.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center text-slate-400 text-sm py-12">Loading...</div>
      ) : (
        <>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 px-1 pb-3 text-[10px] text-slate-500 font-mono">
            {COUNTRY_COLORS.slice(0, allFilterCountries.length).map((color, i) => (
              <span key={i} className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: color }} />
                {allFilterCountries[i]}
              </span>
            ))}
          </div>
          <div className={`grid grid-cols-1 md:grid-cols-2 ${gridCols} gap-4`}>
            {chartPanels.map((panel) => (
              <div key={panel.key} className="bg-white border border-slate-100 rounded-lg p-3">
                <div className="text-xs text-slate-400 uppercase tracking-wide font-semibold mb-1">
                  {panel.title}
                </div>
                {panel.render()}
              </div>
            ))}
          </div>

          <div className="mt-4 border-t border-slate-200 pt-4">
            <button
              onClick={() => setShowTable(!showTable)}
              className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 uppercase tracking-wide cursor-pointer hover:text-slate-700 transition"
            >
              <span className={`inline-block transition-transform ${showTable ? 'rotate-90' : ''}`}>▶</span>
              Data Table
            </button>

            {showTable && (
              <div className="mt-3">
                <div className="mb-3">
                  <select
                    value={step}
                    onChange={(e) => setStep(Number(e.target.value) as Step)}
                    className="border border-slate-200 rounded px-2 py-1 text-xs font-mono bg-white text-slate-700 cursor-pointer"
                  >
                    {STEPS.map((s) => (
                      <option key={s} value={s}>{s}Y</option>
                    ))}
                  </select>
                </div>
                <DataTable
                  columns={columns}
                  data={filteredTableRows as unknown as Record<string, unknown>[]}
                />
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
