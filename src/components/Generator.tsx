"use client";
import Link from "next/link";
import { useMemo, useState } from "react";
import clsx from "clsx";
import { AlertTriangle, ArrowRight, ImageIcon, Loader2, Sparkles, Type } from "lucide-react";
import { MUFREDAT } from "@/data/curriculum";
import { GUNLUK_HEDEF, SINAVLAR } from "@/lib/types";
import type { Sinav, Soru, SoruTuru, Zorluk } from "@/lib/types";
import { QuestionBody } from "./QuestionBody";

const TEMALAR = [
  "Üst üste dizilmiş karton bardaklar",
  "Yırtık kâğıtta okunamayan semboller",
  "Futbol topunun hızı",
  "Kitaplık rafı ve klasörler",
  "Fayans / karo deseni",
  "Kafeterya menüsü",
  "Toplu taşıma saatleri",
  "Terazi ve ağırlıklar",
  "Akıllı telefon şarj grafiği",
  "Bahçe sulama düzeni",
];

function Segment<T extends string>({ value, onChange, options }: { value: T; onChange: (v: T) => void; options: { v: T; label: React.ReactNode }[] }) {
  return (
    <div className="flex rounded-xl border border-line bg-paper p-1">
      {options.map((o) => (
        <button key={o.v} type="button" onClick={() => onChange(o.v)} className={clsx("flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold transition", value === o.v ? "bg-card text-ink shadow-sm" : "text-muted hover:text-ink")}>
          {o.label}
        </button>
      ))}
    </div>
  );
}

interface Sonuc { soru: Soru; benzerler: { id: string; skor: number }[] }

