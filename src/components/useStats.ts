"use client";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

export interface MiniStats { bugun: { gorselli: number; gorselsiz: number }; bekleyen: number; toplam: number }

/** Kenar çubuğu ve üst bar için hafif istatistik; sayfa değişince ve 30 sn'de bir yenilenir. */
export function useStats() {
  const path = usePathname();
  const [s, setS] = useState<MiniStats | null>(null);
  useEffect(() => {
    let iptal = false;
    const al = () => fetch("/api/stats").then((r) => r.json()).then((d) => !iptal && setS(d)).catch(() => {});
    al();
    const t = setInterval(al, 30000);
    window.addEventListener("havuz-degisti", al);
    return () => { iptal = true; clearInterval(t); window.removeEventListener("havuz-degisti", al); };
  }, [path]);
  return s;
}
