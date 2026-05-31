import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import { COUNTRY_COLORS } from '../config';

interface TimeSeriesChartProps {
  data: Record<string, unknown>[];
  valueFormatter: (v: number) => string;
  countries: { code: string; name: string }[];
  selectedCode: string | null;
}

export default function TimeSeriesChart({ data, valueFormatter, countries, selectedCode }: TimeSeriesChartProps) {
  return (
    <div className="py-4">
      <ResponsiveContainer width="100%" height={400}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis dataKey="date" tickFormatter={(v: string) => v.slice(0, 4)} tick={{ fontSize: 11, fontFamily: 'monospace' }} stroke="#94a3b8" />
          <YAxis
            tickFormatter={valueFormatter}
            tick={{ fontSize: 11, fontFamily: 'monospace' }}
            stroke="#94a3b8"
          />
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
                    const country = countries.find((c) => c.code === name);
                    return (
                      <div key={name} className="flex items-center gap-2 text-slate-600">
                        <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: color }} />
                        <span>{country?.name ?? name}:</span>
                        <span className="font-semibold text-slate-800">{valueFormatter(value)}</span>
                      </div>
                    );
                  })}
                </div>
              );
            }}
          />
          <Legend
            formatter={(value: string) => {
              const country = countries.find((c) => c.code === value);
              return country?.name ?? value;
            }}
          />
          {countries.filter((c) => selectedCode === null || c.code === selectedCode).map((c) => {
            const origIndex = countries.findIndex((dc) => dc.code === c.code);
            return (
              <Line
                key={c.code}
                type="monotone"
                dataKey={c.code}
                stroke={COUNTRY_COLORS[origIndex % COUNTRY_COLORS.length]}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4 }}
                name={c.code}
                connectNulls={false}
              />
            );
          })}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
