"use client";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import clsx from "clsx";
import { ArrowLeft, ArrowRight, Check, Eye, Keyboard, Loader2, PartyPopper, Sparkles, ThumbsDown, ThumbsUp, Trash2, X } from "lucide-react";
import type { Soru, OlmamisNedeni } from "@/lib/types";
import { OLMAMIS_NEDENLERI } from "@/lib/types";
import { QuestionBody, Rich, ExamPaper } from "./QuestionBody";
import { TurBadge, ZorlukBadge } from "./Badges";
import { toast } from "./toast";

type Karar = "olmus" | "revize" | "kaldir";

const KARAR_STIL: Record<Karar, { t: string; c: string }> = {
  olmus: { t: "Olmuş", c: "bg-ok text-white" },
  revize: { t: "Revizeye", c: "bg-blue text-white" },
  kaldir: { t: "Kaldırıldı", c: "bg-bad text-white" },
};

export function Inceleme({ sorular }: { sorular: Soru[] }) {
  const [i, setI] = useState(0);
  const [kararlar, setKararlar] = useState<Record<string, Karar>>({});
  const [secim, setSecim] = useState<string | null>(null);
  const [goster, setGoster] = useState(false);
  const [panel, setPanel] = useState(false);
  const [nedenler, setNedenler] = useState<OlmamisNedeni[]>([]);
  const [not, setNot] = useState("");
  const [busy, setBusy] = useState(false);

  const s = sorular[i];
  const bitti = sorular.length > 0 && Object.keys(kararlar).length === sorular.length;
  const sayac = Object.values(kararlar).reduce<Record<Karar, number>>((a, k) => ({ ...a, [k]: a[k] + 1 }), { olmus: 0, revize: 0, kaldir: 0 });

  const git = useCallback((n: number) => {
    setI(Math.max(0, Math.min(sorular.length - 1, n)));
    setSecim(null); setGoster(false); setPanel(false); setNedenler([]); setNot("");
  }, [sorular.length]);

  const sonraki = useCallback((k: Record<string, Karar>) => {
    for (let d = 1; d <= sorular.length; d++) {
      const j = (i + d) % sorular.length;
      if (!k[sorular[j].id]) return git(j);
    }
  }, [i, sorular, git]);

  const karar = useCallback(async (tip: Karar) => {
    if (!s || busy) return;
    if (tip !== "olmus" && nedenler.length + not.trim().length === 0 && tip === "revize") {
      setPanel(true);
      return;
    }
    setBusy(true);
    try {
      const body = tip === "olmus" ? { action: "olmus" } : { action: "olmamis", nedenler, not, aksiyon: tip };
      const res = await fetch(`/api/questions/${s.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const data = await res.json();
      if (!res.ok) { toast(data.error ?? "İşlem başarısız", "uyari"); return; }
      const k = { ...kararlar, [s.id]: tip };
      setKararlar(k);
      window.dispatchEvent(new Event("havuz-degisti"));
      toast(
        tip === "olmus" ? `${s.id} onaylandı` : tip === "kaldir" ? `${s.id} kaldırıldı` : `${s.id} revizeye gönderildi`,
        tip === "olmus" ? "ok" : "bilgi",
        tip === "revize" ? (data.is ? "Claude aboneliğinle arka planda yeniden yazıyor." : data.uyari) : undefined,
      );
      sonraki(k);
    } finally {
      setBusy(false);
    }
  }, [s, busy, nedenler, not, kararlar, sonraki]);

  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || e.metaKey || e.ctrlKey || e.altKey || !s) return;
      const k = e.key.toLowerCase();
      if (panel) {
        const n = Number(e.key);
        if (n >= 1 && n <= OLMAMIS_NEDENLERI.length) {
          e.preventDefault();
          const key = OLMAMIS_NEDENLERI[n - 1].key;
          setNedenler((x) => (x.includes(key) ? x.filter((y) => y !== key) : [...x, key]));
        } else if (k === "r") { e.preventDefault(); karar("revize"); }
        else if (k === "k" || e.key === "Delete") { e.preventDefault(); karar("kaldir"); }
        else if (e.key === "Escape" || k === "x") { e.preventDefault(); setPanel(false); }
        return;
      }
      if (k === "o") { e.preventDefault(); karar("olmus"); }
      else if (k === "x") { e.preventDefault(); setPanel(true); }
      else if (e.key === " ") { e.preventDefault(); setGoster((g) => !g); }
      else if (e.key === "ArrowRight" || k === "j") { e.preventDefault(); git(i + 1); }
      else if (e.key === "ArrowLeft" || k === "k") { e.preventDefault(); git(i - 1); }
      else if (s.secenekler.some((x) => x.harf.toLowerCase() === k)) { e.preventDefault(); setSecim(k.toUpperCase()); setGoster(true); }
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, [s, panel, karar, git, i]);

  if (!sorular.length || bitti) {
    return (
      <div className="mx-auto max-w-2xl pt-10">
        <div className="ink-panel grain rise p-10 text-center sm:p-14">
          <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-gradient-to-br from-[#f3dfae] to-[#b8873a] text-[#14100a] shadow-[0_12px_30px_-8px_rgba(212,168,90,.7)]">
            {bitti ? <PartyPopper size={28} /> : <Check size={28} />}
          </div>
          <h1 className="mt-6 font-display text-4xl tracking-tight">{bitti ? "Tur tamamlandı" : "İnceleme kutusu boş"}</h1>
          <p className="mx-auto mt-3 max-w-sm text-white/60">
            {bitti ? "Bu turdaki tüm soruları değerlendirdin. Revizeye gidenler yeni sürümüyle buraya geri düşecek." : "Onay bekleyen soru yok. Yeni soru üretince burada sıraya girer."}
          </p>
          {bitti && (
            <div className="mx-auto mt-8 grid max-w-sm grid-cols-3 gap-3">
              {(Object.keys(KARAR_STIL) as Karar[]).map((k) => (
                <div key={k} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <div className="tabular font-display text-3xl">{sayac[k]}</div>
                  <div className="text-xs text-white/50">{KARAR_STIL[k].t}</div>
                </div>
              ))}
            </div>
          )}
          <div className="mt-8 flex justify-center gap-3">
            <Link href="/uret" className="btn btn-gold"><Sparkles size={16} /> Soru üret</Link>
            <Link href="/havuz" className="btn !border-white/15 !bg-white/[.06] !text-white !shadow-none">Havuza git</Link>
          </div>
        </div>
      </div>
    );
  }

  const k = kararlar[s.id];
  const ilerleme = (Object.keys(kararlar).length / sorular.length) * 100;

  return (
    <div className="mx-auto max-w-[1180px] pb-40">
      {/* Üst ilerleme */}
      <div className="rise mb-6 flex flex-wrap items-center gap-4">
        <div>
          <p className="label">İnceleme modu</p>
          <h1 className="mt-1 font-display text-[32px] leading-none tracking-tight">
            <span className="tabular">{i + 1}</span><span className="text-muted"> / {sorular.length}</span>
          </h1>
        </div>
        <div className="min-w-[200px] flex-1">
          <div className="flex h-2 overflow-hidden rounded-full bg-paper-2">
            {sorular.map((x, j) => (
              <button
                key={x.id}
                onClick={() => git(j)}
                title={x.id}
                className={clsx("h-full flex-1 border-r border-paper transition last:border-0", kararlar[x.id] === "olmus" ? "bg-ok" : kararlar[x.id] === "revize" ? "bg-blue" : kararlar[x.id] === "kaldir" ? "bg-bad" : j === i ? "bg-gold" : "bg-transparent hover:bg-line-2")}
              />
            ))}
          </div>
          <div className="mt-2 flex gap-4 text-xs text-muted">
            <span className="tabular">%{Math.round(ilerleme)} tamam</span>
            <span className="tabular text-ok">{sayac.olmus} olmuş</span>
            <span className="tabular text-blue">{sayac.revize} revize</span>
            <span className="tabular text-bad">{sayac.kaldir} kaldırıldı</span>
          </div>
        </div>
        <div className="flex gap-2">
          <button className="btn btn-sm !px-2.5" onClick={() => git(i - 1)} disabled={i === 0} aria-label="Önceki"><ArrowLeft size={16} /></button>
          <button className="btn btn-sm !px-2.5" onClick={() => git(i + 1)} disabled={i === sorular.length - 1} aria-label="Sonraki"><ArrowRight size={16} /></button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_330px]">
        <div key={s.id} className="pop space-y-4">
          <ExamPaper
            ust={<>
              <span className="flex items-center gap-2"><span className="rounded-md bg-ink px-2 py-0.5 font-mono tracking-normal text-white">{s.id}</span>{s.sinav} · {s.ders}</span>
              {k ? <span className={clsx("rounded-full px-2.5 py-1 tracking-normal", KARAR_STIL[k].c)}>{KARAR_STIL[k].t}</span> : <span className="font-mono tracking-normal">{s.kazanimKodu}</span>}
            </>}
          >
            <QuestionBody soru={s} cevapGoster={goster} secili={secim} onSec={(h) => { setSecim(h); setGoster(true); }} />
          </ExamPaper>
          {!goster && (
            <p className="flex items-center justify-center gap-2 text-center text-xs text-muted">
              Önce kendin çöz: bir şıkka tıkla ya da harfine bas · <span className="kbd">Boşluk</span> cevabı göster
            </p>
          )}
          {goster && (
            <section className="card pop p-6">
              <div className="mb-3 flex items-center gap-3">
                <span className="grid h-8 w-8 place-items-center rounded-full bg-ok font-bold text-white">{s.dogruCevap}</span>
                <h3 className="font-display text-xl">Çözüm</h3>
                {secim && (
                  <span className={clsx("chip ml-auto", secim === s.dogruCevap ? "!bg-ok-soft !text-ok" : "!bg-bad-soft !text-bad")}>
                    {secim === s.dogruCevap ? <><Check size={12} /> Senin cevabın doğru</> : <><X size={12} /> Sen {secim} dedin</>}
                  </span>
                )}
              </div>
              <p className="whitespace-pre-line text-[15px] leading-relaxed text-ink-2"><Rich text={s.cozum} /></p>
              <ul className="mt-5 grid gap-2">
                {s.secenekler.map((x) => (
                  <li key={x.harf} className={clsx("flex gap-3 rounded-xl p-3 text-sm", x.harf === s.dogruCevap ? "bg-ok-soft" : "bg-paper")}>
                    <span className={clsx("font-bold", x.harf === s.dogruCevap ? "text-ok" : "text-bad")}>{x.harf}</span>
                    <span className="text-ink-2">{x.gerekce}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>

        <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
          <section className="card p-5">
            <p className="label mb-2">Kazanım</p>
            <p className="font-mono text-xs font-semibold">{s.kazanimKodu}</p>
            <p className="mt-1 text-sm leading-relaxed text-ink-2">{s.kazanimMetni}</p>
            <div className="mt-4 flex flex-wrap gap-1.5"><ZorlukBadge zorluk={s.zorluk} /><TurBadge tur={s.tur} /><span className="chip">v{s.surum}</span></div>
            <p className="label mb-1 mt-5">Ölçülen beceri</p>
            <p className="text-sm text-ink-2">{s.beceri}</p>
            <Link href={`/soru/${s.id}`} className="mt-5 flex items-center gap-1 text-sm font-semibold text-ink-2 hover:text-ink">Tüm ayrıntılar <ArrowRight size={14} /></Link>
          </section>
          <section className="card hidden p-5 lg:block">
            <p className="label mb-3 flex items-center gap-2"><Keyboard size={13} /> Kısayollar</p>
            <dl className="grid grid-cols-[auto_1fr] items-center gap-x-3 gap-y-2 text-[13px] text-ink-2">
              <dt><span className="kbd">O</span></dt><dd>Olmuş, sonrakine geç</dd>
              <dt><span className="kbd">X</span></dt><dd>Olmamış paneli</dd>
              <dt><span className="kbd">1</span>–<span className="kbd">7</span></dt><dd>Neden seç (panelde)</dd>
              <dt><span className="kbd">R</span> <span className="kbd">K</span></dt><dd>Revize et / kaldır</dd>
              <dt><span className="kbd">A</span>–<span className="kbd">E</span></dt><dd>Şık işaretle</dd>
              <dt><span className="kbd">␣</span></dt><dd>Cevap ve çözüm</dd>
              <dt><span className="kbd">←</span> <span className="kbd">→</span></dt><dd>Gezin</dd>
            </dl>
          </section>
        </aside>
      </div>

      {/* Karar çubuğu */}
      <div className="no-print fixed inset-x-0 bottom-24 z-30 px-4 lg:bottom-6 lg:left-[268px]">
        <div className="mx-auto max-w-3xl">
          {panel && (
            <div className="card pop mb-3 space-y-4 p-5 !shadow-[var(--shadow-lg)]">
              <div className="flex items-center justify-between">
                <p className="font-display text-lg">Neden olmadı?</p>
                <button className="text-muted hover:text-ink" onClick={() => setPanel(false)} aria-label="Kapat"><X size={18} /></button>
              </div>
              <div className="flex flex-wrap gap-2">
                {OLMAMIS_NEDENLERI.map((n, j) => {
                  const on = nedenler.includes(n.key);
                  return (
                    <button
                      key={n.key}
                      onClick={() => setNedenler((x) => (on ? x.filter((y) => y !== n.key) : [...x, n.key]))}
                      className={clsx("flex items-center gap-2 rounded-full border py-1.5 pl-1.5 pr-3 text-sm transition", on ? "border-bad bg-bad-soft text-bad" : "border-line-2 bg-card hover:border-ink/30")}
                    >
                      <span className={clsx("grid h-5 w-5 place-items-center rounded-full font-mono text-[10px] font-bold", on ? "bg-bad text-white" : "bg-paper text-muted")}>{j + 1}</span>
                      {n.label}
                    </button>
                  );
                })}
              </div>
              <textarea className="field" rows={2} value={not} onChange={(e) => setNot(e.target.value)} placeholder="Revizyon notu (isteğe bağlı): ör. “C şıkkı da savunulabilir”" />
              <div className="flex flex-wrap justify-end gap-2">
                <button className="btn btn-bad" disabled={busy} onClick={() => karar("kaldir")}><Trash2 size={16} /> Kaldır <span className="kbd !border-bad/30 !bg-transparent !text-bad">K</span></button>
                <button className="btn btn-primary" disabled={busy || nedenler.length + not.trim().length === 0} onClick={() => karar("revize")}>
                  {busy ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} className="text-gold-2" />} Revize et <span className="kbd !border-white/20 !bg-transparent !text-white/60">R</span>
                </button>
              </div>
            </div>
          )}
          <div className="flex items-center justify-between gap-3 rounded-[20px] border border-white/10 bg-[#0e1119]/92 p-2.5 pl-5 text-white shadow-[0_30px_60px_-20px_rgba(13,16,23,.6)] backdrop-blur-xl">
            <button onClick={() => setGoster((g) => !g)} className="flex items-center gap-2 text-sm text-white/65 hover:text-white">
              <Eye size={16} /> <span className="hidden sm:inline">{goster ? "Çözümü gizle" : "Cevabı göster"}</span>
            </button>
            <div className="flex gap-2">
              <button className="btn min-w-32 !border-[#ff9d92]/25 !bg-[#b3372f]/15 !text-[#ffb4ab] !shadow-none hover:!bg-[#b3372f]/30" disabled={busy} onClick={() => setPanel((p) => !p)}>
                <ThumbsDown size={16} /> Olmamış <span className="kbd hidden !border-white/15 !bg-transparent !text-white/45 sm:grid">X</span>
              </button>
              <button className="btn btn-ok min-w-32" disabled={busy} onClick={() => karar("olmus")}>
                {busy && !panel ? <Loader2 size={16} className="animate-spin" /> : <ThumbsUp size={16} />} Olmuş <span className="kbd hidden !border-white/25 !bg-transparent !text-white/70 sm:grid">O</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
