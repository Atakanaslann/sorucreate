import { NextResponse } from "next/server";
import { aiHazir, soruUret, MODEL } from "@/lib/ai";
import { createQuestions, listQuestions, findSimilar } from "@/lib/store";
import { kazanimBul } from "@/data/curriculum";
import { OLMAMIS_NEDENLERI, SINAVLAR } from "@/lib/types";
import type { Sinav, SoruTuru, Zorluk } from "@/lib/types";

export const maxDuration = 300;

interface Body {
  sinav: Sinav;
  ders: string;
  kazanimKodu: string;
  zorluk: Zorluk;
  tur: SoruTuru;
  adet: number;
  tema?: string;
}

export async function POST(req: Request) {
  if (!aiHazir())
    return NextResponse.json({ error: "Soru üretmek için .env.local dosyasına ANTHROPIC_API_KEY eklenmeli." }, { status: 503 });
  const b = (await req.json()) as Body;
  if (!SINAVLAR.includes(b.sinav)) return NextResponse.json({ error: "Geçersiz sınav" }, { status: 400 });
  const bul = kazanimBul(b.sinav, b.ders, b.kazanimKodu);
  if (!bul) return NextResponse.json({ error: "Kazanım bulunamadı" }, { status: 400 });
  const adet = Math.min(Math.max(1, Number(b.adet) || 1), 5);

  const tumu = await listQuestions({ durum: undefined });
  const ayni = tumu.filter((s) => s.kazanimKodu === b.kazanimKodu).slice(0, 8);
  const sayac: Record<string, number> = {};
  for (const s of tumu) for (const g of s.geribildirim) if (g.karar === "olmamis") {
    for (const n of g.nedenler) sayac[n] = (sayac[n] ?? 0) + 1;
  }
  const kacin = Object.entries(sayac)
    .sort((a, c) => c[1] - a[1])
    .slice(0, 3)
    .map(([k]) => OLMAMIS_NEDENLERI.find((x) => x.key === k)?.label ?? k);
  const notlar = tumu.flatMap((s) => s.geribildirim).filter((g) => g.not).slice(-5).map((g) => g.not!);

  const sonuclar = await Promise.allSettled(
    Array.from({ length: adet }, () =>
      soruUret({
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
      }),
    ),
  );
  const ok = sonuclar.flatMap((r) => (r.status === "fulfilled" ? [r.value] : []));
  const hatalar = sonuclar.flatMap((r) => (r.status === "rejected" ? [String((r.reason as Error)?.message ?? r.reason)] : []));

  const created = await createQuestions(
    ok.map((icerik) => ({
      ...icerik,
      sinav: b.sinav,
      ders: b.ders,
      sinif: bul.kazanim.sinif,
      unite: bul.unite.ad,
      kazanimKodu: bul.kazanim.kod,
      kazanimMetni: bul.kazanim.metin,
      zorluk: b.zorluk,
      tur: b.tur,
      meta: { kaynak: "claude" as const, model: MODEL },
    })),
  );
  const havuz = await listQuestions({});
  return NextResponse.json({
    sorular: created.map((s) => ({ soru: s, benzerler: findSimilar(havuz, s) })),
    hatalar,
  });
}
