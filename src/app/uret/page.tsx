import { aiHazir } from "@/lib/ai";
import { stats } from "@/lib/store";
import { Generator } from "@/components/Generator";

export const dynamic = "force-dynamic";

export default async function Uret() {
  const st = await stats();
  return <Generator ai={aiHazir()} bugun={st.bugun} />;
}
