import { useState, useEffect } from 'react';
import { countries } from './data/countries';
import { fetchExchangeRates, fetchHistoricalRates, fetchFredLatest, fetchFredHistory } from './data/api';
import CountryCard from './components/CountryCard';
import DollarPanel from './components/DollarPanel';
import FxTable from './components/FxTable';
import GdpTable from './components/GdpTable';

type FreqInterval = 'day' | 'week' | 'month';
type GdpInterval = 'quarter' | 'year';

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

interface ChartPoint {
  date: string;
  usdcny: number | null;
  usdidr: number | null;
}

interface GdpPoint {
  date: string;
  cnyGdp: number | null;
  idrGdp: number | null;
}

export default function App() {
  const [liveRates, setLiveRates] = useState<Map<string, number>>(new Map());
  const [fxLoading, setFxLoading] = useState(true);
  const [chartData, setChartData] = useState<ChartPoint[] | null>(null);
  const [fredData, setFredData] = useState<Record<string, number>>({});
  const [fredLoading, setFredLoading] = useState(true);
  const [selectedCurrencies, setSelectedCurrencies] = useState<'both' | 'CNY' | 'IDR'>('both');
  const [fxInterval, setFxInterval] = useState<FreqInterval>('month');
  const [gdpChartData, setGdpChartData] = useState<GdpPoint[] | null>(null);
  const [gdpCurrency, setGdpCurrency] = useState<'both' | 'CNY' | 'IDR'>('both');
  const [gdpInterval, setGdpInterval] = useState<GdpInterval>('year');

  useEffect(() => {
    fetchExchangeRates(['CNY', 'IDR']).then((rates) => {
      setLiveRates(rates);
      setFxLoading(false);
    });
  }, []);

  useEffect(() => {
    Promise.all([
      fetchHistoricalRates('CNY', '1999-01-01', fxInterval),
      fetchHistoricalRates('IDR', '1999-01-01', fxInterval),
    ]).then(([cnyData, idrData]) => {
      const cnyMap = new Map(cnyData.map((p) => [p.date, p.rate]));
      const idrMap = new Map(idrData.map((p) => [p.date, p.rate]));
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
    const cnyGdpSeries = countries.find((c) => c.code === 'CNY')?.fredGdpSeries;
    const idrGdpSeries = countries.find((c) => c.code === 'IDR')?.fredGdpSeries;
    if (!cnyGdpSeries || !idrGdpSeries) return;

    Promise.all([
      fetchFredHistory(cnyGdpSeries, '1990-01-01'),
      fetchFredHistory(idrGdpSeries, '1990-01-01'),
      fetchHistoricalRates('CNY', '1990-01-01', 'month'),
      fetchHistoricalRates('IDR', '1990-01-01', 'month'),
    ]).then(([cnyHistory, idrHistory, cnyRates, idrRates]) => {
      const cnyGdpMap = new Map(cnyHistory.filter((p) => p.value !== null).map((p) => [p.date, p.value!]));
      const idrGdpMap = new Map(idrHistory.filter((p) => p.value !== null).map((p) => [p.date, p.value!]));
      const cnyFxMap = new Map(cnyRates.map((p) => [p.date, p.rate]));
      const idrFxMap = new Map(idrRates.map((p) => [p.date, p.rate]));
      const allDates = new Set([...cnyGdpMap.keys(), ...idrGdpMap.keys()]);
      const sorted = [...allDates].sort();

      const merged: GdpPoint[] = [];
      let lastCny: number | null = null;

      for (const date of sorted) {
        const cnyRaw = cnyGdpMap.get(date) ?? null;
        const idrRaw = idrGdpMap.get(date) ?? null;

        if (cnyRaw !== null) lastCny = cnyRaw;

        let cnyGdp: number | null = null;
        let idrGdp: number | null = null;

        if (lastCny !== null) {
          const fx = findClosestDate(cnyFxMap, date);
          if (fx !== null) cnyGdp = (lastCny * 1_000_000) / fx;
        }
        if (idrRaw !== null) {
          const fx = findClosestDate(idrFxMap, date);
          if (fx !== null) idrGdp = (idrRaw * 1_000_000) / fx;
        }

        merged.push({ date, cnyGdp, idrGdp });
      }

      if (gdpInterval === 'year') {
        const yearMap = new Map<string, { cnyGdp: number | null; idrSum: number; idrCount: number }>();
        for (const point of merged) {
          const year = point.date.slice(0, 4);
          const entry = yearMap.get(year) ?? { cnyGdp: null, idrSum: 0, idrCount: 0 };
          if (point.cnyGdp !== null) entry.cnyGdp = point.cnyGdp;
          if (point.idrGdp !== null) {
            entry.idrSum += point.idrGdp;
            entry.idrCount++;
          }
          yearMap.set(year, entry);
        }
        const annual = [...yearMap.entries()]
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([year, entry]) => ({
            date: `${year}-01-01`,
            cnyGdp: entry.cnyGdp,
            idrGdp: entry.idrCount >= 3 ? entry.idrSum : null,
          }));
        setGdpChartData(annual);
      } else {
        setGdpChartData(merged);
      }
    });
  }, [gdpInterval]);

  useEffect(() => {
    const seriesIds = new Set<string>();
    for (const c of countries) {
      if (c.fredRateSeries) seriesIds.add(c.fredRateSeries);
      if (c.fredReservesSeries) seriesIds.add(c.fredReservesSeries);
      if (c.fredGdpSeries) seriesIds.add(c.fredGdpSeries);
      if (c.fredDebtSeries) seriesIds.add(c.fredDebtSeries);
    }

    const results: Record<string, number> = {};

    Promise.allSettled(
      [...seriesIds].map(async (id) => {
        const value = await fetchFredLatest(id);
        if (value !== null) results[id] = value;
      }),
    ).then(() => {
      setFredData(results);
      setFredLoading(false);
    });
  }, []);

  const handleFxInterval = (value: string) => setFxInterval(value as FreqInterval);
  const handleGdpInterval = (value: string) => setGdpInterval(value as GdpInterval);

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
          />
        ))}
      </div>

      <DollarPanel />

      <FxTable
        data={chartData}
        loading={chartData === null}
        selectedCurrencies={selectedCurrencies}
        onCurrencyChange={setSelectedCurrencies}
        interval={fxInterval}
        onIntervalChange={handleFxInterval}
      />

      <GdpTable
        data={gdpChartData}
        loading={gdpChartData === null}
        selectedCurrencies={gdpCurrency}
        onCurrencyChange={setGdpCurrency}
        interval={gdpInterval}
        onIntervalChange={handleGdpInterval}
      />

      <footer className="text-center pt-2 border-t border-slate-200">
        <p className="text-[11px] text-slate-400">
          Exchange rates from Frankfurter API. Fed rate and reserves from FRED API.
        </p>
      </footer>
    </div>
  );
}
