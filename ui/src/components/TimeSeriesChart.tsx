import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine,
} from 'recharts';
import { COUNTRY_COLORS } from '../config';

interface LineConfig {
  dataKey: string;
  name: string;
  color: string;
  yAxisId: 'left' | 'right';
}

interface TimeSeriesChartProps {
  data: Record<string, unknown>[];
  valueFormatter?: (v: number) => string;
  leftFormatter?: (v: number) => string;
  rightFormatter?: (v: number) => string;
  countries?: { code: string; name: string }[];
  selectedCode?: string | null;
  lines?: LineConfig[];
  referenceLines?: { value: number; label: string; yAxisId?: string }[];
  yAxisDomain?: [number, number];
}

export default function TimeSeriesChart({
  data, valueFormatter, leftFormatter, rightFormatter, countries, selectedCode, lines, referenceLines, yAxisDomain,
}: TimeSeriesChartProps) {
  const fmtLeft = leftFormatter ?? valueFormatter ?? ((v: number) => String(v));
  const fmtRight = rightFormatter ?? ((v: number) => String(v));

  const hasDualAxis = rightFormatter !== undefined;

  const renderedLines = lines ?? (countries ?? []).filter(
    (c) => selectedCode === null || c.code === selectedCode,
  ).map((c, i) => ({
    dataKey: c.code,
    name: c.name,
    color: COUNTRY_COLORS[i % COUNTRY_COLORS.length],
    yAxisId: 'left' as const,
  }));

  return (
    <div className="py-4">
      <ResponsiveContainer width="100%" height={400}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis
            dataKey="date"
            tickFormatter={(v: string) => v.slice(0, 4)}
            tick={{ fontSize: 11, fontFamily: 'monospace' }}
            stroke="#94a3b8"
          />
          <YAxis
            yAxisId="left"
            domain={yAxisDomain}
            tickFormatter={fmtLeft}
            tick={{ fontSize: 11, fontFamily: 'monospace' }}
            stroke="#94a3b8"
          />
          {hasDualAxis && (
            <YAxis
              yAxisId="right"
              orientation="right"
              tickFormatter={fmtRight}
              tick={{ fontSize: 11, fontFamily: 'monospace' }}
              stroke="#64748b"
            />
          )}
          <Tooltip
            content={({ active, payload, label }) => {
              if (!active || !payload?.length) return null;
              return (
                <div className="bg-white border border-slate-200 rounded-lg p-3 text-xs shadow-lg">
                  <div className="font-semibold text-slate-700 mb-1.5">{String(label).slice(0, 4)}</div>
                  {payload.map((entry) => {
                    const name = String(entry.name ?? '');
                    const value = Number(entry.value ?? 0);
                    const color = String(entry.color ?? '#94a3b8');
                    const lineCfg = lines?.find((l) => l.dataKey === name);
                    const formatter = lineCfg?.yAxisId === 'right' ? fmtRight : fmtLeft;
                    return (
                      <div key={name} className="flex items-center gap-2 text-slate-600">
                        <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: color }} />
                        <span>{lineCfg?.name ?? name}:</span>
                        <span className="font-semibold text-slate-800">{formatter(value)}</span>
                      </div>
                    );
                  })}
                </div>
              );
            }}
          />
          <Legend
            formatter={(value: string) => {
              if (lines) return value;
              const country = (countries ?? []).find((c) => c.code === value);
              return country?.name ?? value;
            }}
          />
          {referenceLines?.map((rl, i) => (
            <ReferenceLine
              key={i}
              y={rl.value}
              yAxisId={rl.yAxisId ?? 'left'}
              stroke="#ef4444"
              strokeDasharray="6 3"
              strokeWidth={1.5}
              label={{ value: rl.label, position: 'insideTopRight', fontSize: 10, fill: '#ef4444' }}
            />
          ))}
          {renderedLines.map((lc) => (
            <Line
              key={lc.dataKey}
              type="monotone"
              dataKey={lc.dataKey}
              yAxisId={lc.yAxisId}
              stroke={lc.color}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4 }}
              name={lc.name ?? lc.dataKey}
              connectNulls={false}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
