import { useState, useEffect, useMemo } from 'react';
import { fetchCountries, fetchExchangeRates, fetchHistoricalRates, fetchFredLatest, fetchFredBatchLatest, fetchFredHistory, fetchWorldBankDebt, fetchWorldBankPoverty, fetchGdpUsd } from './data/api';
import CountryCard from './components/CountryCard';
import FxTable from './components/FxTable';
import GdpTable from './components/GdpTable';


import type { CountryData, TimeSeriesPoint, GdpRecord, FxPoint, FreqInterval, CurrencyFilter } from './types';

export default function App() {
  const [countries, setCountries] = useState<CountryData[]>([]);
  const [liveRates, setLiveRates] = useState<Map<string, number>>(new Map());
  const [fxLoading, setFxLoading] = useState(true);
  const [chartData, setChartData] = useState<FxPoint[] | null>(null);
  const [fredData, setFredData] = useState<Record<string, number>>({});
  const [fredLoading, setFredLoading] = useState(true);
  const [selectedCurrencies, setSelectedCurrencies] = useState<CurrencyFilter>('both');
  const [fxInterval] = useState<FreqInterval>('year');
  const [dxyLatest, setDxyLatest] = useState<number | null>(null);
  const [gdpData, setGdpData] = useState<Map<string, GdpRecord[]> | null>(null);
  const [gdpLoading, setGdpLoading] = useState(true);
  const latestGdpUsd = useMemo(() => {
    if (!gdpData) return new Map<string, number>();
    const map = new Map<string, number>();
    for (const [code, records] of gdpData) {
      if (records.length > 0) {
        map.set(code, records[records.length - 1].gdpUsd);
      }
    }
    return map;
  }, [gdpData]);
  const [debtData, setDebtData] = useState<Map<string, TimeSeriesPoint[]> | null>(null);
  const [rateHistoryData, setRateHistoryData] = useState<Map<string, TimeSeriesPoint[]> | null>(null);
  const [cpiData, setCpiData] = useState<Map<string, TimeSeriesPoint[]> | null>(null);
  const [povertyData, setPovertyData] = useState<Record<string, number>>({});

  const inflationData = useMemo(() => {
    if (!cpiData) return null;
    const result = new Map<string, TimeSeriesPoint[]>();
    for (const [code, points] of cpiData) {
      const sorted = [...points].sort((a, b) => a.date.localeCompare(b.date));
      const inflation: TimeSeriesPoint[] = [];
      for (let i = 12; i < sorted.length; i++) {
        const cur = sorted[i];
        const prev = sorted[i - 12];
        const curM = cur.date.slice(0, 7);
        if (prev.value && cur.value) {
          const yoy = (cur.value - prev.value) / prev.value * 100;
          inflation.push({ date: curM, value: Math.round(yoy * 100) / 100 });
        }
      }
      result.set(code, inflation);
    }
    return result;
  }, [cpiData]);

  const latestInflation = useMemo(() => {
    if (!inflationData) return {};
    const map: Record<string, number> = {};
    for (const [code, points] of inflationData) {
      const sorted = [...points].sort((a, b) => b.date.localeCompare(a.date));
      const latest = sorted.find((p) => p.value !== null);
      if (latest && latest.value !== null) map[code] = latest.value;
    }
    return map;
  }, [inflationData]);

  const gdpCountries = useMemo(() => countries.filter((c) => c.fredGdpSeries), [countries]);
  const debtCountries = useMemo(() => countries.filter((c) => c.fredDebtSeries), [countries]);
  const rateCountries = useMemo(() => countries.filter((c) => c.fredRateSeries), [countries]);
  const cpiCountries = useMemo(() => countries.filter((c) => c.fredCpiSeries), [countries]);

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

      const merged: FxPoint[] = sorted.map((date) => ({
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
    if (rateCountries.length === 0) return;

    const fetches = rateCountries.map(async (country) => {
      const history = await fetchFredHistory(country.fredRateSeries!, '1990-01-01');
      return { code: country.code, records: history.filter((p) => p.value !== null) };
    });

    Promise.all(fetches).then((results) => {
      setRateHistoryData(new Map(results.map((r) => [r.code, r.records])));
    });
  }, [rateCountries]);

  useEffect(() => {
    if (cpiCountries.length === 0) return;

    const fetches = cpiCountries.map(async (country) => {
      const history = await fetchFredHistory(country.fredCpiSeries!, '1990-01-01');
      return { code: country.code, records: history.filter((p) => p.value !== null) as TimeSeriesPoint[] };
    });

    Promise.all(fetches).then((results) => {
      setCpiData(new Map(results.map((r) => [r.code, r.records])));
    });
  }, [cpiCountries]);

  useEffect(() => {
    fetchFredLatest('DTWEXBGS').then(setDxyLatest);
  }, []);

  useEffect(() => {
    if (countries.length === 0) return;
    Promise.all(countries.map(async (c) => {
      const value = await fetchWorldBankPoverty(c.code);
      return { code: c.code, value };
    })).then((results) => {
      const map: Record<string, number> = {};
      for (const r of results) {
        if (r.value !== null) map[r.code] = r.value;
      }
      setPovertyData(map);
    });
  }, [countries]);

  useEffect(() => {
    if (countries.length === 0) return;
    const seriesIds = new Set<string>();
    for (const c of countries) {
      if (c.fredRateSeries) seriesIds.add(c.fredRateSeries);
      if (c.fredReservesSeries) seriesIds.add(c.fredReservesSeries);
      if (c.fredGdpSeries) seriesIds.add(c.fredGdpSeries);
      if (c.fredDebtSeries && c.debtSource !== 'worldbank') seriesIds.add(c.fredDebtSeries);
      if (c.fredCpiSeries) seriesIds.add(c.fredCpiSeries);
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
              latestGdpUsd={latestGdpUsd.get(c.code) ?? null}
              povertyValue={povertyData[c.code] ?? null}
              latestInflation={latestInflation[c.code] ?? null}
            />
        ))}
      </div>

      <FxTable
        data={chartData}
        loading={chartData === null}
        selectedCurrencies={selectedCurrencies}
        onCurrencyChange={setSelectedCurrencies}
      />

      <GdpTable
        gdpData={gdpData}
        gdpCountries={gdpCountries}
        debtData={debtData}
        debtCountries={debtCountries}
        rateData={rateHistoryData}
        rateCountries={rateCountries}
        cpiData={inflationData}
        cpiCountries={cpiCountries}
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
