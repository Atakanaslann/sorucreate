"use client";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowDown, ArrowUp, Printer, Shuffle, Trash2, Wand2, X } from "lucide-react";
import { MUFREDAT } from "@/data/curriculum";
import { SINAVLAR } from "@/lib/types";
import type { Sinav, Soru } from "@/lib/types";
import { QuestionBody, Rich } from "./QuestionBody";
import { useDeneme } from "./useDeneme";

export function Deneme() {
  const { ids, save } = useDeneme();
  const [tumu, setTumu] = useState<Soru[]>([]);
  const [baslik, setBaslik] = useState("Deneme Sınavı 1");
  const [cozumler, setCozumler] = useState(true);
  const [oto, setOto] = useState({ sinav: "LGS" as Sinav, ders: "", adet: 10, zorOran: 40, sadeceOnayli: true });

  useEffect(() => {
    fetch("/api/questions").then((r) => r.json()).then(setTumu);
  }, []);

  const secili = useMemo(() => ids.map((id) => tumu.find((s) => s.id === id)).filter(Boolean) as Soru[], [ids, tumu]);

  const move = (i: number, d: number) => {
    const n = [...ids];
    const j = i + d;
    if (j < 0 || j >= n.length) return;
    [n[i], n[j]] = [n[j], n[i]];
    save(n);
  };

  const otoCek = () => {
    const havuz = tumu.filter((s) => s.sinav === oto.sinav && (!oto.ders || s.ders === oto.ders) && (!oto.sadeceOnayli || s.durum === "onaylandi") && !ids.includes(s.id));
    const karistir = <T,>(a: T[]) => [...a].sort(() => Math.random() - 0.5);
    const zorSay = Math.round((oto.adet * oto.zorOran) / 100);
    const zor = karistir(havuz.filter((s) => s.zorluk === "zor")).slice(0, zorSay);
    const orta = karistir(havuz.filter((s) => s.zorluk === "orta")).slice(0, oto.adet - zor.length);
    save([...ids, ...[...orta, ...zor].map((s) => s.id)]);
  };

  return (
    <div className="mx-auto max-w-6xl pb-20">
      <div className="no-print space-y-6">
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="label">Deneme oluştur</p>
            <h1 className="mt-2 font-display text-4xl tracking-tight">{secili.length} soruluk kitapçık</h1>
          </div>
          <div className="flex gap-2">
            {ids.length > 0 && <button className="btn" onClick={() => save([])}><Trash2 size={16} /> Temizle</button>}
            <button className="btn btn-primary" disabled={!secili.length} onClick={() => window.print()}><Printer size={16} /> Yazdır / PDF</button>
          </div>
        </header>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
          <section className="card p-5">
            <h2 className="mb-3 font-display text-lg">Sıralama</h2>
            {secili.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted">
                Henüz soru yok. <Link className="font-semibold text-ink underline" href="/havuz">Havuzdan</Link> “Denemeye ekle” ile seç ya da sağdan otomatik çek.
              </p>
            ) : (
              <ol className="divide-y divide-line">
                {secili.map((s, i) => (
                  <li key={s.id} className="flex items-center gap-3 py-2.5 text-sm">
                    <span className="w-6 font-display font-semibold">{i + 1}.</span>
                    <span className="w-36 shrink-0 font-mono text-xs text-muted">{s.id}</span>
                    <span className="min-w-0 flex-1 truncate">{s.kok}</span>
                    <span className="chip">{s.zorluk}</span>
                    <button className="p-1 text-muted hover:text-ink" onClick={() => move(i, -1)}><ArrowUp size={15} /></button>
                    <button className="p-1 text-muted hover:text-ink" onClick={() => move(i, 1)}><ArrowDown size={15} /></button>
                    <button className="p-1 text-muted hover:text-bad" onClick={() => save(ids.filter((x) => x !== s.id))}><X size={15} /></button>
                  </li>
                ))}
              </ol>
            )}
          </section>
          <aside className="space-y-6">
            <section className="card space-y-3 p-5">
              <h2 className="font-display text-lg">Ayarlar</h2>
              <label className="block space-y-1.5"><span className="label">Başlık</span><input className="field" value={baslik} onChange={(e) => setBaslik(e.target.value)} /></label>
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={cozumler} onChange={(e) => setCozumler(e.target.checked)} /> Çözüm kitapçığını ekle</label>
            </section>
            <section className="card space-y-3 p-5">
              <h2 className="flex items-center gap-2 font-display text-lg"><Wand2 size={17} /> Kurala göre çek</h2>
              <div className="grid grid-cols-2 gap-2">
                <select className="field" value={oto.sinav} onChange={(e) => setOto({ ...oto, sinav: e.target.value as Sinav, ders: "" })}>{SINAVLAR.map((s) => <option key={s}>{s}</option>)}</select>
                <select className="field" value={oto.ders} onChange={(e) => setOto({ ...oto, ders: e.target.value })}><option value="">Tüm dersler</option>{MUFREDAT[oto.sinav].map((d) => <option key={d.ad}>{d.ad}</option>)}</select>
              </div>
              <label className="block space-y-1.5"><span className="label">Soru sayısı: {oto.adet}</span><input type="range" min={1} max={40} value={oto.adet} onChange={(e) => setOto({ ...oto, adet: +e.target.value })} className="w-full accent-[#b8892f]" /></label>
              <label className="block space-y-1.5"><span className="label">Zor oranı: %{oto.zorOran}</span><input type="range" min={0} max={100} step={10} value={oto.zorOran} onChange={(e) => setOto({ ...oto, zorOran: +e.target.value })} className="w-full accent-[#b8892f]" /></label>
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={oto.sadeceOnayli} onChange={(e) => setOto({ ...oto, sadeceOnayli: e.target.checked })} /> Yalnızca onaylı sorular</label>
              <button className="btn w-full" onClick={otoCek}><Shuffle size={16} /> Havuzdan çek</button>
            </section>
          </aside>
        </div>
        {secili.length > 0 && <h2 className="pt-4 font-display text-2xl">Önizleme</h2>}
      </div>

      {secili.length > 0 && (
        <div className="mt-4 space-y-8 print:mt-0">
          <div className="print-page card p-8 print:border-0 print:p-0 print:shadow-none">
            <div className="mb-6 flex items-end justify-between border-b-2 border-ink pb-3">
              <h1 className="font-display text-2xl">{baslik}</h1>
              <span className="text-sm text-muted">{secili.length} soru · SoruCreate</span>
            </div>
            <div className="columns-1 gap-10 md:columns-2 print:columns-2 [column-rule:1px_solid_var(--line)]">
              {secili.map((s, i) => (
                <div key={s.id} className="avoid-break mb-8 break-inside-avoid">
                  <QuestionBody soru={s} numara={i + 1} compact />
                  <p className="mt-2 text-right font-mono text-[10px] text-muted">{s.id}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="print-page card p-8 print:border-0 print:p-0 print:shadow-none">
            <h2 className="mb-4 font-display text-xl">Cevap anahtarı</h2>
            <div className="grid grid-cols-5 gap-2 sm:grid-cols-10">
              {secili.map((s, i) => (
                <div key={s.id} className="rounded-lg border border-line px-2 py-1.5 text-center text-sm"><span className="text-muted">{i + 1}.</span> <strong>{s.dogruCevap}</strong></div>
              ))}
            </div>
          </div>
          {cozumler && (
            <div className="card p-8 print:border-0 print:p-0 print:shadow-none">
              <h2 className="mb-4 font-display text-xl">Çözümler</h2>
              <div className="space-y-5">
                {secili.map((s, i) => (
                  <div key={s.id} className="avoid-break text-sm">
                    <p className="font-semibold">{i + 1}. soru — Cevap {s.dogruCevap} <span className="font-mono text-xs font-normal text-muted">({s.id} · {s.kazanimKodu})</span></p>
                    <p className="mt-1 whitespace-pre-line text-ink-2"><Rich text={s.cozum} /></p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
