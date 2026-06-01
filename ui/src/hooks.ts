import { useState, useEffect, useMemo } from 'react';
import type { CountryData, FxPoint, GdpRecord, TimeSeriesPoint } from './types';
import {
  fetchCountries,
  fetchExchangeRates,
  fetchHistoricalRates,
  fetchFredLatest,
  fetchFredBatchLatest,
  fetchFredHistory,
  fetchWorldBankDebt,
  fetchGdpUsd,
} from './data/api';

export function useCountries() {
  const [data, setData] = useState<CountryData[]>([]);
  useEffect(() => { fetchCountries().then(setData); }, []);
  return data;
}

export function useLiveRates(currencies: string[]) {
  const [data, setData] = useState<Map<string, number>>(new Map());
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    fetchExchangeRates(currencies).then((rates) => {
      setData(rates);
      setLoading(false);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return { data, loading };
}

export function useFxHistory(from: string) {
  const [data, setData] = useState<FxPoint[] | null>(null);
  useEffect(() => {
    fetchHistoricalRates(['CNY', 'IDR'], from, 'year').then((rateMap) => {
      const cnyData = rateMap.get('CNY') ?? [];
      const idrData = rateMap.get('IDR') ?? [];
      const cnyMap = new Map(cnyData.map((p) => [p.date, p.value!]));
      const idrMap = new Map(idrData.map((p) => [p.date, p.value!]));
      const allDates = [...new Set([...cnyMap.keys(), ...idrMap.keys()])].sort();

      const merged: FxPoint[] = allDates.map((date) => ({
        date,
        usdcny: cnyMap.get(date) ?? null,
        usdidr: idrMap.get(date) ?? null,
      }));
      setData(merged);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return data;
}

export function useDxyLatest() {
  const [data, setData] = useState<number | null>(null);
  useEffect(() => { fetchFredLatest('DTWEXBGS').then(setData); }, []);
  return data;
}

function getFredSeriesIds(countries: CountryData[]): string[] {
  const ids = new Set<string>();
  for (const c of countries) {
    if (c.fredRateSeries) ids.add(c.fredRateSeries);
    if (c.fredReservesSeries) ids.add(c.fredReservesSeries);
    if (c.fredGdpSeries) ids.add(c.fredGdpSeries);
    if (c.fredDebtSeries && c.debtSource !== 'worldbank') ids.add(c.fredDebtSeries);
    if (c.fredCpiSeries) ids.add(c.fredCpiSeries);
  }
  return [...ids];
}

export function useFredBatch(countries: CountryData[]) {
  const [data, setData] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const seriesIds = getFredSeriesIds(countries);
    if (seriesIds.length === 0) return;
    fetchFredBatchLatest(seriesIds).then((results) => {
      const cleaned: Record<string, number> = {};
      for (const [id, v] of Object.entries(results)) {
        if (v !== null) cleaned[id] = v;
      }
      setData(cleaned);
      setLoading(false);
    });
  }, [countries]);
  return { data, loading };
}

export function useGdpData(countries: CountryData[]) {
  const [data, setData] = useState<Map<string, GdpRecord[]> | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const codes = countries.map((c) => c.code);
    if (codes.length === 0) return;
    fetchGdpUsd(codes, '1976-01-01').then((d) => {
      setData(d);
      setLoading(false);
    });
  }, [countries]);
  return { data, loading };
}

function useFredHistoryFanOut(
  countries: CountryData[],
  getSeries: (c: CountryData) => string | null,
  from: string,
) {
  const [data, setData] = useState<Map<string, TimeSeriesPoint[]> | null>(null);
  useEffect(() => {
    if (countries.length === 0) return;
    const fetches = countries.map(async (country) => {
      const series = getSeries(country);
      if (!series) return { code: country.code, records: [] };
      const history = await fetchFredHistory(series, from);
      return { code: country.code, records: history.filter((p) => p.value !== null) as TimeSeriesPoint[] };
    });
    Promise.all(fetches).then((results) => {
      setData(new Map(results.map((r) => [r.code, r.records])));
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [countries]);
  return { data };
}

export function useRateHistory(countries: CountryData[]) {
  return useFredHistoryFanOut(countries, (c) => c.fredRateSeries, '1990-01-01');
}

export function useCpiHistory(countries: CountryData[]) {
  return useFredHistoryFanOut(countries, (c) => c.fredCpiSeries, '1990-01-01');
}

export function useDebtHistory(countries: CountryData[]) {
  const [data, setData] = useState<Map<string, TimeSeriesPoint[]> | null>(null);
  useEffect(() => {
    if (countries.length === 0) return;
    const fetches = countries.map(async (country) => {
      const history = country.debtSource === 'worldbank'
        ? await fetchWorldBankDebt(country.code)
        : await fetchFredHistory(country.fredDebtSeries!, '1990-01-01');
      return { code: country.code, records: history.filter((p) => p.value !== null) };
    });
    Promise.all(fetches).then((results) => {
      setData(new Map(results.map((r) => [r.code, r.records])));
    });
  }, [countries]);
  return { data };
}

export function useLatestGdpUsd(gdpData: Map<string, GdpRecord[]> | null) {
  return useMemo(() => {
    if (!gdpData) return new Map<string, number>();
    const map = new Map<string, number>();
    for (const [code, records] of gdpData) {
      if (records.length > 0) {
        map.set(code, records[records.length - 1].gdpUsd);
      }
    }
    return map;
  }, [gdpData]);
}

export function useInflationData(cpiData: Map<string, TimeSeriesPoint[]> | null) {
  return useMemo(() => {
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
}

export function useLatestInflation(inflationData: Map<string, TimeSeriesPoint[]> | null) {
  return useMemo(() => {
    if (!inflationData) return {};
    const map: Record<string, number> = {};
    for (const [code, points] of inflationData) {
      const sorted = [...points].sort((a, b) => b.date.localeCompare(a.date));
      const latest = sorted.find((p) => p.value !== null);
      if (latest && latest.value !== null) map[code] = latest.value;
    }
    return map;
  }, [inflationData]);
}
