import clsx from "clsx";
import type { SoruIcerik } from "@/lib/types";
import { QuestionFigure } from "./QuestionFigure";

/** **kalın** işaretlemesini basitçe <strong>'a çevirir. */
export function Rich({ text }: { text: string }) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return (
    <>
      {parts.map((p, i) =>
        p.startsWith("**") && p.endsWith("**") ? <strong key={i} className="font-semibold">{p.slice(2, -2)}</strong> : <span key={i}>{p}</span>,
      )}
    </>
  );
}

export function QuestionBody({
  soru,
  numara,
  cevapGoster = false,
  compact = false,
  secili,
  onSec,
}: {
  soru: SoruIcerik;
  numara?: number;
  cevapGoster?: boolean;
  compact?: boolean;
  /** İnceleme modunda kullanıcının işaretlediği şık */
  secili?: string | null;
  onSec?: (harf: string) => void;
}) {
  const uzun = soru.secenekler.some((s) => s.metin.length > 38);
  return (
    <div className={clsx("leading-[1.7] text-ink", compact ? "text-[13px]" : "text-[15.5px]")}>
      <div className="flex gap-3.5">
        {numara !== undefined && <span className="tabular shrink-0 font-display text-xl font-semibold leading-[1.45]">{numara}.</span>}
        <div className="min-w-0 flex-1 space-y-5">
          <p className="whitespace-pre-line text-ink-2"><Rich text={soru.senaryo} /></p>
          {soru.gorsel && (
            <figure className="rounded-2xl border border-line bg-white p-3 sm:p-4">
              <QuestionFigure gorsel={soru.gorsel} />
            </figure>
          )}
          <p className="whitespace-pre-line font-semibold"><Rich text={soru.kok} /></p>
          <div className={clsx("grid gap-2", compact || uzun ? "grid-cols-1" : "sm:grid-cols-2")}>
            {soru.secenekler.map((s) => {
              const dogru = cevapGoster && s.harf === soru.dogruCevap;
              const yanlisSecim = cevapGoster && secili === s.harf && !dogru;
              const sec = !cevapGoster && secili === s.harf;
              const Tag = onSec ? "button" : "div";
              return (
                <Tag
                  key={s.harf}
                  {...(onSec ? { type: "button" as const, onClick: () => onSec(s.harf) } : {})}
                  className={clsx(
                    "group flex items-start gap-3 rounded-xl border px-3 py-2 text-left transition duration-300",
                    dogru ? "border-ok/30 bg-ok-soft" : yanlisSecim ? "border-bad/30 bg-bad-soft" : sec ? "border-ink/30 bg-paper" : "border-transparent",
                    onSec && !cevapGoster && "hover:border-line-2 hover:bg-paper/70",
                  )}
                >
                  <span
                    className={clsx(
                      "mt-[3px] grid h-[22px] w-[22px] shrink-0 place-items-center rounded-full border text-[11.5px] font-bold transition",
                      dogru ? "border-ok bg-ok text-white" : yanlisSecim ? "border-bad bg-bad text-white" : sec ? "border-ink bg-ink text-white" : "border-ink/25 text-ink-2",
                    )}
                  >
                    {s.harf}
                  </span>
                  <span className={clsx(dogru && "font-medium text-[#0a5e42]")}><Rich text={s.metin} /></span>
                </Tag>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

/** Sınav kitapçığı görünümlü kâğıt çerçevesi. */
export function ExamPaper({ ust, children, className }: { ust: React.ReactNode; children: React.ReactNode; className?: string }) {
  return (
    <div className={clsx("relative overflow-hidden rounded-[24px] border border-line bg-[#fffefb] shadow-[var(--shadow-lg)]", className)}>
      <div className="h-1.5 bg-gradient-to-r from-[#0d1017] via-[#2a2f3d] to-[#b8873a]" />
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-dashed border-line-2 px-6 py-3 text-[11px] font-semibold uppercase tracking-[.16em] text-muted sm:px-9">
        {ust}
      </div>
      <div className="px-6 py-7 sm:px-9 sm:py-9">{children}</div>
    </div>
  );
}
