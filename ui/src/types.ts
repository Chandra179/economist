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
  // 'fred' (default) fetches via FRED API (values in scaled units, e.g. billions).
  // 'worldbank' uses World Bank NY.GDP.MKTP.CN (values in full LCU, not scaled).
  gdpSource?: 'fred' | 'worldbank';
  gdpMultiplier?: number;
  localCurrencySymbol?: string;
}

export interface TimeSeriesPoint {
  date: string;
  value: number | null;
}

export interface GdpRecord {
  date: string;
  gdpUsd: number;
  growth?: number | null;
}
