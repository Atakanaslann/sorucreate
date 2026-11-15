/**
 * Yerel üretici: uygulama Vercel gibi bir sunucuda çalışırken, "Üret" ile kuyruğa
 * düşen işleri BU bilgisayardaki Claude Code aboneliğiyle yapar.
 *
 *   npm run worker
 *
 * Gerekli: .env.local içinde SUPABASE_URL ve SUPABASE_SERVICE_ROLE_KEY,
 * ve bu bilgisayarda `claude` komutuyla Claude hesabına giriş yapılmış olması.
 */
import { kuyruguCalistir } from "../src/lib/jobs";
import { claudeCodeSurumu } from "../src/lib/claudeCode";
import { supabaseHazir } from "../src/lib/backend";

const ARALIK = 4000;

async function main() {
  if (!supabaseHazir()) {
    console.error("SUPABASE_URL ve SUPABASE_SERVICE_ROLE_KEY tanımlı değil (.env.local). Yerel modda üretici zaten `npm run dev` içinde çalışır.");
    process.exit(1);
  }
  const surum = await claudeCodeSurumu();
  if (!surum) {
    console.error("Claude Code bulunamadı. Kurulum: npm i -g @anthropic-ai/claude-code  ve ardından  claude  komutuyla giriş yapın.");
    process.exit(1);
  }
  console.log(`SoruCreate üreticisi hazır · Claude Code ${surum} · kuyruk dinleniyor…`);
  for (;;) {
    try {
      const n = await kuyruguCalistir();
      if (n) console.log(`${new Date().toLocaleTimeString("tr-TR")} · ${n} iş tamamlandı`);
    } catch (e) {
      console.error("Hata:", (e as Error).message);
    }
    await new Promise((r) => setTimeout(r, ARALIK));
  }
}
main();
