import { NextResponse } from "next/server";
import { listQuestions } from "@/lib/store";

export async function GET(req: Request) {
  const sp = new URL(req.url).searchParams;
  const f = Object.fromEntries(sp.entries());
  return NextResponse.json(await listQuestions(f));
}
