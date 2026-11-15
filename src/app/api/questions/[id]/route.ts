import { NextResponse } from "next/server";
import { addFeedback, getQuestion, restoreRevision, reviseQuestion, setImage, setStatus, similarTo } from "@/lib/store";
import { aiHazir, soruRevizeEt, MODEL } from "@/lib/ai";
import type { OlmamisNedeni } from "@/lib/types";

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
  | { action: "gorsel"; url?: string };

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
    return NextResponse.json({
      soru: await getQuestion(id),
      uyari: "ANTHROPIC_API_KEY tanımlı değil; soru 'Revizyonda' olarak işaretlendi. Anahtar eklendiğinde 'AI ile revize et' ile yeniden deneyin.",
    });
  }
  try {
    const cur = await getQuestion(id);
    const icerik = await soruRevizeEt(cur!, nedenler, not);
    const soru = await reviseQuestion(id, icerik, [...nedenler, not].filter(Boolean).join(" · "), MODEL);
    return NextResponse.json({ soru, benzerler: await similarTo(id) });
  } catch (e) {
    return NextResponse.json({ soru: await getQuestion(id), uyari: `Revizyon başarısız: ${(e as Error).message}` });
  }
}
