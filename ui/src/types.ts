export interface CountryData {
  code: string;
  name: string;
  currency: string;
  flag: string;
  fredRateSeries: string | null;
  fredReservesSeries: string | null;
  fredGdpSeries: string | null;
  fredDebtSeries: string | null;
  debtSource?: 'fred' | 'worldbank';
  gdpMultiplier?: number;
}

export interface TimeSeriesPoint {
  date: string;
  value: number | null;
}

export interface GdpRecord {
  date: string;
  gdpUsd: number;
}
