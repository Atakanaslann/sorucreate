import { NextResponse } from "next/server";
import { addFeedback, getQuestion, restoreRevision, reviseQuestion, setImage, setStatus, similarTo } from "@/lib/store";
import { aiHazir, soruRevizeEt, MODEL } from "@/lib/ai";
import { isEkle } from "@/lib/jobs";
import { manuelRevizyonPromptu, normalizeCikti, yapistirilaniAyristir } from "@/lib/prompts";
import { OLMAMIS_NEDENLERI } from "@/lib/types";
import type { OlmamisNedeni } from "@/lib/types";

const etiket = (ns: OlmamisNedeni[] = []) => ns.map((n) => OLMAMIS_NEDENLERI.find((x) => x.key === n)?.label ?? n);

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_: Request, { params }: Ctx) {
  const { id } = await params;
  const s = await getQuestion(id);
  if (!s) return NextResponse.json({ error: "Soru bulunamadı" }, { status: 404 });
  return NextResponse.json({ soru: s, benzerler: await similarTo(id) });
}

type Body =
  | { action: "olmus" }
  | { action: "olmamis"; nedenler: OlmamisNedeni[]; not?: string; aksiyon: "revize" | "kaldir" }
  | { action: "geri_al" }
  | { action: "ai_revize" }
  | { action: "surum"; surum: number }
  | { action: "gorsel"; url?: string }
  | { action: "revizyon_prompt" }
  | { action: "revizyon_yapistir"; metin: string; kaynakArac?: string };

export async function PATCH(req: Request, { params }: Ctx) {
  const { id } = await params;
  const body = (await req.json()) as Body;
  const s = await getQuestion(id);
  if (!s) return NextResponse.json({ error: "Soru bulunamadı" }, { status: 404 });

  switch (body.action) {
    case "olmus":
      return NextResponse.json({ soru: await addFeedback(id, { karar: "olmus", nedenler: [] }) });
    case "olmamis": {
      const soru = await addFeedback(id, { karar: "olmamis", nedenler: body.nedenler ?? [], not: body.not, aksiyon: body.aksiyon });
      if (body.aksiyon === "kaldir") return NextResponse.json({ soru });
      return revize(id, body.nedenler ?? [], body.not);
    }
    case "ai_revize": {
      const son = [...s.geribildirim].reverse().find((g) => g.karar === "olmamis");
      return revize(id, son?.nedenler ?? [], son?.not);
    }
    case "revizyon_prompt": {
      const son = [...s.geribildirim].reverse().find((g) => g.karar === "olmamis");
      return NextResponse.json({ prompt: manuelRevizyonPromptu(s, son?.nedenler ?? [], son?.not) });
    }
    case "revizyon_yapistir": {
      try {
        const [ilk] = yapistirilaniAyristir(body.metin ?? "");
        if (!ilk) throw new Error("Yanıtta soru bulunamadı.");
        const son = [...s.geribildirim].reverse().find((g) => g.karar === "olmamis");
        const soru = await reviseQuestion(id, normalizeCikti(ilk, s.sinav, s.tur), [...etiket(son?.nedenler), son?.not].filter(Boolean).join(" · ") || "Manuel revizyon", body.kaynakArac || "sohbet aracı");
        return NextResponse.json({ soru, benzerler: await similarTo(id) });
      } catch (e) {
        return NextResponse.json({ error: (e as Error).message }, { status: 422 });
      }
    }
    case "geri_al":
      return NextResponse.json({ soru: await setStatus(id, "taslak") });
    case "surum":
      return NextResponse.json({ soru: await restoreRevision(id, body.surum) });
    case "gorsel":
      if (body.url && body.url.length > 6_000_000) return NextResponse.json({ error: "Görsel 4 MB'tan küçük olmalı" }, { status: 413 });
      return NextResponse.json({ soru: await setImage(id, body.url) });
  }
  return NextResponse.json({ error: "Geçersiz işlem" }, { status: 400 });
}

async function revize(id: string, nedenler: OlmamisNedeni[], not?: string) {
  if (!aiHazir()) {
    // Abonelik yolu: revizyonu kuyruğa ekle, Claude Code üreticisi yapar.
    const is = await isEkle({ tip: "revize", soruId: id, nedenler, not });
    return NextResponse.json({ soru: await getQuestion(id), is });
  }
  try {
    const cur = await getQuestion(id);
    const icerik = await soruRevizeEt(cur!, nedenler, not);
    const soru = await reviseQuestion(id, icerik, [...etiket(nedenler), not].filter(Boolean).join(" · "), MODEL);
    return NextResponse.json({ soru, benzerler: await similarTo(id) });
  } catch (e) {
    return NextResponse.json({ soru: await getQuestion(id), uyari: `Revizyon başarısız: ${(e as Error).message}` });
  }
}
