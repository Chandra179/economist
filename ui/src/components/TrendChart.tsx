import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';

interface DataPoint {
  date: string;
  usdcny: number | null;
  usdidr: number | null;
}

type RangeKey = '1Y' | '5Y' | '10Y' | 'MAX';

interface Props {
  data: DataPoint[] | null;
  loading: boolean;
  range: RangeKey;
  onRangeChange: (r: RangeKey) => void;
  rangeConfig: Record<RangeKey, { label: string; yearsBack: number | null; group: 'day' | 'week' | 'month' }>;
  selectedCurrencies: 'both' | 'CNY' | 'IDR';
  onCurrencyChange: (c: 'both' | 'CNY' | 'IDR') => void;
}

interface TooltipItem {
  name: string;
  value: number | null;
  color: string;
}

function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: TooltipItem[];
  label?: string;
}) {
  if (!active || !payload || !payload.length) return null;
  return (
    <div className="bg-white border border-slate-200 rounded-md px-3 py-2 text-xs font-mono shadow-sm">
      <p className="text-slate-900 font-semibold mb-1">{label}</p>
      {payload.map((p) =>
        p.value !== null ? (
          <p key={p.name} style={{ color: p.color }}>
            USD/{p.name}: {typeof p.value === 'number' ? p.value.toLocaleString() : p.value}
          </p>
        ) : null,
      )}
    </div>
  );
}

function formatDate(dateStr: string, range: RangeKey): string {
  const parts = dateStr.split('-');
  if (range === 'MAX' || range === '10Y') return parts[0];
  if (range === '5Y') return `${parts[0]}-${parts[1]}`;
  return `${parts[1]}/${parts[2]}`;
}

const rangeLabels: Record<RangeKey, string> = {
  '1Y': '1Y',
  '5Y': '5Y',
  '10Y': '10Y',
  'MAX': 'MAX',
};

export default function TrendChart({ data, loading, range, onRangeChange, rangeConfig, selectedCurrencies, onCurrencyChange }: Props) {
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
          <div className="flex gap-1">
            {(Object.keys(rangeConfig) as RangeKey[]).map((key) => (
              <button
                key={key}
                onClick={() => onRangeChange(key)}
                className={`px-3 py-1 text-xs font-semibold font-mono rounded-md border transition cursor-pointer
                  ${range === key
                    ? 'bg-orange-600 text-white border-orange-600'
                    : 'bg-slate-50 text-slate-400 border-slate-200 hover:border-orange-600 hover:text-orange-600'
                  }`}
              >
                {rangeLabels[key]}
              </button>
            ))}
          </div>
        </div>
      </div>

      {loading ? (
        <div className="h-[320px] flex items-center justify-center text-slate-400 text-sm">
          Loading...
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={320}>
          <LineChart data={data ?? []}>
            <CartesianGrid strokeDasharray="3 3" stroke="#cbd5e1" />
            <XAxis
              dataKey="date"
              stroke="#94a3b8"
              tick={{ fontSize: 11 }}
              tickFormatter={(d: string) => formatDate(d, range)}
            />
            <YAxis stroke="#94a3b8" tick={{ fontSize: 11 }} />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            {(selectedCurrencies === 'both' || selectedCurrencies === 'CNY') && (
              <Line
                type="monotone"
                dataKey="usdcny"
                name="CNY"
                stroke="#ef4444"
                strokeWidth={2}
                dot={false}
                connectNulls
              />
            )}
            {(selectedCurrencies === 'both' || selectedCurrencies === 'IDR') && (
              <Line
                type="monotone"
                dataKey="usdidr"
                name="IDR"
                stroke="#22c55e"
                strokeWidth={2}
                dot={false}
                connectNulls
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
