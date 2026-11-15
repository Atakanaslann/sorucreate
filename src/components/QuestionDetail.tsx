"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import clsx from "clsx";
import {
  ArrowLeft, Check, Copy, Download, Eye, EyeOff, History, ImagePlus, Loader2, RotateCcw, Sparkles, ThumbsDown, ThumbsUp, Trash2, AlertTriangle, Plus,
} from "lucide-react";
import type { Soru, OlmamisNedeni } from "@/lib/types";
import { OLMAMIS_NEDENLERI } from "@/lib/types";
import { QuestionBody, Rich } from "./QuestionBody";
import { DurumBadge, TurBadge, ZorlukBadge } from "./Badges";
import { svgDataUri } from "./QuestionFigure";
import { useDeneme } from "./useDeneme";

function CopyBtn({ text, label = "Kopyala" }: { text: string; label?: string }) {
  const [ok, setOk] = useState(false);
  return (
    <button
      className="btn !h-8 !px-3 text-xs"
      onClick={async () => {
        await navigator.clipboard.writeText(text);
        setOk(true);
        setTimeout(() => setOk(false), 1500);
      }}
    >
      {ok ? <Check size={14} /> : <Copy size={14} />} {ok ? "Kopyalandı" : label}
    </button>
  );
}

export function QuestionDetail({ soru, benzerler, ai }: { soru: Soru; benzerler: { id: string; skor: number }[]; ai: boolean }) {
  const router = useRouter();
  const deneme = useDeneme();
  const [cevap, setCevap] = useState(false);
  const [panel, setPanel] = useState(false);
  const [nedenler, setNedenler] = useState<OlmamisNedeni[]>([]);
  const [not, setNot] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [mesaj, setMesaj] = useState<{ tur: "ok" | "uyari"; text: string } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  async function patch(body: object, key: string) {
    setBusy(key);
    setMesaj(null);
    try {
      const res = await fetch(`/api/questions/${soru.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const data = await res.json();
      if (!res.ok) setMesaj({ tur: "uyari", text: data.error ?? "İşlem başarısız" });
      else if (data.uyari) setMesaj({ tur: "uyari", text: data.uyari });
      return { ok: res.ok, data };
    } finally {
      setBusy(null);
      router.refresh();
    }
  }

  const olmus = async () => {
    const r = await patch({ action: "olmus" }, "olmus");
    if (r.ok) setMesaj({ tur: "ok", text: "Soru onaylandı ve havuzda kullanılabilir." });
  };
  const olmamis = async (aksiyon: "revize" | "kaldir") => {
    const r = await patch({ action: "olmamis", nedenler, not, aksiyon }, aksiyon);
    if (r.ok) {
      setPanel(false);
      setNedenler([]);
      setNot("");
      if (!r.data.uyari) setMesaj({ tur: "ok", text: aksiyon === "kaldir" ? "Soru kaldırıldı. Arşivden geri alınabilir." : `Soru revize edildi (sürüm ${r.data.soru.surum}). Tekrar onayınızı bekliyor.` });
    }
  };

  const onUpload = (f: File) => {
    if (f.size > 4 * 1024 * 1024) return setMesaj({ tur: "uyari", text: "Görsel 4 MB'tan küçük olmalı." });
    const rd = new FileReader();
    rd.onload = () => patch({ action: "gorsel", url: rd.result as string }, "gorsel");
    rd.readAsDataURL(f);
  };

  const kaldirildi = soru.durum === "kaldirildi";

  return (
    <div className="mx-auto max-w-6xl pb-44">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <Link href="/havuz" className="flex items-center gap-2 text-sm font-semibold text-ink-2 hover:text-ink"><ArrowLeft size={16} /> Havuz</Link>
        <div className="flex items-center gap-2">
          <button className={clsx("btn", deneme.has(soru.id) && "!border-gold !bg-gold-soft")} onClick={() => deneme.toggle(soru.id)}>
            {deneme.has(soru.id) ? <><Check size={16} /> Denemede</> : <><Plus size={16} /> Denemeye ekle</>}
          </button>
          <button className="btn" onClick={() => setCevap((v) => !v)}>
            {cevap ? <EyeOff size={16} /> : <Eye size={16} />} {cevap ? "Çözümü gizle" : "Cevap ve çözüm"}
          </button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="space-y-6">
          <article className="card relative overflow-hidden">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line bg-[#fbfaf6] px-6 py-4">
              <div className="flex items-center gap-3">
                <span className="whitespace-nowrap rounded-lg bg-ink px-2.5 py-1 font-mono text-xs font-semibold text-white">{soru.id}</span>
                <span className="text-sm text-ink-2">{soru.sinav} · {soru.ders} · {soru.unite}</span>
              </div>
              <DurumBadge durum={soru.durum} />
            </div>
            <div className={clsx("p-6 sm:p-8", kaldirildi && "opacity-50")}>
              <QuestionBody soru={soru} cevapGoster={cevap} />
            </div>
          </article>

          {mesaj && (
            <div className={clsx("card flex items-start gap-3 p-4 text-sm", mesaj.tur === "ok" ? "!border-[#bfe3d2] !bg-ok-soft text-ok" : "!border-[#f0d2a8] !bg-gold-soft text-[#7a5512]")}>
              {mesaj.tur === "ok" ? <Check size={18} /> : <AlertTriangle size={18} />} {mesaj.text}
            </div>
          )}

          {cevap && (
            <section className="card space-y-5 p-6 sm:p-8">
              <div>
                <h3 className="font-display text-xl">Çözüm</h3>
                <p className="mt-3 whitespace-pre-line text-[15px] leading-relaxed text-ink-2"><Rich text={soru.cozum} /></p>
              </div>
              <div>
                <h3 className="font-display text-xl">Seçenek gerekçeleri</h3>
                <ul className="mt-3 space-y-2">
                  {soru.secenekler.map((s) => (
                    <li key={s.harf} className={clsx("flex gap-3 rounded-xl p-3 text-sm", s.harf === soru.dogruCevap ? "bg-ok-soft" : "bg-paper")}>
                      <span className={clsx("font-semibold", s.harf === soru.dogruCevap ? "text-ok" : "text-bad")}>{s.harf}</span>
                      <span className="text-ink-2">{s.gerekce}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </section>
          )}

          {soru.gorsel && (
            <section className="card space-y-5 p-6 sm:p-8">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h3 className="font-display text-xl">Görsel brifi</h3>
                <div className="flex flex-wrap gap-2">
                  {soru.gorsel.svg && (
                    <a className="btn !h-8 !px-3 text-xs" href={svgDataUri(soru.gorsel.svg)} download={`${soru.id}.svg`}><Download size={14} /> SVG</a>
                  )}
                  <button className="btn !h-8 !px-3 text-xs" onClick={() => fileRef.current?.click()} disabled={busy === "gorsel"}>
                    {busy === "gorsel" ? <Loader2 size={14} className="animate-spin" /> : <ImagePlus size={14} />} Görsel yükle
                  </button>
                  {soru.gorsel.url && (
                    <button className="btn !h-8 !px-3 text-xs" onClick={() => patch({ action: "gorsel", url: undefined }, "gorsel")}>Yüklenen görseli kaldır</button>
                  )}
                  <input ref={fileRef} type="file" accept="image/*" hidden onChange={(e) => e.target.files?.[0] && onUpload(e.target.files[0])} />
                </div>
              </div>
              <div>
                <p className="label mb-2">Sahne tarifi</p>
                <p className="text-sm leading-relaxed text-ink-2">{soru.gorsel.aciklama}</p>
              </div>
              {soru.gorsel.zorunluOgeler.length > 0 && (
                <div>
                  <p className="label mb-2">Görselde mutlaka okunmalı</p>
                  <div className="flex flex-wrap gap-1.5">{soru.gorsel.zorunluOgeler.map((o, i) => <span key={i} className="chip !bg-gold-soft !text-[#7a5512]">{o}</span>)}</div>
                </div>
              )}
              <div>
                <div className="mb-2 flex items-center justify-between"><p className="label">Görsel üretim promptu</p><CopyBtn text={soru.gorsel.prompt} /></div>
                <pre className="whitespace-pre-wrap rounded-xl bg-ink p-4 font-mono text-xs leading-relaxed text-white/90">{soru.gorsel.prompt}</pre>
              </div>
              <div>
                <div className="mb-2 flex items-center justify-between"><p className="label">Negatif prompt</p><CopyBtn text={soru.gorsel.negatifPrompt} /></div>
                <p className="rounded-xl bg-paper p-3 font-mono text-xs text-ink-2">{soru.gorsel.negatifPrompt}</p>
              </div>
            </section>
          )}
        </div>

        <aside className="space-y-6">
          <section className="card p-5">
            <div className="mb-4 flex items-center justify-between"><h3 className="font-display text-lg">Etiketler</h3><CopyBtn text={soru.id} label="ID" /></div>
            <dl className="grid grid-cols-[96px_1fr] gap-x-3 gap-y-2.5 text-sm">
              <dt className="text-muted">Sınav</dt><dd>{soru.sinav}</dd>
              <dt className="text-muted">Ders</dt><dd>{soru.ders} · {soru.sinif}. sınıf</dd>
              <dt className="text-muted">Ünite</dt><dd>{soru.unite}</dd>
              <dt className="text-muted">Kazanım</dt><dd><span className="font-mono text-xs font-semibold">{soru.kazanimKodu}</span><span className="mt-1 block text-ink-2">{soru.kazanimMetni}</span></dd>
              <dt className="text-muted">Beceri</dt><dd>{soru.beceri}</dd>
              <dt className="text-muted">Sürüm</dt><dd>v{soru.surum}</dd>
              <dt className="text-muted">Kaynak</dt><dd>{soru.meta.kaynak === "claude" ? `Claude (${soru.meta.model})` : soru.meta.kaynak === "ornek" ? "Örnek soru" : "Manuel"}</dd>
            </dl>
            <div className="mt-4 flex flex-wrap gap-1.5"><ZorlukBadge zorluk={soru.zorluk} /><TurBadge tur={soru.tur} /></div>
          </section>

          <section className="card p-5">
            <h3 className="mb-3 font-display text-lg">Benzerlik kontrolü</h3>
            {benzerler.length === 0 ? (
              <p className="flex items-center gap-2 text-sm text-ok"><Check size={16} /> Aynı kazanımda benzer soru yok.</p>
            ) : (
              <ul className="space-y-2 text-sm">
                {benzerler.map((b) => (
                  <li key={b.id} className="flex items-center justify-between rounded-lg bg-gold-soft px-3 py-2">
                    <Link href={`/soru/${b.id}`} className="font-mono text-xs font-semibold underline">{b.id}</Link>
                    <span className="text-[#7a5512]">%{Math.round(b.skor * 100)} benzer</span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="card p-5">
            <h3 className="mb-3 flex items-center gap-2 font-display text-lg"><History size={17} /> Revizyon geçmişi</h3>
            {soru.revizyonlar.length === 0 ? (
              <p className="text-sm text-muted">İlk sürüm.</p>
            ) : (
              <ul className="space-y-3">
                {[...soru.revizyonlar].reverse().map((r) => (
                  <li key={`${r.surum}-${r.tarih}`} className="rounded-xl border border-line p-3 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold">v{r.surum}</span>
                      <button className="text-xs font-semibold text-blue hover:underline" onClick={() => patch({ action: "surum", surum: r.surum }, "surum")}>Geri yükle</button>
                    </div>
                    <p className="mt-1 line-clamp-2 text-ink-2">{r.kok}</p>
                    {r.neden && <p className="mt-1 text-xs text-muted">Neden: {r.neden}</p>}
                  </li>
                ))}
              </ul>
            )}
          </section>

          {soru.geribildirim.length > 0 && (
            <section className="card p-5">
              <h3 className="mb-3 font-display text-lg">Değerlendirmeler</h3>
              <ul className="space-y-2 text-sm">
                {[...soru.geribildirim].reverse().map((g, i) => (
                  <li key={i} className="flex gap-2">
                    {g.karar === "olmus" ? <ThumbsUp size={15} className="mt-0.5 shrink-0 text-ok" /> : <ThumbsDown size={15} className="mt-0.5 shrink-0 text-bad" />}
                    <span className="text-ink-2">
                      {g.karar === "olmus" ? "Olmuş" : `Olmamış → ${g.aksiyon === "kaldir" ? "kaldırıldı" : "revize"}`}
                      {g.nedenler.length > 0 && ` · ${g.nedenler.map((n) => OLMAMIS_NEDENLERI.find((x) => x.key === n)?.label).join(", ")}`}
                      {g.not && <span className="block text-xs text-muted">“{g.not}”</span>}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </aside>
      </div>

      {/* Sabit alt karar çubuğu */}
      <div className="no-print fixed inset-x-0 bottom-16 z-30 px-4 lg:bottom-6 lg:left-64">
        <div className="mx-auto max-w-3xl">
          {panel && !kaldirildi && (
            <div className="card mb-3 space-y-4 p-5">
              <p className="font-display text-lg">Neden olmadı?</p>
              <div className="flex flex-wrap gap-2">
                {OLMAMIS_NEDENLERI.map((n) => {
                  const on = nedenler.includes(n.key);
                  return (
                    <button
                      key={n.key}
                      onClick={() => setNedenler((x) => (on ? x.filter((y) => y !== n.key) : [...x, n.key]))}
                      className={clsx("rounded-full border px-3 py-1.5 text-sm transition", on ? "border-bad bg-bad-soft text-bad" : "border-line hover:border-[#cfc9ba]")}
                    >
                      {n.label}
                    </button>
                  );
                })}
              </div>
              <textarea className="field" rows={2} value={not} onChange={(e) => setNot(e.target.value)} placeholder="Revizyon için not (ör. “bardak yükseklikleri görselde okunmuyor”, “4. şık da doğru olabiliyor”)" />
              <div className="flex flex-wrap justify-end gap-2">
                <button className="btn" onClick={() => setPanel(false)}>Vazgeç</button>
                <button className="btn btn-bad" disabled={!!busy} onClick={() => olmamis("kaldir")}>
                  {busy === "kaldir" ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />} Kaldır
                </button>
                <button className="btn btn-primary" disabled={!!busy || nedenler.length + not.trim().length === 0} onClick={() => olmamis("revize")}>
                  {busy === "revize" ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />} {ai ? "Revize et" : "Revizyona gönder"}
                </button>
              </div>
            </div>
          )}
          <div className="card flex flex-wrap items-center justify-between gap-3 !rounded-2xl p-3 pl-5 shadow-xl">
            <span className="text-sm text-ink-2">
              {kaldirildi ? "Bu soru kaldırıldı." : soru.durum === "onaylandi" ? "Onaylandı. Fikrin değiştiyse tekrar değerlendir." : soru.durum === "revizyonda" ? "Revizyon bekliyor." : "Bu soru nasıl?"}
            </span>
            <div className="flex gap-2">
              {kaldirildi ? (
                <button className="btn" disabled={!!busy} onClick={() => patch({ action: "geri_al" }, "geri")}><RotateCcw size={16} /> Geri al</button>
              ) : (
                <>
                  {soru.durum === "revizyonda" && ai && (
                    <button className="btn" disabled={!!busy} onClick={() => patch({ action: "ai_revize" }, "ai")}>
                      {busy === "ai" ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />} AI ile revize et
                    </button>
                  )}
                  <button className="btn btn-bad min-w-28" disabled={!!busy} onClick={() => setPanel((p) => !p)}><ThumbsDown size={16} /> Olmamış</button>
                  <button className="btn btn-ok min-w-28" disabled={!!busy || soru.durum === "onaylandi"} onClick={olmus}>
                    {busy === "olmus" ? <Loader2 size={16} className="animate-spin" /> : <ThumbsUp size={16} />} Olmuş
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
