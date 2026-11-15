/* eslint-disable @next/next/no-img-element */
import type { GorselBrif } from "@/lib/types";

export function svgDataUri(svg: string) {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

/** Yüklenen görsel varsa onu, yoksa SVG'yi gösterir. SVG <img> içinde çizildiği için script çalışamaz. */
export function QuestionFigure({ gorsel, className = "" }: { gorsel?: GorselBrif; className?: string }) {
  if (!gorsel) return null;
  const src = gorsel.url || (gorsel.svg ? svgDataUri(gorsel.svg) : null);
  if (!src)
    return (
      <div className={`grid place-items-center rounded-xl border border-dashed border-line bg-paper p-6 text-center text-sm text-muted ${className}`}>
        Görsel henüz eklenmedi — prompt hazır.
      </div>
    );
  return <img src={src} alt={gorsel.aciklama} className={`mx-auto block h-auto w-full max-w-[520px] ${className}`} />;
}
