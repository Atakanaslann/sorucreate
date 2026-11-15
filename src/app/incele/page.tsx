import { listQuestions } from "@/lib/store";
import { Inceleme } from "@/components/Inceleme";

export const dynamic = "force-dynamic";

export default async function IncelePage() {
  const sorular = (await listQuestions({ durum: "taslak" })).reverse();
  return <Inceleme sorular={sorular} />;
}
