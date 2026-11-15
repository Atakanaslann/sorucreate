import Link from "next/link";
import { ArrowRight, ArrowUpRight, CheckCircle2, Layers, Target, Percent, ScanEye, Sparkles, Image as ImageIcon, Type } from "lucide-react";
import { stats } from "@/lib/store";
import { GUNLUK_HEDEF, OLMAMIS_NEDENLERI } from "@/lib/types";
import { ProgressRing } from "@/components/ProgressRing";
import { DurumBadge } from "@/components/Badges";

export const dynamic = "force-dynamic";

function selam() {
  const h = Number(new Intl.DateTimeFormat("en-GB", { hour: "numeric", hour12: false, timeZone: "Europe/Istanbul" }).format(new Date()));
  if (h < 6) return "İyi geceler";
  if (h < 12) return "Günaydın";
  if (h < 18) return "İyi günler";
  return "İyi akşamlar";
}

export default async function Dashboard() {
  const st = await stats();
  const toplamBugun = st.bugun.gorselli + st.bugun.gorselsiz;
  const hedef = GUNLUK_HEDEF.gorselli + GUNLUK_HEDEF.gorselsiz;
  const kalan = Math.max(0, hedef - toplamBugun);
  const bekleyen = (st.durum.taslak ?? 0) + (st.durum.revizyonda ?? 0);
  const fb = st.geribildirim.olmus + st.geribildirim.olmamis;
  const onayOrani = fb ? Math.round((st.geribildirim.olmus / fb) * 100) : null;
  const nedenMax = Math.max(1, ...Object.values(st.geribildirim.nedenler));
  const dersler = Array.from(new Set(Object.keys(st.dersZorluk).map((k) => k.split("|")[0]))).sort();
  const matrisMax = Math.max(1, ...Object.values(st.dersZorluk));
  const gunMax = Math.max(hedef, ...st.gunluk.map((g) => g.gorselli + g.gorselsiz)) * 1.12;
  const tarih = new Date().toLocaleDateString("tr-TR", { weekday: "long", day: "numeric", month: "long", timeZone: "Europe/Istanbul" });
  const gunAdi = (g: string) => new Date(`${g}T12:00:00`).toLocaleDateString("tr-TR", { weekday: "short" });

  return (
    <div className="mx-auto max-w-[1180px] space-y-6 pb-16">
      {/* Kahraman */}
      <section className="ink-panel grain rise p-6 sm:p-10">
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(255,255,255,.035)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.035)_1px,transparent_1px)] bg-[size:44px_44px] [mask-image:radial-gradient(ellipse_at_top_right,black,transparent_70%)]" />
        <div className="relative grid items-center gap-10 lg:grid-cols-[1.1fr_1fr]">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[.22em] text-white/45">{tarih}</p>
            <h1 className="mt-3 font-display text-[40px] font-medium leading-[1.02] tracking-tight sm:text-[56px]">
              {selam()},<br />
              <span className="gold-text italic">üretim masası</span> hazır.
            </h1>
            <p className="mt-5 max-w-md text-[15px] leading-relaxed text-white/60">
              {kalan > 0
                ? <>Günlük hedefe <span className="font-semibold text-white">{kalan} soru</span> kaldı. Her soru MEB kazanımına bağlı, orta ya da zor seviyede.</>
                : <>Bugünün hedefi tamam. Şimdi bekleyenleri gözden geçirme zamanı.</>}
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link href="/uret" className="btn btn-gold"><Sparkles size={16} /> Soru üret</Link>
              <Link href="/incele" className="btn !border-white/15 !bg-white/[.06] !text-white !shadow-none hover:!bg-white/[.12]">
                <ScanEye size={16} /> İncelemeye başla
                {bekleyen > 0 && <span className="tabular rounded-full bg-white/15 px-2 py-0.5 font-mono text-[11px]">{bekleyen}</span>}
              </Link>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3 sm:gap-6">
            <ProgressRing id="gorselli" dark value={st.bugun.gorselli} max={GUNLUK_HEDEF.gorselli} from="#f3dfae" to="#c9963f" label="Yeni nesil" sub="görselli" />
            <ProgressRing id="gorselsiz" dark value={st.bugun.gorselsiz} max={GUNLUK_HEDEF.gorselsiz} from="#a9b6ff" to="#3d5bd9" label="Klasik" sub="görselsiz" />
            <ProgressRing id="toplam" dark value={toplamBugun} max={hedef} from="#7fe0b8" to="#0f9a6a" label="Toplam" sub={`%${Math.round((toplamBugun / hedef) * 100)}`} />
          </div>
        </div>
      </section>

      {/* KPI */}
      <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          { icon: Layers, k: "Havuzdaki soru", v: st.toplam, alt: `${st.kapsananKazanim} kazanım kapsandı` },
          { icon: CheckCircle2, k: "Onaylanan", v: st.durum.onaylandi ?? 0, alt: "kullanıma hazır" },
          { icon: Target, k: "Onay bekleyen", v: bekleyen, alt: "incelemede", href: "/incele" },
          { icon: Percent, k: "Onay oranı", v: onayOrani === null ? "—" : `%${onayOrani}`, alt: `${fb} geri bildirim` },
        ].map(({ icon: Icon, k, v, alt, href }, i) => {
          const inner = (
            <>
              <div className="flex items-center justify-between">
                <span className="grid h-9 w-9 place-items-center rounded-xl bg-paper text-ink-2"><Icon size={17} /></span>
                {href && <ArrowUpRight size={16} className="text-muted transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-ink" />}
              </div>
              <div className="tabular mt-5 font-display text-[38px] leading-none tracking-tight">{v}</div>
              <div className="mt-2 text-sm font-semibold">{k}</div>
              <div className="text-xs text-muted">{alt}</div>
            </>
          );
          const cls = `card card-hover group rise rise-${i + 1} p-5`;
          return href ? <Link key={k} href={href} className={cls}>{inner}</Link> : <div key={k} className={cls}>{inner}</div>;
        })}
      </section>

      <section className="grid gap-6 lg:grid-cols-5">
        {/* 7 gün grafiği */}
        <div className="card rise rise-2 p-6 lg:col-span-3">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="font-display text-[22px] tracking-tight">Son 7 gün</h2>
              <p className="text-sm text-muted">Üretilen soru sayısı · kesikli çizgi günlük hedef ({hedef})</p>
            </div>
            <div className="flex gap-3 text-xs text-muted">
              <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-[3px] bg-gradient-to-b from-[#e6c98a] to-[#b8873a]" />Yeni nesil</span>
              <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-[3px] bg-ink" />Görselsiz</span>
            </div>
          </div>
          <div className="relative mt-8 h-52">
            <div className="absolute inset-x-0 border-t border-dashed border-gold/60" style={{ bottom: `${Math.min(100, (hedef / gunMax) * 100)}%` }}>
              <span className="absolute -top-5 right-0 font-mono text-[10px] text-gold">hedef</span>
            </div>
            <div className="absolute inset-0 flex items-end gap-3 sm:gap-5">
              {st.gunluk.map((g, i) => {
                const t = g.gorselli + g.gorselsiz;
                const bugun = i === st.gunluk.length - 1;
                return (
                  <div key={g.gun} className="group flex h-full flex-1 flex-col justify-end">
                    <div className="tabular mb-1.5 text-center font-mono text-[11px] font-semibold text-ink-2 opacity-0 transition group-hover:opacity-100" style={t || bugun ? { opacity: 1 } : undefined}>{t}</div>
                    {t ? (
                      <div className="flex flex-col overflow-hidden rounded-[9px] transition group-hover:brightness-110" style={{ height: `${(t / gunMax) * 100}%`, minHeight: 8 }}>
                        <div className="bg-gradient-to-b from-[#ecd59e] to-[#c3913f]" style={{ flex: g.gorselli }} />
                        <div className="bg-gradient-to-b from-[#2a2f3d] to-[#0d1017]" style={{ flex: g.gorselsiz }} />
                      </div>
                    ) : (
                      <div className="h-1.5 rounded-full bg-paper-2" />
                    )}
                    <div className={`mt-2 text-center text-[11px] capitalize ${bugun ? "font-semibold text-ink" : "text-muted"}`}>{bugun ? "Bugün" : gunAdi(g.gun)}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Olmamış nedenleri */}
        <div className="card rise rise-3 p-6 lg:col-span-2">
          <h2 className="font-display text-[22px] tracking-tight">Neden &ldquo;olmamış&rdquo;?</h2>
          <p className="mb-6 text-sm text-muted">Sık çıkan nedenler bir sonraki üretimde &ldquo;kaçınılacaklar&rdquo; olarak prompta eklenir.</p>
          {Object.keys(st.geribildirim.nedenler).length === 0 ? (
            <div className="grid place-items-center rounded-2xl border border-dashed border-line-2 py-10 text-center text-sm text-muted">
              Henüz ret yok.<br /><span className="text-xs">İncelemede verdiğin her karar burada birikir.</span>
            </div>
          ) : (
            <ul className="space-y-4">
              {OLMAMIS_NEDENLERI.filter((n) => st.geribildirim.nedenler[n.key])
                .sort((a, b) => st.geribildirim.nedenler[b.key] - st.geribildirim.nedenler[a.key])
                .map((n) => (
                  <li key={n.key}>
                    <div className="mb-1.5 flex justify-between text-sm"><span>{n.label}</span><span className="tabular font-mono text-xs text-muted">{st.geribildirim.nedenler[n.key]}</span></div>
                    <div className="h-2 overflow-hidden rounded-full bg-paper-2"><div className="h-full rounded-full bg-gradient-to-r from-[#e0786d] to-bad" style={{ width: `${(st.geribildirim.nedenler[n.key] / nedenMax) * 100}%` }} /></div>
                  </li>
                ))}
            </ul>
          )}
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-5">
        {/* Matris */}
        <div className="card rise rise-3 overflow-x-auto p-6 lg:col-span-2">
          <h2 className="font-display text-[22px] tracking-tight">Ders × zorluk</h2>
          <p className="mb-5 text-sm text-muted">Koyu hücre = yoğun. Boşlukları üretimle doldur.</p>
          <div className="min-w-[300px]">
            <div className="grid grid-cols-[1fr_72px_72px] gap-1.5 pb-2 text-[10.5px] font-semibold uppercase tracking-[.14em] text-muted">
              <span>Ders</span><span className="text-center">Orta</span><span className="text-center">Zor</span>
            </div>
            <div className="space-y-1.5">
              {dersler.map((d) => (
                <div key={d} className="grid grid-cols-[1fr_72px_72px] items-center gap-1.5">
                  <span className="truncate text-sm font-medium">{d}</span>
                  {(["orta", "zor"] as const).map((z) => {
                    const v = st.dersZorluk[`${d}|${z}`] ?? 0;
                    const a = v / matrisMax;
                    return (
                      <span
                        key={z}
                        className="tabular grid h-10 place-items-center rounded-xl font-mono text-sm font-semibold"
                        style={{ background: v ? `rgba(${z === "zor" ? "13,16,23" : "184,135,58"},${0.12 + a * 0.78})` : "var(--paper)", color: a > 0.45 ? "#fff" : "var(--ink-2)" }}
                      >
                        {v || "·"}
                      </span>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Son hareketler */}
        <div className="card rise rise-4 p-6 lg:col-span-3">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-display text-[22px] tracking-tight">Son hareketler</h2>
            <Link href="/havuz" className="group flex items-center gap-1 text-sm font-semibold text-ink-2 hover:text-ink">
              Tüm havuz <ArrowRight size={14} className="transition group-hover:translate-x-0.5" />
            </Link>
          </div>
          <ul className="-mx-2">
            {st.son.map((s) => (
              <li key={s.id}>
                <Link href={`/soru/${s.id}`} className="group flex items-center gap-3 rounded-xl px-2 py-2.5 transition hover:bg-paper">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-line bg-card text-muted">
                    {s.tur === "gorselli" ? <ImageIcon size={15} /> : <Type size={15} />}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium">{s.kok.replace(/\*\*/g, "")}</span>
                    <span className="block font-mono text-[11px] text-muted">{s.id} · {s.unite}</span>
                  </span>
                  <span className="hidden sm:inline"><DurumBadge durum={s.durum} /></span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </div>
  );
}
