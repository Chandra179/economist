import IntervalSelector from './IntervalSelector';
import DataTable from './DataTable';

interface GdpPoint {
  date: string;
  cnyGdp: number | null;
  idrGdp: number | null;
}

interface Props {
  data: GdpPoint[] | null;
  loading: boolean;
  selectedCurrencies: 'both' | 'CNY' | 'IDR';
  onCurrencyChange: (c: 'both' | 'CNY' | 'IDR') => void;
  interval: string;
  onIntervalChange: (i: string) => void;
}

function fmtUsd(v: unknown): string {
  if (v === null || v === undefined) return '\u2014';
  const n = v as number;
  if (n >= 1e12) return '$' + (n / 1e12).toFixed(1) + 'T';
  if (n >= 1e9) return '$' + (n / 1e9).toFixed(1) + 'B';
  return '$' + (n / 1e6).toFixed(0) + 'M';
}

export default function GdpTable({ data, loading, selectedCurrencies, onCurrencyChange, interval, onIntervalChange }: Props) {
  const rows = (data ?? []).map((p) => ({
    date: p.date,
    cnyGdp: p.cnyGdp,
    idrGdp: p.idrGdp,
  }));

  const columns = [
    { key: 'date', header: interval === 'year' ? 'Year' : 'Date' },
    ...(selectedCurrencies === 'both' || selectedCurrencies === 'CNY'
      ? [{ key: 'cnyGdp' as const, header: 'China', format: fmtUsd }]
      : []),
    ...(selectedCurrencies === 'both' || selectedCurrencies === 'IDR'
      ? [{ key: 'idrGdp' as const, header: 'Indonesia', format: fmtUsd }]
      : []),
  ];

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-xs text-slate-400 uppercase tracking-wide font-semibold">GDP Trend</h4>
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
            intervals={[{ value: 'quarter', label: 'Qtr' }, { value: 'year', label: 'Year' }]}
            value={interval}
            onChange={onIntervalChange}
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
