import "server-only";
import spawn from "cross-spawn";
import { z } from "zod";
import { SISTEM, TopluSchema, ciktiDogrula, type SoruCikti } from "./prompts";

/**
 * Claude Code CLI'yi (claude -p) çalıştırır. CLI, kullanıcının `claude` ile giriş yaptığı
 * Claude Pro/Max ABONELİĞİNİ kullanır; API anahtarı gerekmez ve kullanılmaz.
 */

const BIN = () => process.env.CLAUDE_BIN || "claude";
const MODEL = () => process.env.CLAUDE_CODE_MODEL || "opus";
const SURE_MS = 15 * 60 * 1000;

function ortam() {
  const env = { ...process.env };
  // Bu değişkenler varsa CLI aboneliği değil API'yi faturalar: alt sürece geçirme.
  delete env.ANTHROPIC_API_KEY;
  delete env.ANTHROPIC_AUTH_TOKEN;
  return env;
}

function calistir(args: string[], stdin?: string): Promise<{ kod: number | null; out: string; err: string }> {
  return new Promise((resolve, reject) => {
    const p = spawn(BIN(), args, { env: ortam(), stdio: ["pipe", "pipe", "pipe"] });
    let out = "";
    let err = "";
    const t = setTimeout(() => p.kill("SIGTERM"), SURE_MS);
    p.stdout!.on("data", (d) => (out += d));
    p.stderr!.on("data", (d) => (err += d));
    p.on("error", (e) => {
      clearTimeout(t);
      reject(new Error(`Claude Code başlatılamadı (${BIN()}): ${e.message}. Kurulum: npm i -g @anthropic-ai/claude-code, ardından 'claude' ile giriş yapın.`));
    });
    p.on("close", (kod) => {
      clearTimeout(t);
      resolve({ kod, out, err });
    });
    if (stdin !== undefined) p.stdin!.end(stdin);
    else p.stdin!.end();
  });
}

let surumOnbellek: { t: number; surum: string | null } | null = null;
export async function claudeCodeSurumu() {
  if (surumOnbellek && Date.now() - surumOnbellek.t < 60_000) return surumOnbellek.surum;
  try {
    const r = await calistir(["--version"]);
    surumOnbellek = { t: Date.now(), surum: r.kod === 0 ? r.out.trim() : null };
  } catch {
    surumOnbellek = { t: Date.now(), surum: null };
  }
  return surumOnbellek.surum;
}

export async function claudeCodeIleSor(prompt: string): Promise<{ sorular: SoruCikti[]; model: string }> {
  const { $schema: _s, ...jsonSchema } = z.toJSONSchema(TopluSchema) as Record<string, unknown>;
  void _s;
  const schema = JSON.stringify(jsonSchema);
  const args = [
    "-p",
    "--output-format", "json",
    "--json-schema", schema,
    "--system-prompt", SISTEM,
    "--model", MODEL(),
    "--tools", "",
    "--strict-mcp-config",
    "--no-session-persistence",
  ];
  const r = await calistir(args, prompt);
  let sonuc: { is_error?: boolean; result?: string; structured_output?: { sorular?: unknown[] }; modelUsage?: Record<string, unknown> };
  try {
    sonuc = JSON.parse(r.out);
  } catch {
    throw new Error(`Claude Code beklenmeyen çıktı verdi (kod ${r.kod}). ${(r.err || r.out).slice(0, 400)}`);
  }
  if (sonuc.is_error) throw new Error(`Claude Code hatası: ${String(sonuc.result ?? "").slice(0, 400)}`);
  const ham = sonuc.structured_output?.sorular;
  if (!Array.isArray(ham)) throw new Error("Claude Code yapılandırılmış çıktı döndürmedi.");
  const model = Object.keys(sonuc.modelUsage ?? {})[0] ?? MODEL();
  return { sorular: ham.map((x, i) => ciktiDogrula(x, i)), model };
}
