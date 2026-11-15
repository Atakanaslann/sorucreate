import { NextResponse } from "next/server";
import { aiHazir, soruUret, MODEL } from "@/lib/ai";
import { createQuestions, listQuestions, findSimilar } from "@/lib/store";
import { uretimIstegiKur, type IstekGovdesi } from "@/lib/context";
import { SINAVLAR } from "@/lib/types";

export const maxDuration = 300;

export async function POST(req: Request) {
  if (!aiHazir())
    return NextResponse.json({ error: "API modu için .env.local dosyasına ANTHROPIC_API_KEY eklenmeli. Anahtarsız üretim için “Sohbet aracıyla” modunu kullanın." }, { status: 503 });
  const b = (await req.json()) as IstekGovdesi & { adet: number };
  if (!SINAVLAR.includes(b.sinav)) return NextResponse.json({ error: "Geçersiz sınav" }, { status: 400 });
  const istek = await uretimIstegiKur(b);
  if (!istek) return NextResponse.json({ error: "Kazanım bulunamadı" }, { status: 400 });
  const adet = Math.min(Math.max(1, Number(b.adet) || 1), 5);

  const sonuclar = await Promise.allSettled(Array.from({ length: adet }, () => soruUret(istek)));
  const ok = sonuclar.flatMap((r) => (r.status === "fulfilled" ? [r.value] : []));
  const hatalar = sonuclar.flatMap((r) => (r.status === "rejected" ? [String((r.reason as Error)?.message ?? r.reason)] : []));

  const { tema: _t, kacinilacaklar: _k, mevcutKokler: _m, ...etiket } = istek;
  void _t; void _k; void _m;
  const created = await createQuestions(ok.map((icerik) => ({ ...icerik, ...etiket, meta: { kaynak: "claude" as const, model: MODEL } })));
  const havuz = await listQuestions({});
  return NextResponse.json({ sorular: created.map((s) => ({ soru: s, benzerler: findSimilar(havuz, s) })), hatalar });
}
