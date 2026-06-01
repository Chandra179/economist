import { useMemo } from 'react';
import TimeSeriesChart from './TimeSeriesChart';
import { NULL_PLACEHOLDER } from '../config';
import type { CountryData, TimeSeriesPoint } from '../types';

interface Props {
  debtData: Map<string, TimeSeriesPoint[]> | null;
  debtCountries: CountryData[];
  selectedCode: string | null;
}

function fmtPct(v: unknown): string {
  if (v === null || v === undefined) return NULL_PLACEHOLDER;
  return (v as number).toFixed(1) + '%';
}

export default function DebtChartPanel({ debtData, debtCountries, selectedCode }: Props) {
  const chartRows = useMemo(() => {
    if (!debtData || debtCountries.length === 0) return [];

    const dates = new Set<string>();
    for (const records of debtData.values()) {
      for (const r of records) dates.add(r.date);
    }

    return [...dates].sort().reverse().map((date) => {
      const row: Record<string, string | number | null> = { date };
      for (const c of debtCountries) {
        const records = debtData.get(c.code) ?? [];
        row[c.code] = records.find((r) => r.date === date)?.value ?? null;
      }
      return row;
    });
  }, [debtData, debtCountries]);

  return (
    <div className="bg-white border border-slate-100 rounded-lg p-3">
      <div className="text-xs text-slate-400 uppercase tracking-wide font-semibold mb-1">
        Debt/GDP Trend
      </div>
      <TimeSeriesChart
        data={chartRows}
        valueFormatter={(v: number) => fmtPct(v)}
        countries={debtCountries}
        selectedCode={selectedCode}
        referenceLines={[{ value: 100, label: '100%' }]}
        hideLegend
      />
    </div>
  );
}
