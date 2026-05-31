import { useState, useEffect, useMemo } from 'react';
import { fetchCountries, fetchExchangeRates, fetchHistoricalRates, fetchFredLatest, fetchFredBatchLatest, fetchFredHistory, fetchWorldBankDebt, fetchGdpUsd } from './data/api';
import CountryCard from './components/CountryCard';
import FxTable from './components/FxTable';
import GdpTable from './components/GdpTable';
import type { CountryData, TimeSeriesPoint, GdpRecord } from './types';

type FreqInterval = 'day' | 'week' | 'month' | 'year';

interface ChartPoint {
  date: string;
  usdcny: number | null;
  usdidr: number | null;
}

export default function App() {
  const [countries, setCountries] = useState<CountryData[]>([]);
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

  const gdpCountries = useMemo(() => countries.filter((c) => c.fredGdpSeries), [countries]);
  const debtCountries = useMemo(() => countries.filter((c) => c.fredDebtSeries), [countries]);

  useEffect(() => {
    fetchCountries().then(setCountries);
  }, []);

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
      const cnyMap = new Map(cnyData.map((p) => [p.date, p.value!]));
      const idrMap = new Map(idrData.map((p) => [p.date, p.value!]));
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
    const codes = gdpCountries.map((c) => c.code);
    fetchGdpUsd(codes, '1976-01-01').then((data) => {
      setGdpData(data);
      setGdpLoading(false);
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
    if (countries.length === 0) return;
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
  }, [countries]);

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
