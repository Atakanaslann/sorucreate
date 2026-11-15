"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, CornerDownLeft, FileText, Image as ImageIcon, Search } from "lucide-react";
import clsx from "clsx";
import type { Soru } from "@/lib/types";
import { DURUM_ETIKET } from "@/lib/types";
import { NAV } from "./nav";

type Oge =
  | { tip: "sayfa"; href: string; label: string; aciklama: string; icon: (typeof NAV)[number]["icon"] }
  | { tip: "soru"; soru: Soru };

export function CommandPalette() {
  const router = useRouter();
  const [acik, setAcik] = useState(false);
  const [q, setQ] = useState("");
  const [sorular, setSorular] = useState<Soru[]>([]);
  const [sec, setSec] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ac = () => setAcik(true);
    const key = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      const yaziyor = t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.tagName === "SELECT" || t.isContentEditable;
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") { e.preventDefault(); setAcik((a) => !a); }
      else if (e.key === "/" && !yaziyor) { e.preventDefault(); setAcik(true); }
    };
    window.addEventListener("palet", ac);
    window.addEventListener("keydown", key);
    return () => { window.removeEventListener("palet", ac); window.removeEventListener("keydown", key); };
  }, []);

  useEffect(() => {
    if (!acik) return;
    setQ(""); setSec(0);
    setTimeout(() => inputRef.current?.focus(), 10);
    fetch("/api/questions").then((r) => r.json()).then(setSorular).catch(() => {});
  }, [acik]);

  const ogeler = useMemo<Oge[]>(() => {
    const n = q.toLocaleLowerCase("tr-TR").trim();
    const sayfalar: Oge[] = NAV.filter((x) => !n || x.label.toLocaleLowerCase("tr-TR").includes(n)).map((x) => ({ tip: "sayfa", href: x.href, label: x.label, aciklama: x.aciklama, icon: x.icon }));
    const s: Oge[] = sorular
      .filter((x) => !n || `${x.id} ${x.kok} ${x.senaryo} ${x.unite} ${x.kazanimKodu} ${x.ders}`.toLocaleLowerCase("tr-TR").includes(n))
      .slice(0, 8)
      .map((soru) => ({ tip: "soru", soru }));
    return [...sayfalar, ...s];
  }, [q, sorular]);

  useEffect(() => { setSec(0); }, [q]);
  useEffect(() => {
    listRef.current?.querySelector(`[data-i="${sec}"]`)?.scrollIntoView({ block: "nearest" });
  }, [sec]);

  const git = (o: Oge) => {
    setAcik(false);
    router.push(o.tip === "sayfa" ? o.href : `/soru/${o.soru.id}`);
  };

  if (!acik) return null;
  const sayfaSayisi = ogeler.filter((o) => o.tip === "sayfa").length;

  return (
    <div className="no-print fixed inset-0 z-[80] flex items-start justify-center px-4 pt-[12vh]" onMouseDown={() => setAcik(false)}>
      <div className="absolute inset-0 bg-[#0b0d14]/45 backdrop-blur-sm" style={{ animation: "fade .2s both" }} />
      <div
        className="pop relative w-full max-w-xl overflow-hidden rounded-[22px] border border-line-2 bg-card shadow-[0_40px_80px_-20px_rgba(13,16,23,.5)]"
        onMouseDown={(e) => e.stopPropagation()}
        onKeyDown={(e) => {
          if (e.key === "Escape") setAcik(false);
          else if (e.key === "ArrowDown") { e.preventDefault(); setSec((s) => Math.min(ogeler.length - 1, s + 1)); }
          else if (e.key === "ArrowUp") { e.preventDefault(); setSec((s) => Math.max(0, s - 1)); }
          else if (e.key === "Enter" && ogeler[sec]) { e.preventDefault(); git(ogeler[sec]); }
        }}
      >
        <div className="flex items-center gap-3 border-b border-line px-5">
          <Search size={18} className="text-muted" />
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Soru ID'si, metin, kazanım ya da sayfa…"
            className="h-14 flex-1 bg-transparent text-[15px] outline-none placeholder:text-muted"
          />
          <span className="kbd">esc</span>
        </div>
        <div ref={listRef} className="max-h-[52vh] overflow-y-auto p-2">
          {ogeler.length === 0 && <p className="px-4 py-10 text-center text-sm text-muted">Sonuç yok.</p>}
          {ogeler.map((o, i) => (
            <div key={o.tip === "sayfa" ? o.href : o.soru.id}>
              {(i === 0 && sayfaSayisi > 0) && <p className="px-3 pb-1 pt-2 text-[10.5px] font-semibold uppercase tracking-[.16em] text-muted">Sayfalar</p>}
              {i === sayfaSayisi && <p className="px-3 pb-1 pt-3 text-[10.5px] font-semibold uppercase tracking-[.16em] text-muted">Sorular</p>}
              <button
                data-i={i}
                onMouseEnter={() => setSec(i)}
                onClick={() => git(o)}
                className={clsx("flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition", sec === i ? "bg-paper" : "")}
              >
                {o.tip === "sayfa" ? (
                  <>
                    <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-ink text-gold-2"><o.icon size={15} /></span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-semibold">{o.label}</span>
                      <span className="block truncate text-xs text-muted">{o.aciklama}</span>
                    </span>
                  </>
                ) : (
                  <>
                    <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-line bg-card text-muted">
                      {o.soru.tur === "gorselli" ? <ImageIcon size={15} /> : <FileText size={15} />}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-2">
                        <span className="font-mono text-[11.5px] font-semibold text-ink-2">{o.soru.id}</span>
                        <span className="text-[11px] text-muted">{DURUM_ETIKET[o.soru.durum]}</span>
                      </span>
                      <span className="block truncate text-[13px] text-ink-2">{o.soru.kok.replace(/\*\*/g, "")}</span>
                    </span>
                  </>
                )}
                {sec === i ? <CornerDownLeft size={14} className="text-muted" /> : <ArrowRight size={14} className="text-transparent" />}
              </button>
            </div>
          ))}
        </div>
        <div className="flex items-center gap-4 border-t border-line bg-paper/60 px-5 py-2.5 text-[11px] text-muted">
          <span className="flex items-center gap-1.5"><span className="kbd">↑</span><span className="kbd">↓</span> gezin</span>
          <span className="flex items-center gap-1.5"><span className="kbd">↵</span> aç</span>
          <span className="ml-auto flex items-center gap-1.5"><span className="kbd">/</span> her yerden aç</span>
        </div>
      </div>
    </div>
  );
}
