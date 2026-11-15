import { notFound } from "next/navigation";
import { getQuestion, similarTo } from "@/lib/store";
import { aiHazir } from "@/lib/ai";
import { QuestionDetail } from "@/components/QuestionDetail";

export const dynamic = "force-dynamic";

export default async function SoruSayfasi({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const soru = await getQuestion(id);
  if (!soru) notFound();
  return <QuestionDetail soru={soru} benzerler={await similarTo(id)} ai={aiHazir()} />;
}
