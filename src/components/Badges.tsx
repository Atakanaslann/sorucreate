import clsx from "clsx";
import { ImageIcon, Type } from "lucide-react";
import { DURUM_ETIKET } from "@/lib/types";
import type { Durum, Zorluk, SoruTuru } from "@/lib/types";

export function DurumBadge({ durum }: { durum: Durum }) {
  return (
    <span
      className={clsx(
        "chip",
        durum === "onaylandi" && "!bg-ok-soft !text-ok",
        durum === "taslak" && "!bg-gold-soft !text-[#8a6418]",
        durum === "revizyonda" && "!bg-blue-soft !text-blue",
        durum === "kaldirildi" && "!bg-bad-soft !text-bad",
      )}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {DURUM_ETIKET[durum]}
    </span>
  );
}

export function ZorlukBadge({ zorluk }: { zorluk: Zorluk }) {
  return (
    <span className={clsx("chip", zorluk === "zor" ? "!bg-ink !text-white" : "")}>
      {zorluk === "zor" ? "Zor" : "Orta"}
    </span>
  );
}

export function TurBadge({ tur }: { tur: SoruTuru }) {
  return (
    <span className="chip">
      {tur === "gorselli" ? <ImageIcon size={12} /> : <Type size={12} />}
      {tur === "gorselli" ? "Yeni nesil" : "Görselsiz"}
    </span>
  );
}
