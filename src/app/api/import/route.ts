import { NextResponse } from "next/server";
import { createQuestions, listQuestions, findSimilar } from "@/lib/store";
import { uretimIstegiKur, type IstekGovdesi } from "@/lib/context";
import { manuelUretimPromptu, normalizeCikti, yapistirilaniAyristir } from "@/lib/prompts";
import { SINAVLAR } from "@/lib/types";

/**
 * API'siz mod.
 *  - { asama: "prompt", ... }  → sohbet aracına yapıştırılacak tam promptu döner
 *  - { asama: "ice-aktar", metin, kaynakArac } → yapıştırılan yanıtı doğrulayıp havuza ekler
 */
export async function POST(req: Request) {
  const b = (await req.json()) as IstekGovdesi & { asama: "prompt" | "ice-aktar"; adet?: number; metin?: string; kaynakArac?: string };
  if (!SINAVLAR.includes(b.sinav)) return NextResponse.json({ error: "Geçersiz sınav" }, { status: 400 });
  const istek = await uretimIstegiKur(b);
  if (!istek) return NextResponse.json({ error: "Kazanım bulunamadı" }, { status: 400 });

  if (b.asama === "prompt") {
    const adet = Math.min(Math.max(1, Number(b.adet) || 1), 10);
    return NextResponse.json({ prompt: manuelUretimPromptu(istek, adet) });
  }

  let icerikler;
  try {
    icerikler = yapistirilaniAyristir(b.metin ?? "").map((c) => normalizeCikti(c, istek.sinav, istek.tur));
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 422 });
  }
  if (!icerikler.length) return NextResponse.json({ error: "Yanıtta soru bulunamadı." }, { status: 422 });
  const { tema: _t, kacinilacaklar: _k, mevcutKokler: _m, ...etiket } = istek;
  void _t; void _k; void _m;
  const created = await createQuestions(
    icerikler.map((icerik) => ({ ...icerik, ...etiket, meta: { kaynak: "manuel" as const, model: b.kaynakArac || "sohbet aracı" } })),
  );
  const havuz = await listQuestions({});
  return NextResponse.json({ sorular: created.map((s) => ({ soru: s, benzerler: findSimilar(havuz, s) })), hatalar: [] });
}
