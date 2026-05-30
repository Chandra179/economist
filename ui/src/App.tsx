import { useState, useEffect, useMemo } from 'react';
import { countries } from './data/countries';
import { fetchExchangeRates, fetchHistoricalRates, fetchFredLatest, fetchFredBatchLatest, fetchFredHistory, fetchWorldBankDebt } from './data/api';
import CountryCard from './components/CountryCard';
import FxTable from './components/FxTable';
import GdpTable from './components/GdpTable';
import type { TimeSeriesPoint, GdpRecord } from './types';

type FreqInterval = 'day' | 'week' | 'month' | 'year';

function findClosestDate(map: Map<string, number>, targetDate: string): number | null {
  if (map.has(targetDate)) return map.get(targetDate)!;
  const target = new Date(targetDate).getTime();
  let closest: string | null = null;
  let minDiff = Infinity;
  for (const date of map.keys()) {
    const diff = Math.abs(new Date(date).getTime() - target);
    if (diff < minDiff) {
      minDiff = diff;
      closest = date;
    }
  }
  return closest ? map.get(closest) ?? null : null;
}

function aggregateToYear(data: TimeSeriesPoint[]): TimeSeriesPoint[] {
  const byYear = new Map<string, { sum: number; count: number }>();
  for (const { date, value } of data) {
    if (value === null) continue;
    const year = date.slice(0, 4);
    const entry = byYear.get(year) ?? { sum: 0, count: 0 };
    entry.sum += value;
    entry.count += 1;
    byYear.set(year, entry);
  }
  return [...byYear.entries()]
    .map(([year, { sum, count }]) => ({ date: year, value: sum / count }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

interface ChartPoint {
  date: string;
  usdcny: number | null;
  usdidr: number | null;
}



export default function App() {
  const [liveRates, setLiveRates] = useState<Map<string, number>>(new Map());
  const [fxLoading, setFxLoading] = useState(true);
  const [chartData, setChartData] = useState<ChartPoint[] | null>(null);
  const [fredData, setFredData] = useState<Record<string, number>>({});
  const [fredLoading, setFredLoading] = useState(true);
  const [selectedCurrencies, setSelectedCurrencies] = useState<'both' | 'CNY' | 'IDR'>('both');
  const [fxInterval, setFxInterval] = useState<FreqInterval>('month');
  const [dxyLatest, setDxyLatest] = useState<number | null>(null);
  const [gdpData, setGdpData] = useState<Map<string, GdpRecord[]> | null>(null);
  const [gdpLoading, setGdpLoading] = useState(true);
  const [debtData, setDebtData] = useState<Map<string, TimeSeriesPoint[]> | null>(null);

  const gdpCountries = useMemo(() => countries.filter((c) => c.fredGdpSeries), []);
  const debtCountries = useMemo(() => countries.filter((c) => c.fredDebtSeries), []);

  useEffect(() => {
    fetchExchangeRates(['CNY', 'IDR']).then((rates) => {
      setLiveRates(rates);
      setFxLoading(false);
    });
  }, []);

  useEffect(() => {
    fetchHistoricalRates(['CNY', 'IDR'], '1999-01-01', fxInterval).then((rateMap) => {
      const cnyData = rateMap.get('CNY') ?? [];
      const idrData = rateMap.get('IDR') ?? [];
      const cny = fxInterval === 'year' ? aggregateToYear(cnyData) : cnyData;
      const idr = fxInterval === 'year' ? aggregateToYear(idrData) : idrData;
      const cnyMap = new Map(cny.map((p) => [p.date, p.value!]));
      const idrMap = new Map(idr.map((p) => [p.date, p.value!]));
      const allDates = new Set([...cnyMap.keys(), ...idrMap.keys()]);
      const sorted = [...allDates].sort();

      const merged: ChartPoint[] = sorted.map((date) => ({
        date,
        usdcny: cnyMap.get(date) ?? null,
        usdidr: idrMap.get(date) ?? null,
      }));

      setChartData(merged);
    });
  }, [fxInterval]);

  useEffect(() => {
    if (gdpCountries.length === 0) return;

    const fxCurrencies = gdpCountries.filter((c) => c.code !== 'USD').map((c) => c.code);
    const fxHistoryPromise = fxCurrencies.length > 0
      ? fetchHistoricalRates(fxCurrencies, '1990-01-01', 'month')
      : Promise.resolve(new Map<string, TimeSeriesPoint[]>());

    fxHistoryPromise.then((fxHistoryMap) => {
      const fetches = gdpCountries.map(async (country) => {
        const gdpHistory = await fetchFredHistory(country.fredGdpSeries!, '1990-01-01', 'a');  // annual

        const fxHistory = country.code !== 'USD'
          ? (fxHistoryMap.get(country.code) ?? [])
          : [];

        const gdpMap = new Map(gdpHistory.filter((p) => p.value !== null).map((p) => [p.date, p.value!]));
        const fxMap = new Map(fxHistory.map((p) => [p.date, p.value!]));

      const yearMap = new Map<string, { sum: number; count: number }>();
      for (const [date, raw] of gdpMap) {
        const year = date.slice(0, 4);
        const fx = country.code === 'USD' ? 1 : findClosestDate(fxMap, date);
        if (fx === null) continue;
        const multiplier = country.gdpMultiplier ?? 1_000_000;
        const usd = (raw * multiplier) / fx;
        const entry = yearMap.get(year) ?? { sum: 0, count: 0 };
        entry.sum += usd;
        entry.count += 1;
        yearMap.set(year, entry);
      }

      const records = [...yearMap.entries()]
        .map(([year, entry]) => ({
          date: `${year}-01-01`,
          gdpUsd: entry.sum / entry.count,
        }))
        .sort((a, b) => a.date.localeCompare(b.date));

      return { code: country.code, records };
    });

        Promise.all(fetches).then((results) => {
          setGdpData(new Map(results.map((r) => [r.code, r.records])));
          setGdpLoading(false);
        });
    });
  }, [gdpCountries]);

  useEffect(() => {
    if (debtCountries.length === 0) return;

    const fetches = debtCountries.map(async (country) => {
      const history = country.debtSource === 'worldbank'
        ? await fetchWorldBankDebt(country.code)
        : await fetchFredHistory(country.fredDebtSeries!, '1990-01-01');
      return { code: country.code, records: history.filter((p) => p.value !== null) };
    });

    Promise.all(fetches).then((results) => {
      setDebtData(new Map(results.map((r) => [r.code, r.records])));
    });
  }, [debtCountries]);

  useEffect(() => {
    fetchFredLatest('DTWEXBGS').then(setDxyLatest);
  }, []);

  useEffect(() => {
    const seriesIds = new Set<string>();
    for (const c of countries) {
      if (c.fredRateSeries) seriesIds.add(c.fredRateSeries);
      if (c.fredReservesSeries) seriesIds.add(c.fredReservesSeries);
      if (c.fredGdpSeries) seriesIds.add(c.fredGdpSeries);
      if (c.fredDebtSeries && c.debtSource !== 'worldbank') seriesIds.add(c.fredDebtSeries);
    }

    fetchFredBatchLatest([...seriesIds]).then((results) => {
      const cleaned: Record<string, number> = {};
      for (const [id, v] of Object.entries(results)) {
        if (v !== null) cleaned[id] = v;
      }
      setFredData(cleaned);
      setFredLoading(false);
    });
  }, []);

  const handleFxInterval = (value: string) => setFxInterval(value as FreqInterval);

  return (
    <div className="max-w-[1200px] mx-auto px-6 py-8 flex flex-col gap-8">
      <header className="text-center">
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {countries.map((c) => (
          <CountryCard
            key={c.code}
            country={c}
            liveRate={liveRates.get(c.code) ?? null}
            fredData={fredData}
            fredLoading={fredLoading}
            loading={fxLoading && c.code !== 'USD'}
            dxyLatest={c.code === 'USD' ? dxyLatest : null}
          />
        ))}
      </div>

      <FxTable
        data={chartData}
        loading={chartData === null}
        selectedCurrencies={selectedCurrencies}
        onCurrencyChange={setSelectedCurrencies}
        interval={fxInterval}
        onIntervalChange={handleFxInterval}
      />

      <GdpTable
        gdpData={gdpData}
        gdpCountries={gdpCountries}
        debtData={debtData}
        debtCountries={debtCountries}
        loading={gdpLoading}
      />

      <footer className="text-center pt-2 border-t border-slate-200">
        <p className="text-[11px] text-slate-400">
          Exchange rates from Frankfurter API. Fed rate and reserves from FRED API.
        </p>
      </footer>
    </div>
  );
}
