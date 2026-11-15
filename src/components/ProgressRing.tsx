export function ProgressRing({ value, max, color, label }: { value: number; max: number; color: string; label: string }) {
  const r = 34;
  const c = 2 * Math.PI * r;
  const pct = Math.min(1, value / max);
  return (
    <div className="flex items-center gap-4">
      <svg width="84" height="84" viewBox="0 0 84 84" className="shrink-0 -rotate-90">
        <circle cx="42" cy="42" r={r} fill="none" stroke="#efebe2" strokeWidth="8" />
        <circle cx="42" cy="42" r={r} fill="none" stroke={color} strokeWidth="8" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - pct)} />
      </svg>
      <div>
        <div className="font-display text-3xl leading-none">
          {value}
          <span className="text-base text-muted"> / {max}</span>
        </div>
        <div className="mt-1 text-sm text-muted">{label}</div>
      </div>
    </div>
  );
}
