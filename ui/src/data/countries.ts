import type { CountryData } from '../types';

export const countries: CountryData[] = [
  {
    code: 'USD',
    name: 'United States',
    currency: 'US Dollar',
    flag: '\u{1F1FA}\u{1F1F8}',
    fredRateSeries: 'DFF',
    fredReservesSeries: null,
    fredGdpSeries: null,
    fredDebtSeries: null,
  },
  {
    code: 'CNY',
    name: 'China',
    currency: 'Yuan',
    flag: '\u{1F1E8}\u{1F1F3}',
    fredRateSeries: null,
    fredReservesSeries: 'TRESEGCNM052N',
    fredGdpSeries: 'NGDPXDCCNA',
    fredDebtSeries: 'GGGDTACNA188N',
  },
  {
    code: 'IDR',
    name: 'Indonesia',
    currency: 'Rupiah',
    flag: '\u{1F1EE}\u{1F1E9}',
    fredRateSeries: null,
    fredReservesSeries: 'TRESEGIDM052N',
    fredGdpSeries: 'NGDPSAXDCIDQ',
    fredDebtSeries: 'GGGDTAIDA188N',
  },
];
