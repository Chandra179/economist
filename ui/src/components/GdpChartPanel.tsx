import { useMemo } from 'react';
import TimeSeriesChart from './TimeSeriesChart';
import { NULL_PLACEHOLDER } from '../config';
import type { CountryData, GdpRecord } from '../types';

interface Props {
  gdpData: Map<string, GdpRecord[]> | null;
  gdpCountries: CountryData[];
  selectedCode: string | null;
}

function fmtUsd(v: unknown): string {
  if (v === null || v === undefined) return NULL_PLACEHOLDER;
  const n = v as number;
  if (n >= 1e12) return '$' + (n / 1e12).toFixed(1) + 'T';
  if (n >= 1e9) return '$' + (n / 1e9).toFixed(1) + 'B';
  return '$' + (n / 1e6).toFixed(0) + 'M';
}

export default function GdpChartPanel({ gdpData, gdpCountries, selectedCode }: Props) {
  const chartRows = useMemo(() => {
    if (!gdpData || gdpCountries.length === 0) return [];

    const dates = new Set<string>();
    for (const records of gdpData.values()) {
      for (const r of records) dates.add(r.date);
    }

    return [...dates].sort().reverse().map((date) => {
      const row: Record<string, number | string | null> = { date };
      for (const c of gdpCountries) {
        const records = gdpData.get(c.code) ?? [];
        const rec = records.find((r) => r.date === date);
        row[c.code] = rec?.gdpUsd ?? null;
      }
      return row;
    });
  }, [gdpData, gdpCountries]);

  return (
    <div className="bg-white border border-slate-100 rounded-lg p-3">
      <div className="text-xs text-slate-400 uppercase tracking-wide font-semibold mb-1">
        GDP in USD
      </div>
      <TimeSeriesChart
        data={chartRows}
        valueFormatter={(v: number) => fmtUsd(v)}
        countries={gdpCountries}
        selectedCode={selectedCode}
        hideLegend
      />
    </div>
  );
}
