import { useState, useEffect, type ReactNode } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Legend,
} from 'recharts';
import { fetchFredHistory, fetchHistoricalRates } from '../data/api';

// ── Event annotations ──

interface EventDef {
  date: string;
  label: string;
  desc: string;
}

const EVENTS: EventDef[] = [
  { date: '2008-09-01', label: '2008 Crisis', desc: 'Global Financial Crisis — Fed cuts rates to zero' },
  { date: '2013-05-01', label: 'Taper Tantrum', desc: 'Fed hints at QE taper → EM selloff' },
  { date: '2015-12-01', label: 'Fed Hike', desc: 'First rate hike since 2006' },
  { date: '2020-03-01', label: 'COVID', desc: 'Emergency Fed cuts, massive QE' },
  { date: '2022-03-01', label: 'Fed Hikes', desc: 'Fastest tightening cycle in 40 years' },
];

// ── Series and panel config ──

interface LineDef {
  key: string;
  name: string;
  color: string;
  axis: 'left' | 'right';
  fmt: (v: number) => string;
}

interface PanelDef {
  title: string;
  desc: string;
  lines: LineDef[];
}

const PANELS: PanelDef[] = [
  {
    title: 'US Monetary Conditions',
    desc: 'The Fed funds rate drives the global dollar cycle. When the Fed raises rates, the dollar strengthens and capital flows back to the US.',
    lines: [
      { key: 'dff', name: 'Fed Funds Rate', color: '#3b82f6', axis: 'left', fmt: (v) => v.toFixed(1) + '%' },
      { key: 'dxy', name: 'DXY Dollar Index', color: '#f59e0b', axis: 'right', fmt: (v) => v.toFixed(1) },
    ],
  },
  {
    title: 'EM Currency Pressure',
    desc: 'When the dollar strengthens, EM currencies depreciate. Hot money flees back to safe US assets.',
    lines: [
      { key: 'usdcny', name: 'USD/CNY', color: '#ef4444', axis: 'left', fmt: (v) => v.toFixed(4) },
      { key: 'usdidr', name: 'USD/IDR', color: '#8b5cf6', axis: 'right', fmt: (v) => v.toFixed(0) },
    ],
  },
  {
    title: 'China Policy Response',
    desc: 'China raises its discount rate to defend the renminbi and stem capital outflows.',
    lines: [
      { key: 'cnRate', name: 'China Discount Rate', color: '#ef4444', axis: 'left', fmt: (v) => v.toFixed(1) + '%' },
    ],
  },
];

// ── FRED series to fetch (no server changes needed) ──

interface SeriesFetch {
  key: string;
  id: string;
}

const FRED_SERIES: SeriesFetch[] = [
  { key: 'dff', id: 'DFF' },
  { key: 'dxy', id: 'DTWEXBGS' },
  { key: 'cnRate', id: 'INTDSRCNM193N' },
];

const FROM = '1999-01-01';

// ── Helpers ──

function normalizeDate(d: string): string {
  return d.slice(0, 7) + '-01';
}

function mergeTimeSeries(
  seriesMap: Map<string, { date: string; value: number | null }[]>,
): Record<string, unknown>[] {
  const byMonth = new Map<string, Record<string, number | null>>();

  for (const [key, points] of seriesMap) {
    for (const p of points) {
      if (p.value === null) continue;
      const monthKey = normalizeDate(p.date);
      if (!byMonth.has(monthKey)) {
        byMonth.set(monthKey, {});
      }
      byMonth.get(monthKey)![key] = p.value;
    }
  }

  return [...byMonth.keys()].sort().map((date) => ({
    date,
    ...byMonth.get(date),
  }));
}

// ── Sub-components ──

function EventLegend() {
  return (
    <div className="flex flex-wrap gap-x-5 gap-y-1 text-[10px] text-slate-500 mt-1">
      <span className="font-semibold text-slate-400 uppercase tracking-wide">Events:</span>
      {EVENTS.map((e) => (
        <span key={e.date} className="flex items-center gap-1.5">
          <span className="w-4 h-0 border-t border-dashed border-slate-400 inline-block" />
          <span className="font-medium text-slate-600">{e.label}</span>
          <span className="text-slate-400">— {e.desc}</span>
        </span>
      ))}
    </div>
  );
}

