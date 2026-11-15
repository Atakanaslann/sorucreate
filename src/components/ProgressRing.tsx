/** Degrade dolgulu ilerleme halkası. `dark` koyu zemin için. */
export function ProgressRing({
  value, max, from, to, label, sub, size = 132, dark = false, id,
}: { value: number; max: number; from: string; to: string; label: string; sub?: string; size?: number; dark?: boolean; id: string }) {
  const sw = 10;
  const r = size / 2 - sw;
  const c = 2 * Math.PI * r;
  const pct = Math.min(1, max ? value / max : 0);
  return (
    <div className="flex flex-col items-center text-center">
      <div className="relative aspect-square w-full" style={{ maxWidth: size }}>
        <svg width="100%" height="100%" viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
          <defs>
            <linearGradient id={`g-${id}`} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor={from} />
              <stop offset="100%" stopColor={to} />
            </linearGradient>
          </defs>
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={dark ? "rgba(255,255,255,.08)" : "rgba(13,16,23,.06)"} strokeWidth={sw} />
          <circle
            cx={size / 2} cy={size / 2} r={r} fill="none" stroke={`url(#g-${id})`} strokeWidth={sw} strokeLinecap="round"
            strokeDasharray={c} strokeDashoffset={c * (1 - pct)}
            style={{ filter: `drop-shadow(0 0 10px ${to}55)`, transition: "stroke-dashoffset 1.2s cubic-bezier(.2,.8,.2,1)" }}
          />
        </svg>
        <div className="absolute inset-0 grid place-items-center">
          <div>
            <div className="tabular font-display text-[26px] leading-none sm:text-[34px] tracking-tight">{value}</div>
            <div className={`tabular mt-1 font-mono text-[11px] ${dark ? "text-white/45" : "text-muted"}`}>/ {max}</div>
          </div>
        </div>
      </div>
      <div className={`mt-3 text-sm font-semibold ${dark ? "text-white/90" : ""}`}>{label}</div>
      {sub && <div className={`text-xs ${dark ? "text-white/45" : "text-muted"}`}>{sub}</div>}
    </div>
  );
}
