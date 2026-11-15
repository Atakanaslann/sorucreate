import { Suspense } from "react";
import Link from "next/link";
import { Sparkles } from "lucide-react";
import { listQuestions } from "@/lib/store";
import { PoolFilters } from "@/components/PoolFilters";
import { PoolCard } from "@/components/PoolCard";

export const dynamic = "force-dynamic";

export default async function Havuz({ searchParams }: { searchParams: Promise<Record<string, string>> }) {
  const sp = await searchParams;
  const sorular = await listQuestions(sp);
  return (
    <div className="mx-auto max-w-7xl space-y-6 pb-20">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="label">Soru havuzu</p>
          <h1 className="mt-2 font-display text-4xl tracking-tight">{sorular.length} soru</h1>
        </div>
        <Link href="/uret" className="btn btn-primary"><Sparkles size={16} /> Yeni soru</Link>
      </header>
      <Suspense><PoolFilters /></Suspense>
      {sorular.length === 0 ? (
        <div className="card p-12 text-center text-muted">Bu filtrelere uyan soru yok.</div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {sorular.map((s) => <PoolCard key={s.id} soru={s} />)}
        </div>
      )}
    </div>
  );
}
