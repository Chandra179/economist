import { NULL_PLACEHOLDER } from '../config';
import type { CountryData } from '../types';

interface Props {
  country: CountryData;
  liveRate: number | null;
  fredData: Record<string, number>;
  fredLoading: boolean;
  loading: boolean;
  dxyLatest: number | null;
  latestGdpUsd: number | null;
  povertyValue: number | null;
}

export default function CountryCard({ country, liveRate, fredData, fredLoading, loading, dxyLatest, latestGdpUsd, povertyValue }: Props) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-6 flex flex-col gap-4">
      <div className="flex items-start gap-3">
        <span className="text-4xl leading-none">{country.flag}</span>
        <div>
          <h3 className="text-lg font-semibold text-slate-900 mb-0.5">{country.name}</h3>
          <span className="text-xs text-slate-400">{country.currency} ({country.code})</span>
        </div>
      </div>

      <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 text-center">
        <span className="block text-[11px] text-slate-400 uppercase tracking-wide mb-1">
          Exchange Rate (1 USD =)
        </span>
        <span className="text-2xl font-bold text-green-600 font-mono">
          {loading
            ? '...'
            : liveRate
              ? liveRate.toLocaleString(undefined, { maximumFractionDigits: 2 })
              : NULL_PLACEHOLDER}
          <span className="text-sm text-slate-400 font-normal"> {country.code}</span>
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {country.fredRateSeries && (
          <div className="bg-slate-50 rounded-md p-2.5 flex flex-col gap-0.5">
            <span className="text-[10px] text-slate-400 uppercase tracking-wide flex items-center gap-1">
              Interest Rate
              <span className="relative group flex items-center">
                <span className="text-slate-300 cursor-help text-[9px] leading-none w-3.5 h-3.5 rounded-full border border-slate-300 inline-flex items-center justify-center">i</span>
                <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 w-48 p-1.5 text-[10px] leading-tight text-white bg-slate-800 rounded shadow-lg opacity-0 group-hover:opacity-100 transition pointer-events-none z-10 text-center">
                  The interest rate set by a central bank. When it goes up, borrowing money gets more expensive for businesses and people.
                </span>
              </span>
            </span>
            <span className="text-sm font-semibold text-slate-900 font-mono">
              {fredData[country.fredRateSeries] !== undefined
                ? `${fredData[country.fredRateSeries]}%`
                : fredLoading
                  ? '...'
                  : NULL_PLACEHOLDER}
            </span>
          </div>
        )}
        {country.fredReservesSeries && (
          <div className="bg-slate-50 rounded-md p-2.5 flex flex-col gap-0.5">
            <span className="text-[10px] text-slate-400 uppercase tracking-wide flex items-center gap-1">
              Reserves
              <span className="relative group flex items-center">
                <span className="text-slate-300 cursor-help text-[9px] leading-none w-3.5 h-3.5 rounded-full border border-slate-300 inline-flex items-center justify-center">i</span>
                <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 w-52 p-1.5 text-[10px] leading-tight text-white bg-slate-800 rounded shadow-lg opacity-0 group-hover:opacity-100 transition pointer-events-none z-10 text-center">
                  Total foreign exchange reserves held by the central bank, mostly in US dollars.
                </span>
              </span>
            </span>
            <span className="text-sm font-semibold text-slate-900 font-mono">
              {fredData[country.fredReservesSeries] !== undefined
                ? `$${(fredData[country.fredReservesSeries] > 10000
                    ? fredData[country.fredReservesSeries] / 1000
                    : fredData[country.fredReservesSeries]
                  ).toLocaleString()}B`
                : fredLoading
                  ? '...'
                  : NULL_PLACEHOLDER}
            </span>
          </div>
        )}
        {dxyLatest !== null && (
          <div className="bg-slate-50 rounded-md p-2.5 flex flex-col gap-0.5">
            <span className="text-[10px] text-slate-400 uppercase tracking-wide flex items-center gap-1">
              Dollar Index (DXY)
              <span className="relative group flex items-center">
                <span className="text-slate-300 cursor-help text-[9px] leading-none w-3.5 h-3.5 rounded-full border border-slate-300 inline-flex items-center justify-center">i</span>
                <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 w-52 p-1.5 text-[10px] leading-tight text-white bg-slate-800 rounded shadow-lg opacity-0 group-hover:opacity-100 transition pointer-events-none z-10 text-center">
                  A strength score for the dollar against other currencies. 2006 = 100. Above 100 means stronger; below 100 means weaker.
                </span>
              </span>
            </span>
            <span className="text-sm font-semibold text-slate-900 font-mono">
              {dxyLatest.toLocaleString(undefined, { maximumFractionDigits: 2 })}
              <span className="text-[10px] text-slate-400 font-normal"> pts</span>
            </span>
          </div>
        )}
      </div>

      {(country.fredGdpSeries || latestGdpUsd !== null || povertyValue !== null) && (
        <div className="grid grid-cols-2 gap-2">
          {(country.fredGdpSeries || latestGdpUsd !== null) && (
            <div className="bg-slate-50 rounded-md p-2.5 flex flex-col gap-0.5">
              <span className="text-[10px] text-slate-400 uppercase tracking-wide flex items-center gap-1">
                GDP
                <span className="relative group flex items-center">
                  <span className="text-slate-300 cursor-help text-[9px] leading-none w-3.5 h-3.5 rounded-full border border-slate-300 inline-flex items-center justify-center">i</span>
                  <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 w-48 p-1.5 text-[10px] leading-tight text-white bg-slate-800 rounded shadow-lg opacity-0 group-hover:opacity-100 transition pointer-events-none z-10 text-center">
                    Gross Domestic Product in US dollars.
                  </span>
                </span>
              </span>
              <span className="text-sm font-semibold text-slate-900 font-mono">
                {latestGdpUsd !== null ? fmtGdpUsd(latestGdpUsd) : (loading ? '...' : NULL_PLACEHOLDER)}
              </span>
            </div>
          )}
          {povertyValue !== null && (
            <div className="bg-slate-50 rounded-md p-2.5 flex flex-col gap-0.5">
              <span className="text-[10px] text-slate-400 uppercase tracking-wide flex items-center gap-1">
                Poverty
                <span className="relative group flex items-center">
                  <span className="text-slate-300 cursor-help text-[9px] leading-none w-3.5 h-3.5 rounded-full border border-slate-300 inline-flex items-center justify-center">i</span>
                  <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 w-56 p-1.5 text-[10px] leading-tight text-white bg-slate-800 rounded shadow-lg opacity-0 group-hover:opacity-100 transition pointer-events-none z-10 text-center">
                    Population living below $8.30/day (2021 PPP). Shows extreme to moderate poverty across countries.
                  </span>
                </span>
              </span>
              <span className="text-sm font-semibold text-slate-900 font-mono">
                {povertyValue}%
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function fmtGdpUsd(value: number): string {
  if (value >= 1e12) return '$' + (value / 1e12).toFixed(2) + 'T';
  if (value >= 1e9) return '$' + (value / 1e9).toFixed(2) + 'B';
  return '$' + (value / 1e6).toFixed(2) + 'M';
}
