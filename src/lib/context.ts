import "server-only";
import { listQuestions } from "./store";
import { OLMAMIS_NEDENLERI } from "./types";
import { kazanimBul } from "@/data/curriculum";
import type { UretimIstegi } from "./prompts";
import type { Sinav, SoruTuru, Zorluk } from "./types";

export interface IstekGovdesi {
  sinav: Sinav;
  ders: string;
  kazanimKodu: string;
  zorluk: Zorluk;
  tur: SoruTuru;
  tema?: string;
}

/** Üretim isteğini havuz bağlamıyla (reddedilen sorun türleri, mevcut sorular) zenginleştirir. */
export async function uretimIstegiKur(b: IstekGovdesi): Promise<UretimIstegi | null> {
  const bul = kazanimBul(b.sinav, b.ders, b.kazanimKodu);
  if (!bul) return null;
  const tumu = await listQuestions({});
  const ayni = tumu.filter((s) => s.kazanimKodu === b.kazanimKodu).slice(0, 8);
  const sayac: Record<string, number> = {};
  for (const s of tumu) for (const g of s.geribildirim) if (g.karar === "olmamis") for (const n of g.nedenler) sayac[n] = (sayac[n] ?? 0) + 1;
  const kacin = Object.entries(sayac)
    .sort((a, c) => c[1] - a[1])
    .slice(0, 3)
    .map(([k]) => OLMAMIS_NEDENLERI.find((x) => x.key === k)?.label ?? k);
  const notlar = tumu.flatMap((s) => s.geribildirim).filter((g) => g.not).slice(-5).map((g) => g.not!);
  return {
    sinav: b.sinav,
    ders: b.ders,
    sinif: bul.kazanim.sinif,
    unite: bul.unite.ad,
    kazanimKodu: bul.kazanim.kod,
    kazanimMetni: bul.kazanim.metin,
    zorluk: b.zorluk,
    tur: b.tur,
    tema: b.tema,
    kacinilacaklar: [...kacin, ...notlar],
    mevcutKokler: ayni.map((s) => `${s.senaryo.slice(0, 140)} … ${s.kok}`),
  };
}
