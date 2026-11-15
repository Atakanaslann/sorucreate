"use client";
import Link from "next/link";
import { ArrowUpRight, Check, Plus } from "lucide-react";
import clsx from "clsx";
import type { Soru } from "@/lib/types";
import { DurumBadge, TurBadge, ZorlukBadge } from "./Badges";
import { QuestionFigure } from "./QuestionFigure";
import { Rich } from "./QuestionBody";
import { useDeneme } from "./useDeneme";

export function PoolCard({ soru, i = 0 }: { soru: Soru; i?: number }) {
  const { has, toggle } = useDeneme();
  const secili = has(soru.id);
  return (
    <div
      className={clsx("card card-hover rise group flex flex-col overflow-hidden", secili && "!border-gold ring-4 ring-gold-soft")}
      style={{ animationDelay: `${Math.min(i, 9) * 40}ms` }}
    >
      <Link href={`/soru/${soru.id}`} className="flex flex-1 flex-col">
        {soru.gorsel && (
          <div className="relative border-b border-line bg-white px-5 pb-4 pt-5">
            <QuestionFigure gorsel={soru.gorsel} className="max-h-40 object-contain transition duration-500 group-hover:scale-[1.02]" />
          </div>
        )}
        <div className="flex flex-1 flex-col gap-3 p-5">
          <div className="flex items-center justify-between gap-2">
            <span className="font-mono text-[11.5px] font-semibold text-ink-2">{soru.id}</span>
            <DurumBadge durum={soru.durum} />
          </div>
          <p className="line-clamp-3 text-[13.5px] leading-relaxed text-ink-2"><Rich text={soru.senaryo} /></p>
          <p className="line-clamp-2 text-sm font-semibold leading-snug"><Rich text={soru.kok} /></p>
          <div className="mt-auto flex flex-wrap gap-1.5 pt-2">
            <span className="chip">{soru.sinav} · {soru.ders}</span>
            <ZorlukBadge zorluk={soru.zorluk} />
            <TurBadge tur={soru.tur} />
          </div>
          <div className="flex items-center justify-between gap-2 text-xs text-muted">
            <span className="truncate">{soru.unite} · <span className="font-mono">{soru.kazanimKodu}</span></span>
            <ArrowUpRight size={15} className="shrink-0 transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-ink" />
          </div>
        </div>
      </Link>
      <button
        onClick={() => toggle(soru.id)}
        className={clsx("flex items-center justify-center gap-2 border-t border-line py-3 text-[13px] font-semibold transition", secili ? "bg-gold-soft text-[#7a5716]" : "text-ink-2 hover:bg-paper")}
      >
        {secili ? <><Check size={15} /> Denemede</> : <><Plus size={15} /> Denemeye ekle</>}
      </button>
    </div>
  );
}