function PanelChart({ panel, data }: { panel: PanelDef; data: Record<string, unknown>[] }) {
  const leftLines = panel.lines.filter((l) => l.axis === 'left');
  const rightLines = panel.lines.filter((l) => l.axis === 'right');
  const leftFmt = leftLines[0]?.fmt ?? ((v: number) => String(v));
  const rightFmt = rightLines[0]?.fmt ?? ((v: number) => String(v));

  return (
    <ResponsiveContainer width="100%" height={240}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
        <XAxis dataKey="date" tickFormatter={(v: string) => v.slice(0, 4)} tick={{ fontSize: 11, fontFamily: 'monospace' }} stroke="#94a3b8" />
        <YAxis yAxisId="left" tickFormatter={leftFmt} tick={{ fontSize: 11, fontFamily: 'monospace' }} stroke="#94a3b8" width={56} />
        {rightLines.length > 0 && <YAxis yAxisId="right" orientation="right" tickFormatter={rightFmt} tick={{ fontSize: 11, fontFamily: 'monospace' }} stroke="#94a3b8" width={56} />}
        <Tooltip content={<ChartTooltip panel={panel} />} />
        <Legend
          formatter={(value: string) => {
            const line = panel.lines.find((l) => l.key === value);
            return line?.name ?? value;
          }}
        />
        {leftLines.map((l) => (
          <Line key={l.key} type="monotone" dataKey={l.key} stroke={l.color} strokeWidth={2} dot={false} activeDot={{ r: 3 }} name={l.key} yAxisId="left" />
        ))}
        {rightLines.map((l) => (
          <Line key={l.key} type="monotone" dataKey={l.key} stroke={l.color} strokeWidth={2} dot={false} activeDot={{ r: 3 }} name={l.key} yAxisId="right" />
        ))}
        {EVENTS.map((e) => (
          <ReferenceLine key={e.date} x={e.date} stroke="#94a3b8" strokeDasharray="3 3" strokeWidth={1} />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}

interface ChartTooltipProps {
  active?: boolean;
  payload?: Array<{ dataKey: string; value: unknown; color: string; name: string }>;
  label?: string;
  panel: PanelDef;
}

function ChartTooltip({ active, payload, label, panel }: ChartTooltipProps) {
  if (!active || !payload?.length || !label) return null;
  return (
    <div className="bg-white border border-slate-200 rounded-lg p-3 text-xs shadow-lg max-w-64">
      <div className="font-semibold text-slate-700 mb-1.5">{label}</div>
      <div className="flex flex-col gap-1">
        {payload.map((entry) => {
          if (entry.value === null || entry.value === undefined) return null;
          const line = panel.lines.find((l) => l.key === entry.dataKey);
          return (
            <div key={entry.dataKey} className="flex items-center gap-2 text-slate-600">
              <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: entry.color }} />
              <span>{line?.name ?? entry.name}:</span>
              <span className="font-semibold text-slate-800 ml-auto tabular-nums">
                {line?.fmt(entry.value as number) ?? String(entry.value)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Main component ──

export default function CapitalFlowMonitor() {
  const [data, setData] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<Record<number, boolean>>({ 0: true, 1: true, 2: true });

  useEffect(() => {
    const fredPromises = FRED_SERIES.map((s) =>
      fetchFredHistory(s.id, FROM, 'm').then((points) => ({ key: s.key, points })),
    );

    const fxPromise = fetchHistoricalRates(['CNY', 'IDR'], FROM, 'month').then((map) =>
      [...map.entries()].map(([currency, points]) => ({
        key: 'usd' + currency.toLowerCase(),
        points,
      })),
    );

    Promise.all([...fredPromises, fxPromise]).then((results) => {
      const flat = results.flat();
      const seriesMap = new Map<string, { date: string; value: number | null }[]>();
      for (const { key, points } of flat) {
        seriesMap.set(key, points);
      }
      setData(mergeTimeSeries(seriesMap));
      setLoading(false);
    });
  }, []);

  function togglePanel(i: number) {
    setExpanded((prev) => ({ ...prev, [i]: !prev[i] }));
  }

  if (loading) {
    return (
      <SectionShell>
        <div className="flex items-center justify-center text-slate-400 text-sm py-16">Loading capital flow data...</div>
      </SectionShell>
    );
  }

  if (data.length === 0) {
    return (
      <SectionShell>
        <div className="flex items-center justify-center text-slate-400 text-sm py-16">No data available</div>
      </SectionShell>
    );
  }

  return (
    <SectionShell>
      <EventLegend />
      <div className="flex flex-col gap-3 mt-4">
        {PANELS.map((panel, i) => (
          <div key={panel.title} className="border border-slate-200 rounded-xl overflow-hidden">
            <button
              onClick={() => togglePanel(i)}
              className="w-full flex items-center justify-between px-4 py-3 bg-slate-50 hover:bg-slate-100 transition cursor-pointer text-left"
            >
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400 font-mono w-5 shrink-0">{expanded[i] ? '▼' : '▶'}</span>
                <span className="text-sm font-semibold text-slate-700">{panel.title}</span>
              </div>
            </button>
            {expanded[i] && (
              <div className="px-2 pb-2">
                <p className="text-[11px] text-slate-400 px-3 pt-2 pb-1 leading-relaxed">{panel.desc}</p>
                <PanelChart panel={panel} data={data} />
              </div>
            )}
          </div>
        ))}
      </div>
    </SectionShell>
  );
}

// ── Shell wrapper ──

function SectionShell({ children }: { children: ReactNode }) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-6">
      <div className="flex items-center gap-2 mb-1">
        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Capital Flow Monitor</h3>
      </div>
      <p className="text-[11px] text-slate-400 leading-relaxed mb-3">
        How Fed policy drives hot money flows, EM currency pressure, and the policy response.
      </p>
      {children}
    </div>
  );
}
