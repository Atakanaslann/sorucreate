import { Suspense } from "react";
import Link from "next/link";
import { ScanEye, Sparkles } from "lucide-react";
import { listQuestions } from "@/lib/store";
import { PoolFilters } from "@/components/PoolFilters";
import { PoolCard } from "@/components/PoolCard";

export const dynamic = "force-dynamic";

export default async function Havuz({ searchParams }: { searchParams: Promise<Record<string, string>> }) {
  const sp = await searchParams;
  const sorular = await listQuestions(sp);
  return (
    <div className="mx-auto max-w-[1280px] space-y-6 pb-20">
      <header className="rise flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="label">Soru havuzu</p>
          <h1 className="mt-2 font-display text-[42px] leading-[1.05] tracking-tight sm:text-[52px]"><span className="tabular">{sorular.length}</span> <span className="italic text-gold">soru.</span></h1>
          <p className="mt-2 text-sm text-muted">
            {sorular.filter((s) => s.durum === "onaylandi").length} onaylı · {sorular.filter((s) => s.durum === "taslak").length} onay bekliyor · {sorular.filter((s) => s.tur === "gorselli").length} yeni nesil
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/incele" className="btn"><ScanEye size={16} /> İncele</Link>
          <Link href="/uret" className="btn btn-primary"><Sparkles size={16} className="text-gold-2" /> Yeni soru</Link>
        </div>
      </header>
      <Suspense><PoolFilters /></Suspense>
      {sorular.length === 0 ? (
        <div className="card grid place-items-center p-16 text-center"><p className="font-display text-2xl">Eşleşen soru yok</p><p className="mt-1 text-sm text-muted">Filtreleri gevşet ya da bu kazanım için yeni soru üret.</p></div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {sorular.map((s, i) => <PoolCard key={s.id} soru={s} i={i} />)}
        </div>
      )}
    </div>
  );
}
