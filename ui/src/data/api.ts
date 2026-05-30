import type { TimeSeriesPoint } from '../types';

const API_BASE = 'http://localhost:8080/api';

export async function fetchExchangeRates(
  currencies: string[],
): Promise<Map<string, number>> {
  const quotes = currencies.join(',');
  try {
    const response = await fetch(`${API_BASE}/exchange-rates?currencies=${quotes}`);
    if (!response.ok) return new Map();
    const data: Array<{ date: string; base: string; quote: string; rate: number }> = await response.json();
    const rates = new Map<string, number>();
    for (const item of data) {
      rates.set(item.quote, item.rate);
    }
    return rates;
  } catch {
    return new Map();
  }
}

export async function fetchHistoricalRates(
  currencies: string[],
  fromDate: string,
  group?: 'day' | 'week' | 'month' | 'year',
): Promise<Map<string, TimeSeriesPoint[]>> {
  const quotes = currencies.join(',');
  let url = `${API_BASE}/historical-rates?currencies=${quotes}&from=${fromDate}`;
  if (group && group !== 'day') {
    url += `&group=${group}`;
  }
  try {
    const response = await fetch(url);
    if (!response.ok) return new Map();
    const data: Array<{ date: string; base: string; quote: string; rate: number }> = await response.json();
    const map = new Map<string, TimeSeriesPoint[]>();
    for (const item of data) {
      if (!map.has(item.quote)) map.set(item.quote, []);
      map.get(item.quote)!.push({ date: item.date, value: item.rate });
    }
    return map;
  } catch {
    return new Map();
  }
}

export async function fetchFredLatest(seriesId: string): Promise<number | null> {
  try {
    const response = await fetch(`${API_BASE}/fred/latest?series=${seriesId}`);
    if (!response.ok) return null;
    const data = await response.json();
    const value = data.observations?.[0]?.value;
    if (value === undefined || value === '.' || value === '') return null;
    const num = parseFloat(value);
    return isNaN(num) ? null : num;
  } catch {
    return null;
  }
}

export async function fetchFredBatchLatest(
  seriesIds: string[],
): Promise<Record<string, number | null>> {
  const url = `${API_BASE}/fred/batch-latest?series=${seriesIds.join(',')}`;
  try {
    const response = await fetch(url);
    if (!response.ok) return {};
    const data: Record<string, { observations: Array<{ value: string }> }> = await response.json();
    const results: Record<string, number | null> = {};
    for (const [id, raw] of Object.entries(data)) {
      const v = raw?.observations?.[0]?.value;
      if (v === undefined || v === '.' || v === '') {
        results[id] = null;
      } else {
        const num = parseFloat(v);
        results[id] = isNaN(num) ? null : num;
      }
    }
    return results;
  } catch {
    return {};
  }
}

export async function fetchFredHistory(
  seriesId: string,
  fromDate: string,
  frequency?: string,
): Promise<TimeSeriesPoint[]> {
  let url = `${API_BASE}/fred/history?series=${seriesId}&from=${fromDate}`;
  if (frequency) url += `&frequency=${frequency}`;
  try {
    const response = await fetch(url);
    if (!response.ok) return [];
    const data = await response.json();
    return (data.observations ?? []).map((obs: { date: string; value: string }) => {
      if (obs.value === undefined || obs.value === '.' || obs.value === '') {
        return { date: obs.date, value: null };
      }
      const num = parseFloat(obs.value);
      return { date: obs.date, value: isNaN(num) ? null : num };
    });
  } catch {
    return [];
  }
}

export async function fetchWorldBankDebt(
  countryCode: string,
): Promise<TimeSeriesPoint[]> {
  try {
    const response = await fetch(`${API_BASE}/worldbank/debt?country=${countryCode}`);
    if (!response.ok) return [];
    const data = await response.json();
    const records: Array<{ date: string; value: number | null }> = data[1] ?? [];
    return records
      .filter((r) => r.value !== null && r.value !== undefined)
      .map((r) => ({ date: r.date + '-01-01', value: r.value }));
  } catch {
    return [];
  }
}
