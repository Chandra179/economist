import IntervalSelector from './IntervalSelector';
import DataTable from './DataTable';

interface DataPoint {
  date: string;
  usdcny: number | null;
  usdidr: number | null;
}

type FreqInterval = 'day' | 'week' | 'month' | 'year';

interface Props {
  data: DataPoint[] | null;
  loading: boolean;
  selectedCurrencies: 'both' | 'CNY' | 'IDR';
  onCurrencyChange: (c: 'both' | 'CNY' | 'IDR') => void;
  interval: string;
  onIntervalChange: (i: string) => void;
}

const FX_INTERVAL_OPTIONS: Record<FreqInterval, string> = {
  day: 'Day',
  week: 'Week',
  month: 'Month',
  year: 'Year',
};

function formatDate(dateStr: string, interval: string): string {
  if (interval === 'year') return dateStr.slice(0, 4);
  if (interval === 'month') return dateStr.slice(0, 7);
  return dateStr.slice(0, 10);
}

function fmtRate(v: unknown): string {
  if (v === null || v === undefined) return '\u2014';
  return (v as number).toLocaleString(undefined, { minimumFractionDigits: 4, maximumFractionDigits: 4 });
}

export default function FxTable({ data, loading, selectedCurrencies, onCurrencyChange, interval, onIntervalChange }: Props) {
  const handleInterval = (value: string) => onIntervalChange(value as FreqInterval);

  const rows = (data ?? []).map((p) => ({
    date: p.date,
    usdcny: p.usdcny,
    usdidr: p.usdidr,
  }));

  const columns = [
    { key: 'date', header: 'Date', format: (v: unknown) => formatDate(String(v), interval) },
    ...(selectedCurrencies === 'both' || selectedCurrencies === 'CNY'
      ? [{ key: 'usdcny' as const, header: 'USD/CNY', format: fmtRate }]
      : []),
    ...(selectedCurrencies === 'both' || selectedCurrencies === 'IDR'
      ? [{ key: 'usdidr' as const, header: 'USD/IDR', format: fmtRate }]
      : []),
  ];

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-xs text-slate-400 uppercase tracking-wide font-semibold">Exchange Rate Trend</h4>
        <div className="flex items-center gap-2">
          <div className="flex gap-1 mr-2">
            {(['both', 'CNY', 'IDR'] as const).map((c) => (
              <button
                key={c}
                onClick={() => onCurrencyChange(c)}
                className={`px-2 py-1 text-[10px] font-semibold rounded-md border transition cursor-pointer uppercase tracking-wide
                  ${selectedCurrencies === c
                    ? c === 'CNY'
                      ? 'bg-red-500 text-white border-red-500'
                      : c === 'IDR'
                        ? 'bg-green-600 text-white border-green-600'
                        : 'bg-slate-800 text-white border-slate-800'
                    : 'bg-slate-50 text-slate-400 border-slate-200 hover:border-slate-400'
                  }`}
              >
                {c === 'both' ? 'All' : c}
              </button>
            ))}
          </div>
          <IntervalSelector
            intervals={(['day', 'week', 'month', 'year'] as FreqInterval[]).map((i) => ({ value: i, label: FX_INTERVAL_OPTIONS[i] }))}
            value={interval}
            onChange={handleInterval}
          />
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center text-slate-400 text-sm py-12">Loading...</div>
      ) : (
        <DataTable
          columns={columns}
          data={rows as unknown as Record<string, unknown>[]}
        />
      )}
    </div>
  );
}
