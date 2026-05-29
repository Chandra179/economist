interface IntervalOption {
  value: string;
  label: string;
}

interface IntervalSelectorProps {
  intervals: IntervalOption[];
  value: string;
  onChange: (value: string) => void;
}

export default function IntervalSelector({ intervals, value, onChange }: IntervalSelectorProps) {
  return (
    <div className="flex gap-1">
      {intervals.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className={`px-2 py-1 text-[10px] font-semibold font-mono rounded-md border transition cursor-pointer uppercase tracking-wide
            ${value === opt.value
              ? 'bg-slate-600 text-white border-slate-600'
              : 'bg-slate-50 text-slate-400 border-slate-200 hover:border-slate-400'
            }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
