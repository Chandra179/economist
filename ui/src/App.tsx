import { useState, useEffect } from 'react';
import { countries } from './data/countries';
import { fetchExchangeRates, fetchHistoricalRates, fetchFredLatest } from './data/api';
import CountryCard from './components/CountryCard';
import TrendChart from './components/TrendChart';

type RangeKey = '1Y' | '5Y' | '10Y' | 'MAX';

const rangeConfig: Record<RangeKey, { label: string; yearsBack: number | null; group: 'day' | 'week' | 'month' }> = {
  '1Y': { label: '1 Year', yearsBack: 1, group: 'day' },
  '5Y': { label: '5 Years', yearsBack: 5, group: 'week' },
  '10Y': { label: '10 Years', yearsBack: 10, group: 'month' },
  'MAX': { label: 'All (since 1948)', yearsBack: null, group: 'month' },
};

function dateAgo(years: number): string {
  const d = new Date();
  d.setFullYear(d.getFullYear() - years);
  return d.toISOString().split('T')[0];
}

interface ChartPoint {
  date: string;
  usdcny: number | null;
  usdidr: number | null;
}

export default function App() {
  const [liveRates, setLiveRates] = useState<Map<string, number>>(new Map());
  const [fxLoading, setFxLoading] = useState(true);
  const [chartData, setChartData] = useState<ChartPoint[]>([]);
  const [chartLoading, setChartLoading] = useState(true);
  const [fredData, setFredData] = useState<Record<string, number>>({});
  const [fredLoading, setFredLoading] = useState(true);
  const [range, setRange] = useState<RangeKey>('10Y');
  const [selectedCurrencies, setSelectedCurrencies] = useState<'both' | 'CNY' | 'IDR'>('both');

  useEffect(() => {
    fetchExchangeRates(['CNY', 'IDR']).then((rates) => {
      setLiveRates(rates);
      setFxLoading(false);
    });
  }, []);

  useEffect(() => {
    const cfg = rangeConfig[range];
    const fromDate = cfg.yearsBack !== null ? dateAgo(cfg.yearsBack) : '1948-01-01';

    setChartLoading(true);
    Promise.all([
      fetchHistoricalRates('CNY', fromDate, cfg.group),
      fetchHistoricalRates('IDR', fromDate, cfg.group),
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
      setChartLoading(false);
    });
  }, [range]);

  useEffect(() => {
    const seriesIds = new Set<string>();
    for (const c of countries) {
      if (c.fredRateSeries) seriesIds.add(c.fredRateSeries);
      if (c.fredReservesSeries) seriesIds.add(c.fredReservesSeries);
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

      <TrendChart
        data={chartData}
        loading={chartLoading}
        range={range}
        onRangeChange={setRange}
        rangeConfig={rangeConfig}
        selectedCurrencies={selectedCurrencies}
        onCurrencyChange={setSelectedCurrencies}
      />

      <footer className="text-center pt-2 border-t border-slate-200">
        <p className="text-[11px] text-slate-400">
          Exchange rates from Frankfurter API. Fed rate and reserves from FRED API.
        </p>
      </footer>
    </div>
  );
}
