export interface CountryData {
  code: string;
  name: string;
  currency: string;
  flag: string;
  fredRateSeries: string | null;
  fredReservesSeries: string | null;
}

export interface RatePoint {
  date: string;
  rate: number;
}
