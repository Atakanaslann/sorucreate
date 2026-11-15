import Link from "next/link";
import { ArrowRight, Sparkles, CheckCircle2, XCircle, Layers, Target } from "lucide-react";
import { stats } from "@/lib/store";
import { aiHazir } from "@/lib/ai";
import { GUNLUK_HEDEF, OLMAMIS_NEDENLERI } from "@/lib/types";
import { ProgressRing } from "@/components/ProgressRing";
import { DurumBadge } from "@/components/Badges";

export const dynamic = "force-dynamic";

export default async function Dashboard() {
  const st = await stats();
  const ai = aiHazir();
  const toplamBugun = st.bugun.gorselli + st.bugun.gorselsiz;
  const onayOrani = st.geribildirim.olmus + st.geribildirim.olmamis
    ? Math.round((st.geribildirim.olmus / (st.geribildirim.olmus + st.geribildirim.olmamis)) * 100)
    : null;
  const nedenMax = Math.max(1, ...Object.values(st.geribildirim.nedenler));
  const dersler = Array.from(new Set(Object.keys(st.dersZorluk).map((k) => k.split("|")[0]))).sort();
  const tarih = new Date().toLocaleDateString("tr-TR", { weekday: "long", day: "numeric", month: "long", timeZone: "Europe/Istanbul" });

  return (
    <div className="mx-auto max-w-6xl space-y-8 pb-20">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="label">{tarih}</p>
          <h1 className="mt-2 font-display text-4xl tracking-tight sm:text-5xl">Günün üretim masası</h1>
          <p className="mt-2 max-w-xl text-ink-2">Hedef: 20 yeni nesil + 30 görselsiz soru. Her soru MEB kazanımına bağlı, orta veya zor.</p>
        </div>
        <div className="flex items-center gap-3">
          <span className={`chip ${ai ? "!bg-ok-soft !text-ok" : "!bg-bad-soft !text-bad"}`}>
            <span className="h-1.5 w-1.5 rounded-full bg-current" />
            {ai ? "Claude bağlı" : "API anahtarı yok"}
          </span>
          <Link href="/uret" className="btn btn-primary">
            <Sparkles size={16} /> Soru üret
          </Link>
        </div>
      </header>

      <section className="card grid gap-8 p-6 sm:p-8 md:grid-cols-3">
        <ProgressRing value={st.bugun.gorselli} max={GUNLUK_HEDEF.gorselli} color="#b8892f" label="Yeni nesil (görselli)" />
        <ProgressRing value={st.bugun.gorselsiz} max={GUNLUK_HEDEF.gorselsiz} color="#2c5be0" label="Görselsiz" />
        <ProgressRing value={toplamBugun} max={GUNLUK_HEDEF.gorselli + GUNLUK_HEDEF.gorselsiz} color="#12151c" label="Günlük toplam" />
      </section>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { icon: Layers, k: "Havuzdaki soru", v: st.toplam },
          { icon: CheckCircle2, k: "Onaylanan", v: st.durum.onaylandi ?? 0 },
          { icon: Target, k: "Onay bekleyen", v: (st.durum.taslak ?? 0) + (st.durum.revizyonda ?? 0) },
          { icon: XCircle, k: "Onay oranı", v: onayOrani === null ? "—" : `%${onayOrani}` },
        ].map(({ icon: Icon, k, v }) => (
          <div key={k} className="card p-5">
            <Icon size={18} className="text-gold" />
            <div className="mt-4 font-display text-3xl">{v}</div>
            <div className="text-sm text-muted">{k}</div>
          </div>
        ))}
      </section>

      <section className="grid gap-6 lg:grid-cols-5">
        <div className="card p-6 lg:col-span-3">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-xl">Son hareketler</h2>
            <Link href="/havuz" className="flex items-center gap-1 text-sm font-semibold text-ink-2 hover:text-ink">
              Havuza git <ArrowRight size={14} />
            </Link>
          </div>
          <ul className="divide-y divide-line">
            {st.son.map((s) => (
              <li key={s.id}>
                <Link href={`/soru/${s.id}`} className="flex items-center gap-4 py-3 hover:opacity-80">
                  <span className="w-36 shrink-0 font-mono text-xs text-muted">{s.id}</span>
                  <span className="min-w-0 flex-1 truncate text-sm">{s.kok}</span>
                  <span className="hidden sm:inline"><DurumBadge durum={s.durum} /></span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div className="card p-6 lg:col-span-2">
          <h2 className="mb-1 font-display text-xl">“Olmamış” nedenleri</h2>
          <p className="mb-5 text-sm text-muted">Sık çıkan nedenler üretim promptuna “kaçınılacaklar” olarak eklenir.</p>
          {Object.keys(st.geribildirim.nedenler).length === 0 ? (
            <p className="text-sm text-muted">Henüz ret yok.</p>
          ) : (
            <ul className="space-y-3">
              {OLMAMIS_NEDENLERI.filter((n) => st.geribildirim.nedenler[n.key]).map((n) => (
                <li key={n.key}>
                  <div className="mb-1 flex justify-between text-sm"><span>{n.label}</span><span className="text-muted">{st.geribildirim.nedenler[n.key]}</span></div>
                  <div className="h-2 rounded-full bg-[#efebe2]"><div className="h-2 rounded-full bg-bad" style={{ width: `${(st.geribildirim.nedenler[n.key] / nedenMax) * 100}%` }} /></div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      <section className="card overflow-x-auto p-6">
        <h2 className="mb-4 font-display text-xl">Ders × zorluk dağılımı</h2>
        <table className="w-full min-w-[420px] text-sm">
          <thead>
            <tr className="text-left text-muted"><th className="pb-2 font-medium">Ders</th><th className="pb-2 font-medium">Orta</th><th className="pb-2 font-medium">Zor</th><th className="pb-2 font-medium">Toplam</th></tr>
          </thead>
          <tbody className="divide-y divide-line">
            {dersler.map((d) => {
              const o = st.dersZorluk[`${d}|orta`] ?? 0;
              const z = st.dersZorluk[`${d}|zor`] ?? 0;
              return (
                <tr key={d}><td className="py-2.5 font-medium">{d}</td><td>{o}</td><td>{z}</td><td className="font-semibold">{o + z}</td></tr>
              );
            })}
          </tbody>
        </table>
        <p className="mt-4 text-xs text-muted">Soru bulunan kazanım sayısı: {st.kapsananKazanim}</p>
      </section>

    </div>
  );
}
