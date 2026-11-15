import clsx from "clsx";
import type { SoruIcerik } from "@/lib/types";
import { QuestionFigure } from "./QuestionFigure";

/** **kalın** işaretlemesini basitçe <strong>'a çevirir. */
export function Rich({ text }: { text: string }) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return (
    <>
      {parts.map((p, i) =>
        p.startsWith("**") && p.endsWith("**") ? <strong key={i}>{p.slice(2, -2)}</strong> : <span key={i}>{p}</span>,
      )}
    </>
  );
}

export function QuestionBody({
  soru,
  numara,
  cevapGoster = false,
  compact = false,
}: {
  soru: SoruIcerik;
  numara?: number;
  cevapGoster?: boolean;
  compact?: boolean;
}) {
  return (
    <div className={clsx("text-[15px] leading-relaxed text-ink", compact && "text-[13px]")}>
      <div className="flex gap-3">
        {numara !== undefined && <span className="font-display text-lg font-semibold">{numara}.</span>}
        <div className="min-w-0 flex-1 space-y-4">
          <p className="whitespace-pre-line"><Rich text={soru.senaryo} /></p>
          {soru.gorsel && <QuestionFigure gorsel={soru.gorsel} className="rounded-lg" />}
          <p className="whitespace-pre-line font-semibold"><Rich text={soru.kok} /></p>
          <div className={clsx("grid gap-2", compact ? "grid-cols-1" : "sm:grid-cols-2")}>
            {soru.secenekler.map((s) => (
              <div
                key={s.harf}
                className={clsx(
                  "flex items-start gap-2 rounded-lg px-2 py-1",
                  cevapGoster && s.harf === soru.dogruCevap && "bg-ok-soft",
                )}
              >
                <span className={clsx("font-semibold", cevapGoster && s.harf === soru.dogruCevap && "text-ok")}>{s.harf})</span>
                <span><Rich text={s.metin} /></span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
