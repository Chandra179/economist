import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine,
} from 'recharts';
import { COUNTRY_COLORS } from '../config';

export interface LineConfig {
  dataKey: string;
  name: string;
  color: string;
  yAxisId: 'left' | 'right';
  strokeDasharray?: string;
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
  hideLegend?: boolean;
  groupByCountry?: boolean;
}

export default function TimeSeriesChart({
  data, valueFormatter, leftFormatter, rightFormatter, countries, selectedCode, lines, referenceLines, yAxisDomain, hideLegend, groupByCountry,
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
    strokeDasharray: undefined,
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
              if (groupByCountry) {
                const groups = new Map<string, { name: string; rate?: number; cpi?: number; color: string }>();
                for (const entry of payload) {
                  const dataKey = String(entry.dataKey ?? '');
                  const idx = dataKey.lastIndexOf('_');
                  if (idx === -1) continue;
                  const code = dataKey.slice(0, idx);
                  const type = dataKey.slice(idx + 1) as 'rate' | 'cpi';
                  if (!groups.has(code)) {
                    const raw = String(entry.name ?? '');
                    const countryName = raw.replace(/ (Rate|Inflation)$/, '');
                    groups.set(code, { name: countryName, color: String(entry.color ?? '#94a3b8') });
                  }
                  const g = groups.get(code)!;
                  if (type === 'rate' && entry.value !== null) g.rate = Number(entry.value);
                  if (type === 'cpi' && entry.value !== null) g.cpi = Number(entry.value);
                }
                return (
                  <div className="bg-white border border-slate-200 rounded-lg p-3 text-xs shadow-lg">
                    <div className="font-semibold text-slate-700 mb-1.5">{String(label).slice(0, 4)}</div>
                    {[...groups.values()].map((g) => (
                      <div key={g.name} className="flex items-center gap-2 text-slate-600">
                        <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: g.color }} />
                        <span className="font-semibold text-slate-700">{g.name}:</span>
                        <span className="font-mono">
                          {g.rate !== undefined ? <span className="text-slate-800">Rate {fmtLeft(g.rate)}</span> : null}
                          {g.rate !== undefined && g.cpi !== undefined ? <span className="text-slate-400 mx-1">|</span> : null}
                          {g.cpi !== undefined ? <span className="text-slate-800">Infl {fmtLeft(g.cpi)}</span> : null}
                        </span>
                      </div>
                    ))}
                  </div>
                );
              }
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
          {!hideLegend && (
            <Legend
              iconSize={8}
              wrapperStyle={{ fontSize: 10, lineHeight: '16px' }}
              formatter={(value: string) => {
                if (lines) return value;
                const country = (countries ?? []).find((c) => c.code === value);
                return country?.name ?? value;
              }}
            />
          )}
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
              strokeDasharray={lc.strokeDasharray}
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
