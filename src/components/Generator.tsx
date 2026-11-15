"use client";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import clsx from "clsx";
import { AlertTriangle, ArrowRight, CheckCircle2, Crown, ImageIcon, Loader2, MessagesSquare, Sparkles, Type, Zap } from "lucide-react";
import { MUFREDAT } from "@/data/curriculum";
import { GUNLUK_HEDEF, SINAVLAR } from "@/lib/types";
import type { Sinav, Soru, SoruTuru, UretimIsi, Zorluk } from "@/lib/types";
import { QuestionBody } from "./QuestionBody";
import { ChatHandoff } from "./ChatHandoff";

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

type Govde = { sinav: Sinav; ders: string; kazanimKodu: string; zorluk: Zorluk; tur: SoruTuru; adet: number; tema?: string };

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
  const [mod, setMod] = useState<"abonelik" | "sohbet" | "api">("abonelik");
  const [uretici, setUretici] = useState<{ dahili: boolean; claude: string | null; depo: string } | null>(null);
  const [aktifIs, setAktifIs] = useState<UretimIsi | null>(null);
  const [saniye, setSaniye] = useState(0);
  const poll = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    fetch("/api/jobs").then((r) => r.json()).then((d) => setUretici({ dahili: d.dahili, claude: d.claude, depo: d.depo })).catch(() => undefined);
    return () => { if (poll.current) clearInterval(poll.current); };
  }, []);

  function izle(isId: string) {
    const bas = Date.now();
    if (poll.current) clearInterval(poll.current);
    poll.current = setInterval(async () => {
      setSaniye(Math.round((Date.now() - bas) / 1000));
      const d = await fetch(`/api/jobs?id=${isId}`).then((r) => r.json()).catch(() => null);
      if (!d?.is) return;
      setAktifIs(d.is);
      if (d.is.durum === "tamam" || d.is.durum === "hata") {
        clearInterval(poll.current!);
        poll.current = null;
        setBusy(false);
        if (d.is.durum === "hata") setHata(d.is.hata ?? "Üretim başarısız");
        else setSonuclar((p) => [...(d.sorular as Soru[]).map((soru) => ({ soru, benzerler: [] })), ...p]);
      }
    }, 3000);
  }

  async function abonelikleUret() {
    setBusy(true); setHata(null); setSaniye(0);
    try {
      const res = await fetch("/api/jobs", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(govde()) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "İş oluşturulamadı");
      setAktifIs(data.is);
      izle(data.is.id);
    } catch (e) {
      setHata((e as Error).message);
      setBusy(false);
    }
  }
  const [prompt, setPrompt] = useState<string | null>(null);
  const [promptGovde, setPromptGovde] = useState<Govde | null>(null);
  const govde = (): Govde => ({ sinav, ders, kazanimKodu: kazanim, zorluk, tur, adet, tema: tema || undefined });

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

  async function promptHazirla() {
    setBusy(true); setHata(null);
    try {
      const res = await fetch("/api/import", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...govde(), asama: "prompt" }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Prompt hazırlanamadı");
      setPrompt(data.prompt);
      setPromptGovde(govde());
    } catch (e) {
      setHata((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function iceAktar(metin: string, arac: string) {
    const res = await fetch("/api/import", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...(promptGovde ?? govde()), asama: "ice-aktar", metin, kaynakArac: arac }) });
    const data = await res.json();
    if (!res.ok) return data.error ?? "İçe aktarılamadı";
    setSonuclar((p) => [...data.sorular, ...p]);
    return null;
  }

  async function uret() {
    if (mod === "abonelik") return abonelikleUret();
    if (mod === "sohbet") return promptHazirla();
    setBusy(true); setHata(null);
    try {
      const res = await fetch("/api/generate", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(govde()) });
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
          Seçtiğin kazanıma göre yapay zekâ soruyu, adım adım çözümü, çeldirici gerekçelerini ve yeni nesil sorularda görsel promptunu + kesin ölçülü SVG figürü birlikte hazırlar.
          Bugün kalan: <strong>{kalanG}</strong> görselli, <strong>{kalanM}</strong> görselsiz.
        </p>
      </header>

      {!ai && mod === "api" && (
        <div className="card flex items-start gap-3 !border-[#f0d2a8] !bg-gold-soft p-5 text-sm text-[#7a5512]">
          <AlertTriangle size={18} className="mt-0.5 shrink-0" />
          <div>
            <strong>Claude API anahtarı tanımlı değil.</strong> Proje kökünde <code className="font-mono">.env.local</code> dosyasına
            <code className="mx-1 rounded bg-white/70 px-1.5 py-0.5 font-mono">ANTHROPIC_API_KEY=...</code> ekleyip sunucuyu yeniden başlatın. Ya da “Sohbet aracıyla” moduna geçip Claude / ChatGPT / Gemini aboneliğinizle üretin.
          </div>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[400px_minmax(0,1fr)]">
        <form className="card h-fit space-y-5 p-6" onSubmit={(e) => { e.preventDefault(); uret(); }}>
          <div className="space-y-2">
            <p className="label">Üretim yolu</p>
            <Segment
              value={mod}
              onChange={(m) => { setMod(m); setPrompt(null); }}
              options={[
                { v: "abonelik", label: <><Crown size={15} /> Abonelik</> },
                { v: "sohbet", label: <><MessagesSquare size={15} /> Kopyala</> },
                ...(ai ? [{ v: "api" as const, label: <><Zap size={15} /> API</> }] : []),
              ]}
            />
            <p className="text-xs text-muted">
              {mod === "abonelik" && "Tek tık: Claude Code, Claude Pro/Max aboneliğinle soruyu yazar. API ücreti yok."}
              {mod === "sohbet" && "Prompt kopyalanır; Claude.ai / ChatGPT / Gemini yanıtı geri yapıştırılır."}
              {mod === "api" && "ANTHROPIC_API_KEY ile otomatik üretim (ücretli)."}
            </p>
            {mod === "abonelik" && uretici?.dahili && !uretici.claude && (
              <p className="rounded-xl bg-gold-soft p-3 text-xs leading-relaxed text-[#7a5512]">
                Bu bilgisayarda Claude Code bulunamadı. Terminalde <code className="font-mono">npm i -g @anthropic-ai/claude-code</code>, ardından <code className="font-mono">claude</code> yazıp aboneliğinle giriş yap.
              </p>
            )}
            {mod === "abonelik" && uretici?.dahili && uretici.claude && (
              <p className="flex items-center gap-1.5 text-xs text-ok"><CheckCircle2 size={13} /> Claude Code {uretici.claude.split(" ")[0]} hazır</p>
            )}
          </div>
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
              <select className="field" value={adet} onChange={(e) => setAdet(Number(e.target.value))}>{(mod === "api" ? [1, 2, 3, 4, 5] : [1, 2, 3, 5, 10]).map((n) => <option key={n}>{n}</option>)}</select>
            </label>
            <button className="btn btn-primary flex-1" disabled={busy || (mod === "api" && !ai)}>
              {busy ? <><Loader2 size={16} className="animate-spin" /> {mod === "sohbet" ? "Hazırlanıyor…" : "Üretiliyor…"}</> : mod !== "sohbet" ? <><Sparkles size={16} /> Üret</> : <><MessagesSquare size={16} /> Promptu hazırla</>}
            </button>
          </div>
          {busy && mod !== "sohbet" && <p className="text-xs text-muted">Sorular yazılıp kendi içinde çözülür; soru başına yaklaşık 30–90 sn.</p>}
        </form>

        <div className="space-y-5">
          {hata && <div className="card flex items-start gap-3 !border-[#efc7c3] !bg-bad-soft p-4 text-sm text-bad"><AlertTriangle size={18} /> {hata}</div>}
          {mod === "abonelik" && aktifIs && busy && (
            <div className="card flex items-start gap-4 p-6">
              <Loader2 className="mt-0.5 shrink-0 animate-spin text-gold" />
              <div className="space-y-1">
                <p className="font-display text-lg">
                  {aktifIs.durum === "kuyrukta" ? "Sırada, üretici bekleniyor…" : "Claude soruları yazıyor ve kendi içinde çözüyor…"}
                </p>
                <p className="text-sm text-muted">{saniye} sn · {aktifIs.istek.tip === "uret" ? `${aktifIs.istek.adet} soru` : "revizyon"} · Sayfadan ayrılabilirsin; sorular havuza kendiliğinden düşer.</p>
                {aktifIs.durum === "kuyrukta" && saniye > 20 && (
                  <p className="pt-2 text-sm text-[#7a5512]">
                    {uretici?.dahili ? "Üretici başlamadı. Sunucuyu yeniden başlatmayı dene." : "Üretici çalışmıyor olabilir: bilgisayarında proje klasöründe npm run worker komutu açık mı?"}
                  </p>
                )}
              </div>
            </div>
          )}
          {mod === "sohbet" && prompt && (
            <ChatHandoff prompt={prompt} baslik={`${promptGovde?.adet ?? adet} soru · ${promptGovde?.kazanimKodu ?? kazanim}`} onImport={iceAktar} />
          )}
          {sonuclar.length === 0 && !busy && !(mod === "sohbet" && prompt) && (
            <div className="card grid min-h-80 place-items-center p-10 text-center">
              <div>
                <Sparkles className="mx-auto text-gold" />
                <p className="mt-3 font-display text-xl">Üretilen sorular burada görünecek</p>
                <p className="mt-1 text-sm text-muted">Hepsi havuza “Onay bekliyor” olarak düşer; her birini Olmuş / Olmamış ile değerlendirirsin.</p>
              </div>
            </div>
          )}
          {busy && mod !== "sohbet" && Array.from({ length: Math.min(adet, 3) }).map((_, i) => (
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
