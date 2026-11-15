import { NextResponse } from "next/server";
import { stats } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function GET() {
  const s = await stats();
  return NextResponse.json({ bugun: s.bugun, bekleyen: (s.durum.taslak ?? 0) + (s.durum.revizyonda ?? 0), toplam: s.toplam });
}
