import { useMemo, useState } from 'react';
import DataTable from './DataTable';
import type { ReactNode } from 'react';

interface GdpPoint {
  date: string;
  cnyGdp: number | null;
  idrGdp: number | null;
}

interface Props {
  data: GdpPoint[] | null;
  loading: boolean;
  selectedCurrencies: 'both' | 'CNY' | 'IDR';
  onCurrencyChange: (c: 'both' | 'CNY' | 'IDR') => void;
}

const STEPS = [1, 3, 5, 10] as const;
type Step = typeof STEPS[number];

function fmtUsd(v: unknown): string {
  if (v === null || v === undefined) return '\u2014';
  const n = v as number;
  if (n >= 1e12) return '$' + (n / 1e12).toFixed(1) + 'T';
  if (n >= 1e9) return '$' + (n / 1e9).toFixed(1) + 'B';
  return '$' + (n / 1e6).toFixed(0) + 'M';
}

function fmtGrowth(n: number | null): ReactNode {
  if (n == null) return null;
  const pct = (n * 100).toFixed(2) + '%';
  if (n > 0) return <span className="text-green-600 ml-1">(+{pct})</span>;
  if (n < 0) return <span className="text-red-600 ml-1">({pct})</span>;
  return <span className="text-slate-400 ml-1">(0.00%)</span>;
}

function makeFormatWithGrowth(key: string) {
  return (row: Record<string, unknown>, val: unknown) => {
    const display = fmtUsd(val);
    const growth = row[key] as number | null | undefined;
    if (growth == null) return display;
    return <span className="inline-flex items-baseline">{display}{fmtGrowth(growth)}</span>;
  };
}

function computeGrowth(data: GdpPoint[]) {
  const sorted = [...data].sort((a, b) => a.date.localeCompare(b.date));

  let prevCny: number | null = null;
  let prevIdr: number | null = null;

  const withGrowth = sorted.map((row) => {
    const cnyGrowth = row.cnyGdp != null && prevCny != null ? (row.cnyGdp - prevCny) / prevCny : null;
    const idrGrowth = row.idrGdp != null && prevIdr != null ? (row.idrGdp - prevIdr) / prevIdr : null;
    prevCny = row.cnyGdp ?? prevCny;
    prevIdr = row.idrGdp ?? prevIdr;
    return { ...row, cnyGrowth, idrGrowth };
  });

  return withGrowth.reverse();
}

export default function GdpTable({ data, loading, selectedCurrencies, onCurrencyChange }: Props) {
  const [step, setStep] = useState<Step>(1);

  const rows = useMemo(() => {
    const withGrowth = computeGrowth(data ?? []);
    return withGrowth.filter((_, i) => i % step === 0);
  }, [data, step]);

  const columns = [
    { key: 'date', header: 'Year', format: (v: unknown) => String(v).replace(/-01-01$/, '') },
    ...(selectedCurrencies === 'both' || selectedCurrencies === 'CNY'
      ? [{ key: 'cnyGdp' as const, header: 'China', formatRow: makeFormatWithGrowth('cnyGrowth') }]
      : []),
    ...(selectedCurrencies === 'both' || selectedCurrencies === 'IDR'
      ? [{ key: 'idrGdp' as const, header: 'Indonesia', formatRow: makeFormatWithGrowth('idrGrowth') }]
      : []),
  ];

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-xs text-slate-400 uppercase tracking-wide font-semibold">GDP Trend</h4>
        <div className="flex items-center gap-2">
          <div className="flex gap-1 mr-2">
            {(['both', 'CNY', 'IDR'] as const).map((c) => (
              <button
                key={c}
                onClick={() => onCurrencyChange(c)}
                className={`px-2 py-1 text-[10px] font-semibold rounded-md border transition cursor-pointer uppercase tracking-wide
                  ${selectedCurrencies === c
                    ? c === 'CNY'
                      ? 'bg-red-500 text-white border-red-500'
                      : c === 'IDR'
                        ? 'bg-green-600 text-white border-green-600'
                        : 'bg-slate-800 text-white border-slate-800'
                    : 'bg-slate-50 text-slate-400 border-slate-200 hover:border-slate-400'
                  }`}
              >
                {c === 'both' ? 'All' : c}
              </button>
            ))}
          </div>
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
      </div>

      {loading ? (
        <div className="flex items-center justify-center text-slate-400 text-sm py-12">Loading...</div>
      ) : (
        <DataTable
          columns={columns}
          data={rows as unknown as Record<string, unknown>[]}
        />
      )}
    </div>
  );
}
