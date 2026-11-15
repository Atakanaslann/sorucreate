"use client";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Search, X } from "lucide-react";
import { MUFREDAT } from "@/data/curriculum";
import { SINAVLAR, DURUM_ETIKET } from "@/lib/types";
import type { Sinav } from "@/lib/types";

export function PoolFilters() {
  const router = useRouter();
  const sp = useSearchParams();
  const [q, setQ] = useState(sp.get("q") ?? "");
  const get = (k: string) => sp.get(k) ?? "";
  const set = (k: string, v: string) => {
    const n = new URLSearchParams(sp.toString());
    if (v) n.set(k, v); else n.delete(k);
    if (k === "sinav") { n.delete("ders"); n.delete("unite"); }
    if (k === "ders") n.delete("unite");
    router.replace(`/havuz?${n.toString()}`);
  };
  useEffect(() => {
    const t = setTimeout(() => { if ((sp.get("q") ?? "") !== q) set("q", q); }, 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  const sinav = get("sinav") as Sinav | "";
  const dersler = sinav ? MUFREDAT[sinav] : [];
  const uniteler = dersler.find((d) => d.ad === get("ders"))?.uniteler ?? [];
  const hasAny = Array.from(sp.keys()).length > 0;

  return (
    <div className="card rise rise-1 grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-4">
      <div className="relative sm:col-span-2">
        <Search size={16} className="pointer-events-none absolute left-3.5 top-[14px] text-muted" />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="ID, metin, kazanım ara…" className="field !pl-10" />
      </div>
      <select className="field" value={sinav} onChange={(e) => set("sinav", e.target.value)}>
        <option value="">Tüm sınavlar</option>
        {SINAVLAR.map((s) => <option key={s}>{s}</option>)}
      </select>
      <select className="field" value={get("ders")} disabled={!sinav} onChange={(e) => set("ders", e.target.value)}>
        <option value="">Tüm dersler</option>
        {dersler.map((d) => <option key={d.ad}>{d.ad}</option>)}
      </select>
      <select className="field" value={get("unite")} disabled={!uniteler.length} onChange={(e) => set("unite", e.target.value)}>
        <option value="">Tüm üniteler</option>
        {uniteler.map((u) => <option key={u.ad}>{u.ad}</option>)}
      </select>
      <select className="field" value={get("zorluk")} onChange={(e) => set("zorluk", e.target.value)}>
        <option value="">Orta + zor</option>
        <option value="orta">Orta</option>
        <option value="zor">Zor</option>
      </select>
      <select className="field" value={get("tur")} onChange={(e) => set("tur", e.target.value)}>
        <option value="">Tüm türler</option>
        <option value="gorselli">Yeni nesil (görselli)</option>
        <option value="gorselsiz">Görselsiz</option>
      </select>
      <div className="flex gap-2">
        <select className="field" value={get("durum")} onChange={(e) => set("durum", e.target.value)}>
          <option value="">Aktif durumlar</option>
          {Object.entries(DURUM_ETIKET).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        {hasAny && (
          <button className="btn shrink-0 !px-3" title="Filtreleri temizle" onClick={() => { setQ(""); router.replace("/havuz"); }}>
            <X size={16} />
          </button>
        )}
      </div>
    </div>
  );
}
