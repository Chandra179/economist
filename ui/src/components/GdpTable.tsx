import { useMemo, useState, type ReactNode } from 'react';
import { NULL_PLACEHOLDER, STEPS } from '../config';
import DataTable from './DataTable';
import TimeSeriesChart from './TimeSeriesChart';
import type { CountryData, GdpRecord, TimeSeriesPoint } from '../types';

type Step = typeof STEPS[number];
type View = 'table' | 'debtChart' | 'gdpChart' | 'rate';

interface Props {
  gdpData: Map<string, GdpRecord[]> | null;
  gdpCountries: CountryData[];
  debtData?: Map<string, TimeSeriesPoint[]> | null;
  debtCountries?: CountryData[];
  rateData?: Map<string, TimeSeriesPoint[]> | null;
  rateCountries?: CountryData[];
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
  gdpData, gdpCountries, debtData, debtCountries, rateData, rateCountries, loading,
}: Props) {
  const [view, setView] = useState<View>('table');
  const [selectedCode, setSelectedCode] = useState<string | null>(null);
  const [step, setStep] = useState<Step>(1);

  const activeCodes = selectedCode === null
    ? gdpCountries.map((c) => c.code)
    : [selectedCode];

  const hasDebt = debtData !== null && debtData !== undefined && (debtCountries?.length ?? 0) > 0;
  const hasRates = rateData !== null && rateData !== undefined && (rateCountries?.length ?? 0) > 0;

  const allFilterCountries = useMemo(() => {
    const set = new Set<string>();
    for (const c of gdpCountries) set.add(c.code);
    if (debtCountries) for (const c of debtCountries) set.add(c.code);
    if (rateCountries) for (const c of rateCountries) set.add(c.code);
    return [...set];
  }, [gdpCountries, debtCountries, rateCountries]);

  const filterButtons = useMemo(() => {
    const buttons: { code: string; label: string }[] = [{ code: '', label: 'All' }];
    for (const code of allFilterCountries) {
      const c = [...gdpCountries, ...(debtCountries ?? []), ...(rateCountries ?? [])].find((x) => x.code === code);
      buttons.push({ code, label: (c?.flag ?? '') + ' ' + code });
    }
    return buttons;
  }, [allFilterCountries, gdpCountries, debtCountries, rateCountries]);

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

  const debtChartData = useMemo(() => [...chartRows].reverse(), [chartRows]);
  const gdpChartData = useMemo(() => [...gdpChartRows].reverse(), [gdpChartRows]);
  const rateChartData = useMemo(() => [...rateChartRows].reverse(), [rateChartRows]);

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

  const availableViews: { id: View; label: string }[] = [
    { id: 'table', label: 'Table' },
    { id: 'debtChart', label: 'Debt/GDP' },
    { id: 'gdpChart', label: 'GDP' },
  ];
  if (hasRates) {
    availableViews.push({ id: 'rate', label: 'Rate' });
  }

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-xs text-slate-400 uppercase tracking-wide font-semibold flex items-center gap-1">
          {view === 'gdpChart' ? 'GDP in USD' : view === 'rate' ? 'Interest Rate' : 'Debt/GDP Trend'}
          {view !== 'gdpChart' && view !== 'rate' && (
            <span className="relative group flex items-center">
              <span className="text-slate-300 cursor-help text-[9px] leading-none w-3.5 h-3.5 rounded-full border border-slate-300 inline-flex items-center justify-center">i</span>
              <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 w-56 p-1.5 text-[10px] leading-tight text-white bg-slate-800 rounded shadow-lg opacity-0 group-hover:opacity-100 transition pointer-events-none z-10 text-center">
                {view === 'debtChart' ? 'Government debt as % of GDP. 100% threshold shown as red dashed line.' : ''}
              </span>
            </span>
          )}
        </h4>
        <div className="flex items-center gap-2">
          <div className="flex gap-1">
            {availableViews.map(({ id, label }) => (
              <button
                key={id}
                onClick={() => setView(id)}
                className={`px-2 py-1 text-[10px] font-semibold rounded-md border transition cursor-pointer uppercase tracking-wide
                  ${view === id
                    ? 'bg-slate-700 text-white border-slate-700'
                    : 'bg-slate-50 text-slate-400 border-slate-200 hover:border-slate-400'
                  }`}
              >
                {label}
              </button>
            ))}
          </div>
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
          {view === 'table' && (
            <select
              value={step}
              onChange={(e) => setStep(Number(e.target.value) as Step)}
              className="border border-slate-200 rounded px-2 py-1 text-xs font-mono bg-white text-slate-700 cursor-pointer"
            >
              {STEPS.map((s) => (
                <option key={s} value={s}>{s}Y</option>
              ))}
            </select>
          )}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center text-slate-400 text-sm py-12">Loading...</div>
      ) : view === 'table' ? (
        <DataTable
          columns={columns}
          data={filteredTableRows as unknown as Record<string, unknown>[]}
        />
      ) : view === 'debtChart' ? (
        <TimeSeriesChart
          key="debtChart"
          data={debtChartData}
          valueFormatter={(v: number) => fmtPct(v)}
          countries={debtCountries ?? []}
          selectedCode={selectedCode}
          referenceLines={[{ value: 100, label: '100%' }]}
        />
      ) : view === 'gdpChart' ? (
        <TimeSeriesChart
          key="gdpChart"
          data={gdpChartData}
          valueFormatter={(v: number) => fmtUsd(v)}
          countries={gdpCountries}
          selectedCode={selectedCode}
        />
      ) : view === 'rate' && !rateData ? (
        <div className="flex items-center justify-center text-slate-400 text-sm py-12">Loading rate history...</div>
      ) : (
        <TimeSeriesChart
          key="rateChart"
          data={rateChartData as Record<string, unknown>[]}
          valueFormatter={(v: number) => v.toFixed(2) + '%'}
          countries={rateCountries ?? []}
          selectedCode={selectedCode}
        />
      )}
    </div>
  );
}
