const FRANKFURTER_BASE = 'https://api.frankfurter.dev/v2';

interface RateResponse {
  date: string;
  base: string;
  quote: string;
  rate: number;
}

export async function fetchExchangeRates(
  currencies: string[],
): Promise<Map<string, number>> {
  const quotes = currencies.join(',');
  const url = `${FRANKFURTER_BASE}/rates?base=USD&quotes=${quotes}`;

  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data: RateResponse[] = await response.json();
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
  currency: string,
  fromDate: string,
  group?: 'day' | 'week' | 'month',
): Promise<Array<{ date: string; rate: number }>> {
  let url = `${FRANKFURTER_BASE}/rates?from=${fromDate}&base=USD&quotes=${currency}`;
  if (group && group !== 'day') url += `&group=${group}`;

  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data: RateResponse[] = await response.json();
    return data.map((item) => ({ date: item.date, rate: item.rate }));
  } catch {
    return [];
  }
}

export async function fetchFredLatest(seriesId: string): Promise<number | null> {
  const key = import.meta.env.VITE_FRED_API_KEY;
  if (!key) return null;

  const url = `/api/fred/fred/series/observations?series_id=${seriesId}&api_key=${key}&sort_order=desc&limit=1&file_type=json`;

  try {
    const response = await fetch(url);
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

export async function fetchFredHistory(
  seriesId: string,
  fromDate: string,
): Promise<Array<{ date: string; value: number | null }>> {
  const key = import.meta.env.VITE_FRED_API_KEY;
  if (!key) return [];

  const url = `/api/fred/fred/series/observations?series_id=${seriesId}&api_key=${key}&observation_start=${fromDate}&sort_order=asc&file_type=json`;

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
