import { useState } from 'react';
import { NULL_PLACEHOLDER } from '../config';
import type { FxPoint, CurrencyFilter } from '../types';

import DataTable from './DataTable';
import TimeSeriesChart from './TimeSeriesChart';

interface Props {
  data: FxPoint[] | null;
  loading: boolean;
  selectedCurrencies: CurrencyFilter;
  onCurrencyChange: (c: CurrencyFilter) => void;
}

function formatDate(dateStr: string): string {
  return dateStr.slice(0, 4);
}

function fmtRate(v: unknown): string {
  if (v === null || v === undefined) return NULL_PLACEHOLDER;
  return (v as number).toLocaleString(undefined, { minimumFractionDigits: 4, maximumFractionDigits: 4 });
}

function fmtPctChange(v: unknown): string {
  if (v === null || v === undefined) return NULL_PLACEHOLDER;
  const n = v as number;
  return (n >= 0 ? '+' : '') + n.toFixed(2) + '%';
}

const FX_COUNTRIES = [
  { code: 'CNY', name: 'China Yuan' },
  { code: 'IDR', name: 'Indonesia Rupiah' },
];

export default function FxTable({ data, loading, selectedCurrencies, onCurrencyChange }: Props) {
  const [view, setView] = useState<'table' | 'chart'>('table');
  const rows = (data ?? []).map((p) => ({
    date: p.date,
    usdcny: p.usdcny,
    usdidr: p.usdidr,
  }));

  const columns = [
    { key: 'date', header: 'Date', format: (v: unknown) => formatDate(String(v)) },
    ...(selectedCurrencies === 'both' || selectedCurrencies === 'CNY'
      ? [{ key: 'usdcny' as const, header: 'USD/CNY', format: fmtRate }]
      : []),
    ...(selectedCurrencies === 'both' || selectedCurrencies === 'IDR'
      ? [{ key: 'usdidr' as const, header: 'USD/IDR', format: fmtRate }]
      : []),
  ];

  const baseRow = rows.find((r) => r.usdcny != null && r.usdidr != null) ?? rows[0];
  const baseCny = baseRow?.usdcny ?? null;
  const baseIdr = baseRow?.usdidr ?? null;
  const chartData = rows.map((r) => ({
    date: r.date,
    ...(selectedCurrencies === 'both' || selectedCurrencies === 'CNY'
      ? { CNY: baseCny != null && r.usdcny != null ? ((baseCny - r.usdcny) / baseCny) * 100 : null }
      : {}),
    ...(selectedCurrencies === 'both' || selectedCurrencies === 'IDR'
      ? { IDR: baseIdr != null && r.usdidr != null ? ((baseIdr - r.usdidr) / baseIdr) * 100 : null }
      : {}),
  }));

  const chartCountries = FX_COUNTRIES.filter(
    (c) => selectedCurrencies === 'both' || c.code === selectedCurrencies
  );

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-xs text-slate-400 uppercase tracking-wide font-semibold flex items-center gap-1">
          Exchange Rate Trend
          <span className="relative group flex items-center">
            <span className="text-slate-300 cursor-help text-[9px] leading-none w-3.5 h-3.5 rounded-full border border-slate-300 inline-flex items-center justify-center">i</span>
            <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 w-60 p-1.5 text-[10px] leading-tight text-white bg-slate-800 rounded shadow-lg opacity-0 group-hover:opacity-100 transition pointer-events-none z-10 text-center">
              +% = currency strengthened vs USD. -% = currency weakened vs USD.
            </span>
          </span>
        </h4>
        <div className="flex items-center gap-2">
          <div className="flex gap-1 mr-2">
            {(['table', 'chart'] as const).map((v) => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={`px-2 py-1 text-[10px] font-semibold rounded-md border transition cursor-pointer uppercase tracking-wide
                  ${view === v
                    ? 'bg-slate-800 text-white border-slate-800'
                    : 'bg-slate-50 text-slate-400 border-slate-200 hover:border-slate-400'
                  }`}
              >
                {v}
              </button>
            ))}
          </div>
          <div className="flex gap-1 mr-2">
            {(['both', 'CNY', 'IDR'] as CurrencyFilter[]).map((c) => (
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
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center text-slate-400 text-sm py-12">Loading...</div>
      ) : view === 'table' ? (
        <DataTable
          columns={columns}
          data={rows as unknown as Record<string, unknown>[]}
        />
      ) : (
        <TimeSeriesChart
          key="fxChart"
          data={chartData as Record<string, unknown>[]}
          valueFormatter={fmtPctChange}
          countries={chartCountries}
          selectedCode={null}
        />
      )}
    </div>
  );
}
