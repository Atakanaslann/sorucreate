import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import { SoruSchema, SISTEM, normalizeCikti, uretimPromptu, revizyonPromptu } from "./prompts";
import type { UretimIstegi } from "./prompts";
import type { SoruIcerik, Soru, OlmamisNedeni } from "./types";

export type { UretimIstegi };

export const MODEL = "claude-opus-5-5";

export function aiHazir() {
  return Boolean(process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_AUTH_TOKEN);
}

function client() {
  return new Anthropic();
}

async function cagir(prompt: string) {
  const res = await client().beta.messages.parse({
    model: MODEL,
    max_tokens: 16000,
    betas: ["server-side-fallback-2026-07-01"],
    fallbacks: "default",
    thinking: { type: "adaptive" },
    output_config: { effort: "high", format: betaZodOutputFormat(SoruSchema) },
    system: SISTEM,
    messages: [{ role: "user", content: prompt }],
  });
  if (res.stop_reason === "refusal") throw new Error("Model bu isteği yanıtlamadı (refusal).");
  if (res.stop_reason === "max_tokens") throw new Error("Yanıt uzunluk sınırına takıldı, tekrar deneyin.");
  if (!res.parsed_output) throw new Error("Model çıktısı şemaya uymadı.");
  return res.parsed_output;
}

export async function soruUret(r: UretimIstegi): Promise<SoruIcerik> {
  return normalizeCikti(await cagir(uretimPromptu(r)), r.sinav, r.tur);
}

export async function soruRevizeEt(s: Soru, nedenler: OlmamisNedeni[], not?: string): Promise<SoruIcerik> {
  return normalizeCikti(await cagir(revizyonPromptu(s, nedenler, not)), s.sinav, s.tur);
}
