import { useMemo, useState, type ReactNode } from 'react';
import { NULL_PLACEHOLDER, STEPS, COUNTRY_COLORS } from '../config';
import DataTable from './DataTable';
import GdpChartPanel from './GdpChartPanel';
import DebtChartPanel from './DebtChartPanel';
import RateCpiChartPanel from './RateCpiChartPanel';
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

  const debtSafe = useMemo(() => debtData ?? null, [debtData]);
  const debtCountriesSafe = useMemo(() => debtCountries ?? [], [debtCountries]);
  const rateSafe = useMemo(() => rateData ?? null, [rateData]);
  const rateCountriesSafe = useMemo(() => rateCountries ?? [], [rateCountries]);
  const cpiSafe = useMemo(() => cpiData ?? null, [cpiData]);
  const cpiCountriesSafe = useMemo(() => cpiCountries ?? [], [cpiCountries]);

  const hasDebt = debtSafe !== null && debtCountriesSafe.length > 0;
  const hasRates = rateSafe !== null && rateCountriesSafe.length > 0;
  const hasCpi = cpiSafe !== null && cpiCountriesSafe.length > 0;

  const allFilterCountries = useMemo(() => {
    const set = new Set<string>();
    for (const c of gdpCountries) set.add(c.code);
    for (const c of debtCountriesSafe) set.add(c.code);
    for (const c of rateCountriesSafe) set.add(c.code);
    for (const c of cpiCountriesSafe) set.add(c.code);
    return [...set];
  }, [gdpCountries, debtCountriesSafe, rateCountriesSafe, cpiCountriesSafe]);

  const filterButtons = useMemo(() => {
    const buttons: { code: string; label: string }[] = [{ code: '', label: 'All' }];
    for (const code of allFilterCountries) {
      const all = [...gdpCountries, ...debtCountriesSafe, ...rateCountriesSafe, ...cpiCountriesSafe];
      const c = all.find((x) => x.code === code);
      buttons.push({ code, label: (c?.flag ?? '') + ' ' + code });
    }
    return buttons;
  }, [allFilterCountries, gdpCountries, debtCountriesSafe, rateCountriesSafe, cpiCountriesSafe]);

  const activeCodes = useMemo(() =>
    selectedCode === null
      ? gdpCountries.map((c) => c.code)
      : [selectedCode],
    [selectedCode, gdpCountries]);

  const tableRows = useMemo(() => {
    if (!gdpData || gdpCountries.length === 0) return [];

    const allDates = new Set<string>();
    for (const records of gdpData.values()) {
      for (const r of records) allDates.add(r.date);
    }
    if (debtSafe && debtCountriesSafe.length > 0) {
      for (const records of debtSafe.values()) {
        for (const r of records) allDates.add(r.date);
      }
    }

    const sorted = [...allDates].sort();
    return sorted.map((date) => {
      const row: Record<string, string | number | null> = { date };
      for (const c of gdpCountries) {
        const records = gdpData.get(c.code) ?? [];
        const rec = records.find((r) => r.date === date);
        row[c.code] = rec?.gdpUsd ?? null;
        row[c.code + '_gr'] = rec?.growth ?? null;
      }
      if (debtSafe && debtCountriesSafe.length > 0) {
        for (const c of debtCountriesSafe) {
          const records = debtSafe.get(c.code) ?? [];
          row[c.code + '_debt'] = records.find((r) => r.date === date)?.value ?? null;
        }
      }
      return row;
    }).reverse();
  }, [gdpData, gdpCountries, debtSafe, debtCountriesSafe]);

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

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
            {hasDebt && (
              <DebtChartPanel
                debtData={debtSafe}
                debtCountries={debtCountriesSafe}
                selectedCode={selectedCode}
              />
            )}
            <GdpChartPanel
              gdpData={gdpData}
              gdpCountries={gdpCountries}
              selectedCode={selectedCode}
            />
            {(hasRates || hasCpi) && (
              <RateCpiChartPanel
                rateData={rateSafe}
                rateCountries={rateCountriesSafe}
                cpiData={cpiSafe}
                cpiCountries={cpiCountriesSafe}
                selectedCode={selectedCode}
              />
            )}
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
