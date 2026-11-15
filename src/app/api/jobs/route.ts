import { NextResponse } from "next/server";
import { backend, supabaseHazir } from "@/lib/backend";
import { claudeCodeSurumu } from "@/lib/claudeCode";
import { dahiliUretici, isEkle, kuyruguCalistir } from "@/lib/jobs";
import { getQuestions } from "@/lib/store";
import { SINAVLAR } from "@/lib/types";
import type { UretIstegi } from "@/lib/types";

export async function GET(req: Request) {
  const id = new URL(req.url).searchParams.get("id");
  if (id) {
    const is = await backend().isGetir(id);
    if (!is) return NextResponse.json({ error: "İş bulunamadı" }, { status: 404 });
    // Dahili üreticide sunucu yeniden başladıysa kuyruk takılı kalmasın.
    if (is.durum === "kuyrukta" && dahiliUretici()) void kuyruguCalistir();
    return NextResponse.json({ is, sorular: is.durum === "tamam" ? await getQuestions(is.soru_idleri) : [] });
  }
  const dahili = dahiliUretici();
  return NextResponse.json({
    isler: await backend().isListe(10),
    dahili,
    claude: dahili ? await claudeCodeSurumu() : null,
    depo: supabaseHazir() ? "supabase" : "yerel",
  });
}

export async function POST(req: Request) {
  const b = (await req.json()) as UretIstegi;
  if (!SINAVLAR.includes(b.sinav)) return NextResponse.json({ error: "Geçersiz sınav" }, { status: 400 });
  const is = await isEkle({ ...b, tip: "uret", adet: Math.min(Math.max(1, Number(b.adet) || 1), 10) });
  return NextResponse.json({ is });
}
