import { useMemo } from 'react';
import { COUNTRY_COLORS } from '../config';
import TimeSeriesChart, { type LineConfig } from './TimeSeriesChart';
import type { CountryData, TimeSeriesPoint } from '../types';

interface Props {
  rateData: Map<string, TimeSeriesPoint[]> | null;
  rateCountries: CountryData[];
  cpiData: Map<string, TimeSeriesPoint[]> | null;
  cpiCountries: CountryData[];
  selectedCode: string | null;
}

function groupByYearAndAverage(
  data: Map<string, TimeSeriesPoint[]>,
  codes: string[],
) {
  const yearMap = new Map<string, Record<string, number[]>>();
  for (const code of codes) {
    const records = data.get(code) ?? [];
    for (const r of records) {
      if (r.value === null) continue;
      const year = r.date.slice(0, 4);
      if (!yearMap.has(year)) yearMap.set(year, {});
      const acc = yearMap.get(year)!;
      if (!acc[code]) acc[code] = [];
      acc[code].push(r.value);
    }
  }
  return [...yearMap.keys()]
    .sort((a, b) => Number(b) - Number(a))
    .map((year) => {
      const row: Record<string, number | string | null> = { date: year };
      const yearData = yearMap.get(year)!;
      for (const code of codes) {
        const values = yearData[code];
        row[code] = values?.length
          ? +(values.reduce((a, b) => a + b, 0) / values.length).toFixed(2)
          : null;
      }
      return row;
    });
}

export default function RateCpiChartPanel({ rateData, rateCountries, cpiData, cpiCountries, selectedCode }: Props) {
  const rateCountriesSafe = useMemo(() => rateCountries ?? [], [rateCountries]);
  const cpiCountriesSafe = useMemo(() => cpiCountries ?? [], [cpiCountries]);
  const hasRates = rateData !== null && rateCountriesSafe.length > 0;
  const hasCpi = cpiData !== null && cpiCountriesSafe.length > 0;

  const rateChartRows = useMemo(() => {
    if (!rateData || rateCountriesSafe.length === 0) return [];
    return groupByYearAndAverage(rateData, rateCountriesSafe.map((c) => c.code));
  }, [rateData, rateCountriesSafe]);

  const cpiChartRows = useMemo(() => {
    if (!cpiData || cpiCountriesSafe.length === 0) return [];
    return groupByYearAndAverage(cpiData, cpiCountriesSafe.map((c) => c.code));
  }, [cpiData, cpiCountriesSafe]);

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
      ...rateCountriesSafe.map((c) => c.code),
      ...cpiCountriesSafe.map((c) => c.code),
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
  }, [rateChartData, cpiChartData, rateCountriesSafe, cpiCountriesSafe]);

  const mergedLines = useMemo(() => {
    const allCodes = [...new Set([
      ...rateCountriesSafe.map((c) => c.code),
      ...cpiCountriesSafe.map((c) => c.code),
    ])];

    const lines: LineConfig[] = [];
    for (const [idx, code] of allCodes.entries()) {
      const all = [...rateCountriesSafe, ...cpiCountriesSafe];
      const country = all.find((c) => c.code === code);
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
  }, [rateCountriesSafe, cpiCountriesSafe, hasRates, hasCpi, selectedCode]);

  const title = hasRates && hasCpi
    ? 'Interest Rate & Inflation'
    : hasRates ? 'Interest Rate' : 'Inflation (CPI YoY)';

  return (
    <div className="bg-white border border-slate-100 rounded-lg p-3">
      <div className="text-xs text-slate-400 uppercase tracking-wide font-semibold mb-1">
        {title}
      </div>
      <TimeSeriesChart
        data={mergedChartRows as Record<string, unknown>[]}
        valueFormatter={(v: number) => v.toFixed(1) + '%'}
        lines={mergedLines}
        hideLegend
        groupByCountry
      />
    </div>
  );
}
