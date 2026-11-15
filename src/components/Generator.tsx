"use client";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import clsx from "clsx";
import { AlertTriangle, ArrowRight, CheckCircle2, Crown, ImageIcon, Loader2, MessagesSquare, Sparkles, Type, Zap } from "lucide-react";
import { MUFREDAT } from "@/data/curriculum";
import { GUNLUK_HEDEF, SINAVLAR } from "@/lib/types";
import type { Sinav, Soru, SoruTuru, UretimIsi, Zorluk } from "@/lib/types";
import { QuestionBody, ExamPaper } from "./QuestionBody";
import { toast } from "./toast";
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
    <div className="flex rounded-[14px] border border-line bg-paper-2/70 p-1 shadow-[inset_0_1px_2px_rgba(13,16,23,.05)]">
      {options.map((o) => (
        <button key={o.v} type="button" onClick={() => onChange(o.v)} className={clsx("flex flex-1 items-center justify-center gap-2 rounded-[10px] px-3 py-2 text-sm font-semibold transition duration-300", value === o.v ? "bg-card text-ink shadow-[0_1px_2px_rgba(13,16,23,.08),0_4px_12px_-4px_rgba(13,16,23,.15)]" : "text-muted hover:text-ink")}>
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
        if (d.is.durum === "hata") { setHata(d.is.hata ?? "Üretim başarısız"); toast("Üretim başarısız", "uyari", d.is.hata ?? undefined); }
        else { toast(`${d.sorular.length} soru havuza eklendi`, "ok", "İnceleme modunda değerlendirebilirsin."); window.dispatchEvent(new Event("havuz-degisti")); }
        if (d.is.durum === "tamam") setSonuclar((p) => [...(d.sorular as Soru[]).map((soru) => ({ soru, benzerler: [] })), ...p]);
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
    <div className="mx-auto max-w-[1180px] space-y-8 pb-20">
      <header className="rise flex flex-wrap items-end justify-between gap-6">
        <div>
        <p className="label">Soru üret</p>
        <h1 className="mt-2 font-display text-[42px] leading-[1.05] tracking-tight sm:text-[52px]">Kazanımdan <span className="italic text-gold">soruya.</span></h1>
        <p className="mt-3 max-w-2xl leading-relaxed text-ink-2">
          Seçtiğin kazanıma göre yapay zekâ soruyu, adım adım çözümü, çeldirici gerekçelerini ve yeni nesil sorularda görsel promptunu + kesin ölçülü SVG figürü birlikte hazırlar.
        </p>
        </div>
        <div className="flex gap-3">
          {[{ k: "Yeni nesil", v: kalanG, c: "from-[#f3dfae] to-[#b8873a]" }, { k: "Görselsiz", v: kalanM, c: "from-[#a9b6ff] to-[#2747c9]" }].map((x) => (
            <div key={x.k} className="card min-w-32 px-4 py-3">
              <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[.14em] text-muted"><span className={`h-2 w-2 rounded-full bg-gradient-to-br ${x.c}`} />{x.k}</div>
              <div className="tabular mt-1 font-display text-3xl leading-none">{x.v}<span className="ml-1 text-xs font-sans text-muted">kaldı</span></div>
            </div>
          ))}
        </div>
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

      <div className="grid gap-6 lg:grid-cols-[410px_minmax(0,1fr)]">
        <form className="card rise rise-1 h-fit space-y-6 p-6 lg:sticky lg:top-24" onSubmit={(e) => { e.preventDefault(); uret(); }}>
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
            <button className="btn btn-gold !h-[46px] flex-1 !text-[15px]" disabled={busy || (mod === "api" && !ai)}>
              {busy ? <><Loader2 size={16} className="animate-spin" /> {mod === "sohbet" ? "Hazırlanıyor…" : "Üretiliyor…"}</> : mod !== "sohbet" ? <><Sparkles size={16} /> Üret</> : <><MessagesSquare size={16} /> Promptu hazırla</>}
            </button>
          </div>
          {busy && mod !== "sohbet" && <p className="text-xs text-muted">Sorular yazılıp kendi içinde çözülür; soru başına yaklaşık 30–90 sn.</p>}
        </form>

        <div className="space-y-5">
          {hata && <div className="card flex items-start gap-3 !border-[#efc7c3] !bg-bad-soft p-4 text-sm text-bad"><AlertTriangle size={18} /> {hata}</div>}
          {mod === "abonelik" && aktifIs && busy && (
            <div className="ink-panel grain pop flex items-start gap-5 p-7">
              <span className="relative grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-white/[.06]">
                <span className="absolute inset-0 animate-ping rounded-2xl bg-gold-2/20" />
                <Sparkles className="relative text-gold-2" size={20} />
              </span>
              <div className="min-w-0 flex-1 space-y-1">
                <p className="font-display text-xl">
                  {aktifIs.durum === "kuyrukta" ? "Sırada, üretici bekleniyor…" : "Claude soruları yazıyor ve kendi içinde çözüyor…"}
                </p>
                <div className="my-3 h-1 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full bg-gradient-to-r from-[#b8873a] to-[#f3dfae] transition-[width] duration-1000" style={{ width: `${Math.min(95, (saniye / (75 * (aktifIs.istek.tip === "uret" ? aktifIs.istek.adet : 1))) * 100)}%` }} /></div>
                <p className="tabular text-sm text-white/55">{saniye} sn · {aktifIs.istek.tip === "uret" ? `${aktifIs.istek.adet} soru` : "revizyon"} · Sayfadan ayrılabilirsin; sorular havuza kendiliğinden düşer.</p>
                {aktifIs.durum === "kuyrukta" && saniye > 20 && (
                  <p className="pt-2 text-sm text-gold-2">
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
            <div className="card rise rise-2 relative grid min-h-[420px] place-items-center overflow-hidden p-10 text-center">
              <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,rgba(230,201,138,.18),transparent_60%)]" />
              <div className="relative">
                <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-ink text-gold-2 shadow-[0_14px_30px_-10px_rgba(13,16,23,.6)]"><Sparkles size={22} /></span>
                <p className="mt-5 font-display text-2xl tracking-tight">Üretilen sorular burada görünecek</p>
                <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-muted">Hepsi havuza “Onay bekliyor” olarak düşer; her birini Olmuş / Olmamış ile değerlendirirsin.</p>
              </div>
            </div>
          )}
          {busy && mod !== "sohbet" && Array.from({ length: Math.min(adet, 3) }).map((_, i) => (
            <div key={i} className="card space-y-3 p-7"><div className="skeleton h-3 w-1/3" /><div className="skeleton h-3 w-full" /><div className="skeleton h-3 w-5/6" /><div className="skeleton h-44 !rounded-2xl" /><div className="grid grid-cols-2 gap-2"><div className="skeleton h-8" /><div className="skeleton h-8" /><div className="skeleton h-8" /><div className="skeleton h-8" /></div></div>
          ))}
          {sonuclar.map(({ soru, benzerler }) => (
            <div key={soru.id} className="pop space-y-2">
              {benzerler.length > 0 && (
                <div className="flex items-center gap-2 rounded-xl bg-gold-soft px-4 py-2 text-xs text-[#7a5512]">
                  <AlertTriangle size={14} /> {benzerler[0].id} ile %{Math.round(benzerler[0].skor * 100)} benzer.
                </div>
              )}
              <ExamPaper
                ust={<>
                  <span className="flex items-center gap-2"><span className="rounded-md bg-ink px-2 py-0.5 font-mono tracking-normal text-white">{soru.id}</span>{soru.zorluk === "zor" ? "Zor" : "Orta"}</span>
                  <Link href={`/soru/${soru.id}`} className="flex items-center gap-1 tracking-normal text-ink hover:text-gold">Değerlendir <ArrowRight size={13} /></Link>
                </>}
              >
                <QuestionBody soru={soru} />
              </ExamPaper>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
