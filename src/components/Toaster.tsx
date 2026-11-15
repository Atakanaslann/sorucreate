"use client";
import { useEffect, useState } from "react";
import { CheckCircle2, AlertTriangle, Info, X } from "lucide-react";
import clsx from "clsx";
import type { ToastDetay } from "./toast";

type T = ToastDetay & { id: number };

export function Toaster() {
  const [list, setList] = useState<T[]>([]);
  useEffect(() => {
    let n = 0;
    const on = (e: Event) => {
      const d = (e as CustomEvent<ToastDetay>).detail;
      const id = ++n;
      setList((l) => [...l.slice(-3), { ...d, id }]);
      setTimeout(() => setList((l) => l.filter((x) => x.id !== id)), d.tur === "uyari" ? 7000 : 4200);
    };
    window.addEventListener("toast", on);
    return () => window.removeEventListener("toast", on);
  }, []);
  return (
    <div className="no-print pointer-events-none fixed inset-x-0 bottom-24 z-[70] flex flex-col items-center gap-2 px-4 lg:bottom-8 lg:items-end lg:pr-8" aria-live="polite">
      {list.map((t) => {
        const Icon = t.tur === "uyari" ? AlertTriangle : t.tur === "bilgi" ? Info : CheckCircle2;
        return (
          <div key={t.id} className="pop pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-2xl border border-white/10 bg-[#11141d]/95 px-4 py-3.5 text-white shadow-[0_24px_48px_-16px_rgba(0,0,0,.55)] backdrop-blur-xl">
            <span className={clsx("mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full", t.tur === "uyari" ? "bg-[#b3372f]/25 text-[#ff9d92]" : t.tur === "bilgi" ? "bg-white/10 text-gold-2" : "bg-[#0c7a55]/30 text-[#6ee7b7]")}>
              <Icon size={14} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold leading-snug">{t.text}</p>
              {t.aciklama && <p className="mt-0.5 text-xs leading-relaxed text-white/60">{t.aciklama}</p>}
            </div>
            <button onClick={() => setList((l) => l.filter((x) => x.id !== t.id))} className="text-white/40 hover:text-white" aria-label="Kapat"><X size={14} /></button>
          </div>
        );
      })}
    </div>
  );
}
