import { useState, useEffect } from 'react';
import { fetchFredLatest, fetchFredHistory } from '../data/api';
import IntervalSelector from './IntervalSelector';
import DataTable from './DataTable';

type FreqInterval = 'day' | 'week' | 'month';

const FRED_FREQ: Record<FreqInterval, string | undefined> = {
  day: undefined,
  week: 'w',
  month: 'm',
};

const INTERVAL_LABELS: Record<FreqInterval, string> = {
  day: 'Day',
  week: 'Week',
  month: 'Month',
};

function fmtDxy(v: unknown): string {
  if (v === null || v === undefined) return '\u2014';
  return (v as number).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function fmtPct(v: unknown): string {
  if (v === null || v === undefined) return '\u2014';
  return (v as number).toFixed(1) + '%';
}

export default function DollarPanel() {
  const [dxyLatest, setDxyLatest] = useState<number | null>(null);
  const [dxyHistory, setDxyHistory] = useState<Array<{ date: string; value: number | null }> | null>(null);
  const [debtGdpLatest, setDebtGdpLatest] = useState<number | null>(null);
  const [debtGdpHistory, setDebtGdpHistory] = useState<Array<{ date: string; value: number | null }> | null>(null);
  const [dxyInterval, setDxyInterval] = useState<FreqInterval>('month');

  useEffect(() => {
    fetchFredLatest('DTWEXBGS').then(setDxyLatest);
  }, []);

  useEffect(() => {
    fetchFredHistory('DTWEXBGS', '2006-01-01', FRED_FREQ[dxyInterval]).then(setDxyHistory);
  }, [dxyInterval]);

  useEffect(() => {
    Promise.all([
      fetchFredLatest('GFDGDPA188S'),
      fetchFredHistory('GFDGDPA188S', '1900-01-01'),
    ]).then(([latest, history]) => {
      setDebtGdpLatest(latest);
      setDebtGdpHistory(history);
    });
  }, []);

  const handleIntervalChange = (value: string) => {
    setDxyInterval(value as FreqInterval);
  };

  const dxyRows = (dxyHistory ?? []).map((p) => ({ date: p.date, value: p.value }));
  const debtRows = (debtGdpHistory ?? []).map((p) => ({ date: p.date, value: p.value }));

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
          <IntervalSelector
            intervals={(['day', 'week', 'month'] as FreqInterval[]).map((i) => ({ value: i, label: INTERVAL_LABELS[i] }))}
            value={dxyInterval}
            onChange={handleIntervalChange}
          />
        </div>

        {dxyHistory === null ? (
          <div className="flex items-center justify-center text-slate-400 text-sm py-8">Loading...</div>
        ) : (
          <DataTable
            columns={[
              { key: 'date', header: 'Date' },
              { key: 'value', header: 'DXY', format: fmtDxy },
            ]}
            data={dxyRows as unknown as Record<string, unknown>[]}
          />
        )}
      </div>

      <div>
        <h5 className="text-xs text-slate-400 uppercase tracking-wide font-semibold mb-3">
          US Debt / GDP
        </h5>

        {debtGdpHistory === null ? (
          <div className="flex items-center justify-center text-slate-400 text-sm py-8">Loading...</div>
        ) : (
          <DataTable
            columns={[
              { key: 'date', header: 'Year', format: (v: unknown) => String(v).replace(/-01-01$/, '') },
              { key: 'value', header: 'Debt/GDP', format: fmtPct },
            ]}
            data={debtRows as unknown as Record<string, unknown>[]}
          />
        )}
      </div>
    </div>
  );
}
