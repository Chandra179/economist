import { useState, useEffect } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';
import { fetchFredLatest, fetchFredHistory } from '../data/api';

type RangeKey = '1Y' | '5Y' | '10Y' | 'MAX';

interface TooltipItem {
  name: string;
  value: number | null;
  color: string;
}

const rangeConfig: Record<RangeKey, { label: string; yearsBack: number | null }> = {
  '1Y': { label: '1 Year', yearsBack: 1 },
  '5Y': { label: '5 Years', yearsBack: 5 },
  '10Y': { label: '10 Years', yearsBack: 10 },
  'MAX': { label: 'All (since 2006)', yearsBack: null },
};

function dateAgo(years: number): string {
  const d = new Date();
  d.setFullYear(d.getFullYear() - years);
  return d.toISOString().split('T')[0];
}

const rangeLabels: Record<RangeKey, string> = {
  '1Y': '1Y',
  '5Y': '5Y',
  '10Y': '10Y',
  'MAX': 'MAX',
};

function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: TooltipItem[];
  label?: string;
}) {
  if (!active || !payload || !payload.length) return null;
  return (
    <div className="bg-white border border-slate-200 rounded-md px-3 py-2 text-xs font-mono shadow-sm">
      <p className="text-slate-900 font-semibold mb-1">{label}</p>
      {payload.map((p) =>
        p.value !== null ? (
          <p key={p.name} style={{ color: p.color }}>
            {p.name}:{' '}
            {typeof p.value === 'number'
              ? p.value.toLocaleString(undefined, { maximumFractionDigits: 2 })
              : p.value}
            {p.name.includes('Debt') ? '%' : ''}
          </p>
        ) : null,
      )}
    </div>
  );
}

function formatDate(dateStr: string, range: RangeKey): string {
  const parts = dateStr.split('-');
  if (range === 'MAX' || range === '10Y') return parts[0];
  if (range === '5Y') return `${parts[0]}-${parts[1]}`;
  return `${parts[1]}/${parts[2]}`;
}

