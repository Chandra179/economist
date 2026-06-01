import { useState, useMemo } from 'react';
import CountryCard from './components/CountryCard';
import FxTable from './components/FxTable';
import GdpTable from './components/GdpTable';
import type { CurrencyFilter } from './types';
import {
  useCountries,
  useLiveRates,
  useFxHistory,
  useDxyLatest,
  useFredBatch,
  useGdpData,
  useRateHistory,
  useCpiHistory,
  useDebtHistory,
  useLatestGdpUsd,
  useInflationData,
  useLatestInflation,
} from './hooks';

export default function App() {
  const countries = useCountries();
  const { data: liveRates, loading: fxLoading } = useLiveRates(['CNY', 'IDR']);
  const chartData = useFxHistory('1999-01-01');
  const dxyLatest = useDxyLatest();
  const { data: fredData, loading: fredLoading } = useFredBatch(countries);

  const [selectedCurrencies, setSelectedCurrencies] = useState<CurrencyFilter>('both');

  const gdpCountries = useMemo(() => countries.filter((c) => c.fredGdpSeries), [countries]);
  const debtCountries = useMemo(() => countries.filter((c) => c.fredDebtSeries), [countries]);
  const rateCountries = useMemo(() => countries.filter((c) => c.fredRateSeries), [countries]);
  const cpiCountries = useMemo(() => countries.filter((c) => c.fredCpiSeries), [countries]);

  const { data: gdpData, loading: gdpLoading } = useGdpData(gdpCountries);
  const { data: debtData } = useDebtHistory(debtCountries);
  const { data: rateHistoryData } = useRateHistory(rateCountries);
  const { data: cpiData } = useCpiHistory(cpiCountries);

  const latestGdpUsd = useLatestGdpUsd(gdpData);
  const inflationData = useInflationData(cpiData);
  const latestInflation = useLatestInflation(inflationData);

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
