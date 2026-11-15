import "server-only";
import { hostname } from "os";
import { backend } from "./backend";
import { claudeCodeIleSor } from "./claudeCode";
import { uretimIstegiKur } from "./context";
import { normalizeCikti, revizyonPromptu, uretimPromptu } from "./prompts";
import { createQuestions, getQuestion, reviseQuestion } from "./store";
import { OLMAMIS_NEDENLERI } from "./types";
import type { UretimIsi } from "./types";

/** Üretim kuyruğu: "Üret" bir iş ekler; üretici (Next sunucusu ya da `npm run worker`) işi Claude Code ile yapar. */

export const dahiliUretici = () => process.env.URETICI !== "harici" && !process.env.VERCEL;

async function isle(is: UretimIsi): Promise<string[]> {
  const ist = is.istek;
  if (ist.tip === "uret") {
    const istek = await uretimIstegiKur(ist);
    if (!istek) throw new Error("Kazanım bulunamadı");
    const adet = Math.min(Math.max(1, ist.adet || 1), 10);
    const { sorular, model } = await claudeCodeIleSor(uretimPromptu(istek, adet));
    const { tema: _t, kacinilacaklar: _k, mevcutKokler: _m, ...etiket } = istek;
    void _t; void _k; void _m;
    const icerikler = sorular.map((c) => normalizeCikti(c, istek.sinav, istek.tur));
    const created = await createQuestions(icerikler.map((icerik) => ({ ...icerik, ...etiket, meta: { kaynak: "abonelik" as const, model } })));
    return created.map((s) => s.id);
  }
  const s = await getQuestion(ist.soruId);
  if (!s) throw new Error("Soru bulunamadı");
  const { sorular, model } = await claudeCodeIleSor(revizyonPromptu(s, ist.nedenler, ist.not) + "\n\n\"sorular\" dizisinde yalnızca düzeltilmiş 1 soru olsun.");
  if (!sorular[0]) throw new Error("Revizyon boş döndü");
  const etiket = ist.nedenler.map((n) => OLMAMIS_NEDENLERI.find((x) => x.key === n)?.label ?? n);
  await reviseQuestion(s.id, normalizeCikti(sorular[0], s.sinav, s.tur), [...etiket, ist.not].filter(Boolean).join(" · ") || "Revizyon", model, "abonelik");
  return [s.id];
}

let calisiyor = false;
/** Kuyruktaki işleri sırayla bitirir. Aynı süreçte ikinci kez çağrılırsa beklemeden döner. */
export async function kuyruguCalistir(isci = `${hostname()}:${process.pid}`) {
  if (calisiyor) return 0;
  calisiyor = true;
  let n = 0;
  try {
    for (;;) {
      const is = await backend().isAl(isci);
      if (!is) break;
      n++;
      try {
        const ids = await isle(is);
        await backend().isGuncelle(is.id, { durum: "tamam", soru_idleri: ids, bitis: new Date().toISOString() });
      } catch (e) {
        await backend().isGuncelle(is.id, { durum: "hata", hata: (e as Error).message, bitis: new Date().toISOString() });
      }
    }
  } finally {
    calisiyor = false;
  }
  return n;
}

export async function isEkle(istek: UretimIsi["istek"]) {
  const is = await backend().isEkle(istek);
  if (dahiliUretici()) void kuyruguCalistir();
  return is;
}
