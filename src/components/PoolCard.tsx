"use client";
import Link from "next/link";
import { Check, Plus } from "lucide-react";
import clsx from "clsx";
import type { Soru } from "@/lib/types";
import { DurumBadge, TurBadge, ZorlukBadge } from "./Badges";
import { QuestionFigure } from "./QuestionFigure";
import { Rich } from "./QuestionBody";
import { useDeneme } from "./useDeneme";

export function PoolCard({ soru }: { soru: Soru }) {
  const { has, toggle } = useDeneme();
  const secili = has(soru.id);
  return (
    <div className={clsx("card group flex flex-col overflow-hidden transition hover:-translate-y-0.5", secili && "ring-2 ring-gold")}>
      <Link href={`/soru/${soru.id}`} className="flex flex-1 flex-col">
        {soru.gorsel && (
          <div className="border-b border-line bg-white p-4">
            <QuestionFigure gorsel={soru.gorsel} className="max-h-40 object-contain" />
          </div>
        )}
        <div className="flex flex-1 flex-col gap-3 p-5">
          <div className="flex items-center justify-between gap-2">
            <span className="font-mono text-xs text-muted">{soru.id}</span>
            <DurumBadge durum={soru.durum} />
          </div>
          <p className="line-clamp-3 text-sm text-ink-2"><Rich text={soru.senaryo} /></p>
          <p className="line-clamp-2 text-sm font-semibold"><Rich text={soru.kok} /></p>
          <div className="mt-auto flex flex-wrap gap-1.5 pt-2">
            <span className="chip">{soru.sinav} · {soru.ders}</span>
            <ZorlukBadge zorluk={soru.zorluk} />
            <TurBadge tur={soru.tur} />
          </div>
          <div className="text-xs text-muted">{soru.unite} · <span className="font-mono">{soru.kazanimKodu}</span></div>
        </div>
      </Link>
      <button
        onClick={() => toggle(soru.id)}
        className={clsx("flex items-center justify-center gap-2 border-t border-line py-2.5 text-sm font-semibold transition", secili ? "bg-gold-soft text-[#8a6418]" : "text-ink-2 hover:bg-paper")}
      >
        {secili ? <><Check size={15} /> Denemede</> : <><Plus size={15} /> Denemeye ekle</>}
      </button>
    </div>
  );
}
