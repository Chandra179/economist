import { useState, useEffect, useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  ReferenceLine, Cell,
} from 'recharts';
import { fetchFredHistory } from '../data/api';
import DataTable from './DataTable';
import type { TimeSeriesPoint } from '../types';

function fmtBalance(value: number): string {
  const abs = Math.abs(value);
  const sign = value >= 0 ? '' : '-';
  return sign + '$' + abs.toFixed(1) + 'B';
}

export default function TradeBalance() {
  const [data, setData] = useState<TimeSeriesPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'chart' | 'table'>('chart');

  useEffect(() => {
    fetchFredHistory('BOPGSTB', '1990-01-01', 'a').then((points) => {
      setData(points.filter((p) => p.value !== null));
      setLoading(false);
    });
  }, []);

  const chartData = useMemo(() =>
    data.map((p) => ({
      date: p.date.slice(0, 4),
      balance: p.value!,
    })),
    [data]
  );

  const tableData = useMemo(() =>
    [...chartData].reverse().map((p) => ({
      year: p.date,
      balance: p.balance,
    })),
    [chartData]
  );

  const columns = [
    { key: 'year', header: 'Year' },
    {
      key: 'balance',
      header: 'Trade Balance',
      format: (v: unknown) => {
        const n = v as number;
        return <span className={n >= 0 ? 'text-green-600' : 'text-red-600'}>{fmtBalance(n)}</span>;
      },
    },
  ];

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-xs text-slate-400 uppercase tracking-wide font-semibold flex items-center gap-1">
          US Trade Balance
          <span className="relative group flex items-center">
            <span className="text-slate-300 cursor-help text-[9px] leading-none w-3.5 h-3.5 rounded-full border border-slate-300 inline-flex items-center justify-center">i</span>
            <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 w-52 p-1.5 text-[10px] leading-tight text-white bg-slate-800 rounded shadow-lg opacity-0 group-hover:opacity-100 transition pointer-events-none z-10 text-center">
              US net exports (goods + services). Green = surplus, red = deficit. In billions of current dollars.
            </span>
          </span>
        </h4>
        <div className="flex gap-1">
          {(['chart', 'table'] as const).map((v) => (
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
      </div>

      {loading ? (
        <div className="flex items-center justify-center text-slate-400 text-sm py-12">Loading...</div>
      ) : view === 'table' ? (
        <DataTable
          columns={columns}
          data={tableData as unknown as Record<string, unknown>[]}
        />
      ) : (
        <div className="py-4">
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="date" tick={{ fontSize: 11, fontFamily: 'monospace' }} stroke="#94a3b8" interval={5} />
              <YAxis
                tickFormatter={fmtBalance}
                tick={{ fontSize: 11, fontFamily: 'monospace' }}
                stroke="#94a3b8"
              />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (!active || !payload?.length) return null;
                  const value = payload[0]?.value as number;
                  return (
                    <div className="bg-white border border-slate-200 rounded-lg p-3 text-xs shadow-lg">
                      <div className="font-semibold text-slate-700 mb-1.5">{label}</div>
                      <div className="flex items-center gap-2 text-slate-600">
                        <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: value >= 0 ? '#16a34a' : '#ef4444' }} />
                        <span>Trade Balance:</span>
                        <span className="font-semibold text-slate-800">{fmtBalance(value)}</span>
                      </div>
                    </div>
                  );
                }}
              />
              <ReferenceLine y={0} stroke="#94a3b8" />
              <Bar dataKey="balance" maxBarSize={20}>
                {chartData.map((entry, i) => (
                  <Cell key={`cell-${i}`} fill={entry.balance >= 0 ? '#16a34a' : '#ef4444'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