export default function DollarPanel() {
  const [dxyLatest, setDxyLatest] = useState<number | null>(null);
  const [dxyHistory, setDxyHistory] = useState<Array<{ date: string; value: number | null }> | null>(null);
  const [debtGdpLatest, setDebtGdpLatest] = useState<number | null>(null);
  const [debtGdpHistory, setDebtGdpHistory] = useState<Array<{ date: string; value: number | null }> | null>(null);
  const [range, setRange] = useState<RangeKey>('10Y');

  useEffect(() => {
    fetchFredLatest('DTWEXBGS').then(setDxyLatest);
  }, []);

  useEffect(() => {
    const cfg = rangeConfig[range];
    const fromDate = cfg.yearsBack !== null ? dateAgo(cfg.yearsBack) : '2006-01-01';

    fetchFredHistory('DTWEXBGS', fromDate).then(setDxyHistory);
  }, [range]);

  useEffect(() => {
    Promise.all([
      fetchFredLatest('GFDGDPA188S'),
      fetchFredHistory('GFDGDPA188S', '1900-01-01'),
    ]).then(([latest, history]) => {
      setDebtGdpLatest(latest);
      setDebtGdpHistory(history);
    });
  }, []);

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-6 flex flex-col gap-4">
      <h4 className="text-xs text-slate-400 uppercase tracking-wide font-semibold">Dollar System</h4>

      <div className="grid grid-cols-2 gap-3">
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 text-center">
          <span className="flex items-center justify-center gap-1 text-[11px] text-slate-400 uppercase tracking-wide mb-1">
            Dollar Index (DXY)
            <span className="relative group flex items-center">
              <span className="text-slate-300 cursor-help text-[9px] leading-none w-3.5 h-3.5 rounded-full border border-slate-300 inline-flex items-center justify-center">i</span>
              <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 w-52 p-1.5 text-[10px] leading-tight text-white bg-slate-800 rounded shadow-lg opacity-0 group-hover:opacity-100 transition pointer-events-none z-10 text-center">
                A strength score for the dollar against other currencies. 2006 = 100. Above 100 means stronger; below 100 means weaker.
              </span>
            </span>
          </span>
          <span className="text-2xl font-bold text-slate-700 font-mono">
            {dxyLatest !== null
              ? dxyLatest.toLocaleString(undefined, { maximumFractionDigits: 2 })
              : '\u2014'}
            <span className="text-sm text-slate-400 font-normal"> pts</span>
          </span>
        </div>

        <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 text-center">
          <span className="flex items-center justify-center gap-1 text-[11px] text-slate-400 uppercase tracking-wide mb-1">
            US Debt / GDP
            <span className="relative group flex items-center">
              <span className="text-slate-300 cursor-help text-[9px] leading-none w-3.5 h-3.5 rounded-full border border-slate-300 inline-flex items-center justify-center">i</span>
              <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 w-52 p-1.5 text-[10px] leading-tight text-white bg-slate-800 rounded shadow-lg opacity-0 group-hover:opacity-100 transition pointer-events-none z-10 text-center">
                National debt divided by a year of economic output. 100% means debt equals one year of GDP. Below 50% was normal before 2000; above 100% means high.
              </span>
            </span>
          </span>
          <span className="text-2xl font-bold text-amber-600 font-mono">
            {debtGdpLatest !== null
              ? `${debtGdpLatest.toFixed(1)}%`
              : '\u2014'}
          </span>
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-3">
          <h5 className="text-xs text-slate-400 uppercase tracking-wide font-semibold">DXY Historical</h5>
          <div className="flex gap-1">
            {(Object.keys(rangeConfig) as RangeKey[]).map((key) => (
              <button
                key={key}
                onClick={() => setRange(key)}
                className={`px-3 py-1 text-xs font-semibold font-mono rounded-md border transition cursor-pointer
                  ${range === key
                    ? 'bg-orange-600 text-white border-orange-600'
                    : 'bg-slate-50 text-slate-400 border-slate-200 hover:border-orange-600 hover:text-orange-600'
                  }`}
              >
                {rangeLabels[key]}
              </button>
            ))}
          </div>
        </div>

        {dxyHistory === null ? (
          <div className="h-[240px] flex items-center justify-center text-slate-400 text-sm">
            Loading...
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={dxyHistory}>
              <CartesianGrid strokeDasharray="3 3" stroke="#cbd5e1" />
              <XAxis
                dataKey="date"
                stroke="#94a3b8"
                tick={{ fontSize: 11 }}
                tickFormatter={(d: string) => formatDate(d, range)}
              />
              <YAxis
                stroke="#94a3b8"
                tick={{ fontSize: 11 }}
                domain={['auto', 'auto']}
              />
              <Tooltip content={<CustomTooltip />} />
              <Line
                type="monotone"
                dataKey="value"
                name="DXY"
                stroke="#334155"
                strokeWidth={2}
                dot={false}
                connectNulls
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      <div>
        <h5 className="text-xs text-slate-400 uppercase tracking-wide font-semibold mb-3">
          US Debt / GDP
        </h5>

        {debtGdpHistory === null ? (
          <div className="h-[160px] flex items-center justify-center text-slate-400 text-sm">
            Loading...
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={160}>
            <LineChart data={debtGdpHistory}>
              <CartesianGrid strokeDasharray="3 3" stroke="#cbd5e1" />
              <XAxis
                dataKey="date"
                stroke="#94a3b8"
                tick={{ fontSize: 11 }}
                tickFormatter={(d: string) => d.split('-')[0]}
              />
              <YAxis
                stroke="#94a3b8"
                tick={{ fontSize: 11 }}
                domain={['auto', 'auto']}
                tickFormatter={(v: number) => `${v}%`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Line
                type="monotone"
                dataKey="value"
                name="Debt/GDP"
                stroke="#d97706"
                strokeWidth={2}
                dot={false}
                connectNulls
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