export function Generator({ ai, bugun }: { ai: boolean; bugun: { gorselli: number; gorselsiz: number } }) {
  const [sinav, setSinav] = useState<Sinav>("LGS");
  const [ders, setDers] = useState(MUFREDAT.LGS[0].ad);
  const [unite, setUnite] = useState(MUFREDAT.LGS[0].uniteler[0].ad);
  const [kazanim, setKazanim] = useState(MUFREDAT.LGS[0].uniteler[0].kazanimlar[0].kod);
  const [zorluk, setZorluk] = useState<Zorluk>("zor");
  const [tur, setTur] = useState<SoruTuru>("gorselli");
  const [adet, setAdet] = useState(1);
  const [tema, setTema] = useState("");
  const [busy, setBusy] = useState(false);
  const [hata, setHata] = useState<string | null>(null);
  const [sonuclar, setSonuclar] = useState<Sonuc[]>([]);

  const dersler = MUFREDAT[sinav];
  const uniteler = useMemo(() => dersler.find((d) => d.ad === ders)?.uniteler ?? [], [dersler, ders]);
  const kazanimlar = uniteler.find((u) => u.ad === unite)?.kazanimlar ?? [];
  const secili = kazanimlar.find((k) => k.kod === kazanim);

  const chSinav = (s: Sinav) => {
    setSinav(s);
    const d = MUFREDAT[s][0];
    setDers(d.ad); setUnite(d.uniteler[0].ad); setKazanim(d.uniteler[0].kazanimlar[0].kod);
  };
  const chDers = (n: string) => {
    setDers(n);
    const d = dersler.find((x) => x.ad === n)!;
    setUnite(d.uniteler[0].ad); setKazanim(d.uniteler[0].kazanimlar[0].kod);
  };
  const chUnite = (n: string) => {
    setUnite(n);
    setKazanim(uniteler.find((u) => u.ad === n)!.kazanimlar[0].kod);
  };

  async function uret() {
    setBusy(true); setHata(null);
    try {
      const res = await fetch("/api/generate", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ sinav, ders, kazanimKodu: kazanim, zorluk, tur, adet, tema: tema || undefined }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Üretim başarısız");
      setSonuclar((p) => [...data.sorular, ...p]);
      if (data.hatalar?.length) setHata(`${data.hatalar.length} soru üretilemedi: ${data.hatalar[0]}`);
    } catch (e) {
      setHata((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  const kalanG = Math.max(0, GUNLUK_HEDEF.gorselli - bugun.gorselli);
  const kalanM = Math.max(0, GUNLUK_HEDEF.gorselsiz - bugun.gorselsiz);

  return (
    <div className="mx-auto max-w-6xl space-y-8 pb-20">
      <header>
        <p className="label">Soru üret</p>
        <h1 className="mt-2 font-display text-4xl tracking-tight">Kazanımdan soruya</h1>
        <p className="mt-2 max-w-2xl text-ink-2">
          Claude, seçtiğin kazanıma göre soruyu, adım adım çözümü, çeldirici gerekçelerini ve yeni nesil sorularda görsel promptunu + kesin ölçülü SVG figürü birlikte hazırlar.
          Bugün kalan: <strong>{kalanG}</strong> görselli, <strong>{kalanM}</strong> görselsiz.
        </p>
      </header>

      {!ai && (
        <div className="card flex items-start gap-3 !border-[#f0d2a8] !bg-gold-soft p-5 text-sm text-[#7a5512]">
          <AlertTriangle size={18} className="mt-0.5 shrink-0" />
          <div>
            <strong>Claude API anahtarı tanımlı değil.</strong> Proje kökünde <code className="font-mono">.env.local</code> dosyasına
            <code className="mx-1 rounded bg-white/70 px-1.5 py-0.5 font-mono">ANTHROPIC_API_KEY=...</code> ekleyip sunucuyu yeniden başlatın. O zamana kadar havuzdaki örnek sorularla akışı deneyebilirsiniz.
          </div>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[400px_minmax(0,1fr)]">
        <form className="card h-fit space-y-5 p-6" onSubmit={(e) => { e.preventDefault(); uret(); }}>
          <div className="space-y-2">
            <p className="label">Sınav</p>
            <Segment value={sinav} onChange={chSinav} options={SINAVLAR.map((s) => ({ v: s, label: s }))} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <label className="space-y-2"><span className="label">Ders</span>
              <select className="field" value={ders} onChange={(e) => chDers(e.target.value)}>{dersler.map((d) => <option key={d.ad}>{d.ad}</option>)}</select>
            </label>
            <label className="space-y-2"><span className="label">Ünite</span>
              <select className="field" value={unite} onChange={(e) => chUnite(e.target.value)}>{uniteler.map((u) => <option key={u.ad}>{u.ad}</option>)}</select>
            </label>
          </div>
          <label className="block space-y-2"><span className="label">Kazanım</span>
            <select className="field" value={kazanim} onChange={(e) => setKazanim(e.target.value)}>
              {kazanimlar.map((k) => <option key={k.kod} value={k.kod}>{k.kod} — {k.metin.slice(0, 60)}{k.metin.length > 60 ? "…" : ""}</option>)}
            </select>
          </label>
          {secili && (
            <p className="rounded-xl bg-paper p-3 text-xs leading-relaxed text-ink-2">
              {secili.metin}
              {!secili.dogrulandi && <span className="mt-1 block text-[#8a6418]">Bu kazanım metni resmi programla henüz satır satır doğrulanmadı.</span>}
            </p>
          )}
          <div className="space-y-2"><p className="label">Zorluk</p>
            <Segment value={zorluk} onChange={setZorluk} options={[{ v: "orta", label: "Orta" }, { v: "zor", label: "Zor" }]} />
          </div>
          <div className="space-y-2"><p className="label">Tür</p>
            <Segment value={tur} onChange={setTur} options={[{ v: "gorselli", label: <><ImageIcon size={15} /> Yeni nesil</> }, { v: "gorselsiz", label: <><Type size={15} /> Görselsiz</> }]} />
          </div>
          <div className="space-y-2">
            <p className="label">Bağlam / tema (isteğe bağlı)</p>
            <input className="field" value={tema} onChange={(e) => setTema(e.target.value)} placeholder="ör. üst üste dizilmiş karton bardaklar" />
            <div className="flex flex-wrap gap-1.5">
              {TEMALAR.map((t) => <button type="button" key={t} onClick={() => setTema(t)} className="chip hover:!bg-gold-soft">{t}</button>)}
            </div>
          </div>
          <div className="flex items-end gap-3">
            <label className="w-24 space-y-2"><span className="label">Adet</span>
              <select className="field" value={adet} onChange={(e) => setAdet(Number(e.target.value))}>{[1, 2, 3, 4, 5].map((n) => <option key={n}>{n}</option>)}</select>
            </label>
            <button className="btn btn-primary flex-1" disabled={busy || !ai}>
              {busy ? <><Loader2 size={16} className="animate-spin" /> Üretiliyor…</> : <><Sparkles size={16} /> Üret</>}
            </button>
          </div>
          {busy && <p className="text-xs text-muted">Her soru bağımsız olarak yazılıp kendi içinde çözülür; soru başına 30–90 sn sürebilir.</p>}
        </form>

        <div className="space-y-5">
          {hata && <div className="card flex items-start gap-3 !border-[#efc7c3] !bg-bad-soft p-4 text-sm text-bad"><AlertTriangle size={18} /> {hata}</div>}
          {sonuclar.length === 0 && !busy && (
            <div className="card grid min-h-80 place-items-center p-10 text-center">
              <div>
                <Sparkles className="mx-auto text-gold" />
                <p className="mt-3 font-display text-xl">Üretilen sorular burada görünecek</p>
                <p className="mt-1 text-sm text-muted">Hepsi havuza “Onay bekliyor” olarak düşer; her birini Olmuş / Olmamış ile değerlendirirsin.</p>
              </div>
            </div>
          )}
          {busy && Array.from({ length: adet }).map((_, i) => (
            <div key={i} className="card animate-pulse space-y-3 p-6"><div className="h-3 w-1/3 rounded bg-line" /><div className="h-3 w-full rounded bg-line" /><div className="h-3 w-5/6 rounded bg-line" /><div className="h-40 rounded-xl bg-paper" /></div>
          ))}
          {sonuclar.map(({ soru, benzerler }) => (
            <article key={soru.id} className="card overflow-hidden">
              <div className="flex items-center justify-between border-b border-line bg-[#fbfaf6] px-5 py-3">
                <span className="font-mono text-xs font-semibold">{soru.id}</span>
                <Link href={`/soru/${soru.id}`} className="flex items-center gap-1 text-sm font-semibold">Değerlendir <ArrowRight size={14} /></Link>
              </div>
              {benzerler.length > 0 && (
                <div className="flex items-center gap-2 border-b border-line bg-gold-soft px-5 py-2 text-xs text-[#7a5512]">
                  <AlertTriangle size={14} /> {benzerler[0].id} ile %{Math.round(benzerler[0].skor * 100)} benzer.
                </div>
              )}
              <div className="p-6"><QuestionBody soru={soru} /></div>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}
