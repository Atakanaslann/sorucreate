import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import { z } from "zod";
import { secenekHarfleri, OLMAMIS_NEDENLERI } from "./types";
import type { Sinav, SoruIcerik, Soru, OlmamisNedeni, SoruTuru, Zorluk } from "./types";

export const MODEL = "claude-opus-5-5";

export function aiHazir() {
  return Boolean(process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_AUTH_TOKEN);
}

const SoruSchema = z.object({
  senaryo: z.string().describe("Günlük hayat bağlamı ve verilenler (1-4 cümle). Görselli soruda görsele atıf yapar."),
  kok: z.string().describe("Soru kökü. Genellikle 'Buna göre, ...' ile başlar ve tek bir şey sorar."),
  secenekler: z.array(
    z.object({
      harf: z.string(),
      metin: z.string(),
      gerekce: z.string().describe("Doğru seçenek için kısa doğrulama; çeldirici için hangi tipik öğrenci hatasından türediği."),
    }),
  ),
  dogruCevap: z.string().describe("Doğru seçeneğin harfi"),
  cozum: z.string().describe("Adım adım çözüm, satırlar \\n ile ayrılır"),
  beceri: z.string().describe("Ölçülen üst düzey beceri: Modelleme, Grafik okuma, Akıl yürütme, Problem çözme, Yorumlama, İşlem"),
  gorsel: z
    .object({
      aciklama: z.string().describe("Görselin Türkçe, eksiksiz tarifi: hangi nesneler, hangi sayılar/etiketler nerede"),
      prompt: z.string().describe("Görsel üretim modeli için İngilizce prompt (flat vector textbook illustration)"),
      negatifPrompt: z.string(),
      zorunluOgeler: z.array(z.string()).describe("Görselde birebir okunması gereken sayı ve etiketler"),
      svg: z.string().nullable().describe("Çözüm için gereken tüm veriyi taşıyan, kesin ölçülü, bağımsız SVG; gerekmiyorsa null"),
    })
    .nullable(),
});
type SoruCikti = z.infer<typeof SoruSchema>;

const SISTEM = `Sen Türkiye'de TYT, AYT ve LGS için soru yazan kıdemli bir ölçme-değerlendirme uzmanısın.

TEMEL KURALLAR
- Soru, verilen MEB kazanımını doğrudan ölçmeli; kazanım dışı bilgi gerektirmemeli. Sınıf düzeyini aşma.
- Zorluk yalnızca "orta" veya "zor". Zor sorular çok adımlı akıl yürütme, modelleme veya veri yorumlama ister; işlem kalabalığıyla zorlaştırma.
- Dil: sade, akıcı, ÖSYM/MEB üslubunda Türkçe. Olumsuz veya kritik ifadeleri (en az, en çok, değildir) **kalın** yaz.
- Tam olarak bir doğru cevap olmalı. Çeldiriciler tipik öğrenci hatalarından türemeli; her birinin gerekçesini yaz.
- Seçenekler sayısal ise küçükten büyüğe sırala. Doğru cevabın harfini dengeli dağıt (hep aynı harf olmasın).
- Soruyu yazdıktan sonra kendin baştan çöz; cevap, seçenek ve çözüm birbirini tutmalı. Ondalık ayırıcı virgül.
- ÖZGÜNLÜK: Yayınevi ya da ÖSYM sorularını kopyalama, sayı/kurgu değiştirerek uyarlama da yapma. Senaryo ve sayılar özgün olsun.
- Kaynak etiketi ("(TYT 2018)" gibi) yazma.

YENİ NESİL (GÖRSELLİ) SORU KURALLARI
- Günlük hayattan somut bir bağlam kur (ör. üst üste dizilmiş karton bardaklar, yırtık kâğıtta okunamayan semboller, futbol topunun hızı, raf düzeni, fayans deseni, menü, harita).
- Çözüm için gereken bilgi GÖRSELDE olmalı (ölçüler, etiketler, sayılar, desen). Metin görselin tekrarı olmamalı; görsel olmadan soru çözülememeli.
- Görsel; beyaz zeminli, temiz, düz (flat) vektör ders kitabı illüstrasyonu tarzında; pastel ama ayırt edilebilir renkler, gölgesiz.
- "svg" alanına kesin ölçülü bir SVG çiz: <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 W H"> (W 400–560, H 200–360), ilk eleman beyaz arka plan <rect>. Yalnızca temel şekiller (rect, circle, ellipse, line, polyline, polygon, path, text, g). Script, foreignObject, image, dış bağlantı, CSS animasyonu YOK. font-family="Inter, Arial, sans-serif", metin boyutu ≥ 12, etiketler Türkçe. Sayılar ve oranlar soruyla birebir tutarlı olmalı.
- "prompt" alanı, aynı sahnenin daha zengin bir illüstrasyonu için İngilizce görsel üretim promptudur: sahne, nesneler, kompozisyon, renk paleti, stil. Görselde sayı/yazı gerekiyorsa tam olarak hangileri olduğunu belirt, başka yazı olmasın.

GÖRSELSİZ SORU: "gorsel" alanını null bırak; senaryo yine bağlamlı olabilir.`;

function client() {
  return new Anthropic();
}

async function cagir(prompt: string): Promise<SoruCikti> {
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

export function sanitizeSvg(svg: string | null | undefined) {
  if (!svg) return undefined;
  const s = svg
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<foreignObject[\s\S]*?<\/foreignObject>/gi, "")
    .replace(/<image[\s\S]*?>/gi, "")
    .replace(/\son\w+\s*=\s*("[^"]*"|'[^']*')/gi, "")
    .replace(/(xlink:)?href\s*=\s*("[^"]*"|'[^']*')/gi, "");
  return s.trim().startsWith("<svg") ? s : undefined;
}

function normalize(out: SoruCikti, sinav: Sinav, tur: SoruTuru): SoruIcerik {
  const harfler = secenekHarfleri(sinav);
  const secenekler = out.secenekler.slice(0, harfler.length).map((s, i) => ({ ...s, harf: harfler[i] }));
  if (secenekler.length !== harfler.length) throw new Error(`Seçenek sayısı ${harfler.length} olmalıydı.`);
  const dogru = out.dogruCevap.trim().toUpperCase().slice(0, 1);
  if (!harfler.includes(dogru)) throw new Error("Doğru cevap seçeneklerde yok.");
  return {
    senaryo: out.senaryo,
    kok: out.kok,
    secenekler,
    dogruCevap: dogru,
    cozum: out.cozum,
    beceri: out.beceri,
    gorsel:
      tur === "gorselli" && out.gorsel
        ? { ...out.gorsel, svg: sanitizeSvg(out.gorsel.svg) }
        : undefined,
  };
}

export interface UretimIstegi {
  sinav: Sinav;
  ders: string;
  sinif: number;
  unite: string;
  kazanimKodu: string;
  kazanimMetni: string;
  zorluk: Zorluk;
  tur: SoruTuru;
  tema?: string;
  kacinilacaklar?: string[];
  mevcutKokler?: string[];
}

export async function soruUret(r: UretimIstegi): Promise<SoruIcerik> {
  const harfler = secenekHarfleri(r.sinav);
  const prompt = `Aşağıdaki özelliklere göre 1 adet soru yaz.

Sınav: ${r.sinav} (${harfler.length} seçenek: ${harfler.join(", ")})
Ders: ${r.ders} — ${r.sinif}. sınıf
Ünite: ${r.unite}
Kazanım: ${r.kazanimKodu} — ${r.kazanimMetni}
Zorluk: ${r.zorluk}
Tür: ${r.tur === "gorselli" ? "YENİ NESİL, GÖRSELLİ (gorsel alanı ve svg zorunlu)" : "GÖRSELSİZ (gorsel = null)"}
${r.tema ? `Bağlam/tema önerisi: ${r.tema}` : "Bağlamı sen seç; özgün ve öğrencinin günlük hayatına yakın olsun."}
${r.kacinilacaklar?.length ? `\nEditörün daha önce reddettiği sorulardaki sorunlar (bunlardan kaçın):\n- ${r.kacinilacaklar.join("\n- ")}` : ""}
${r.mevcutKokler?.length ? `\nBu kazanımda havuzda zaten olan sorular (bunlara benzeme):\n- ${r.mevcutKokler.join("\n- ")}` : ""}`;
  return normalize(await cagir(prompt), r.sinav, r.tur);
}

export async function soruRevizeEt(s: Soru, nedenler: OlmamisNedeni[], not?: string): Promise<SoruIcerik> {
  const etiketler = nedenler.map((n) => OLMAMIS_NEDENLERI.find((x) => x.key === n)?.label ?? n);
  const mevcut = {
    senaryo: s.senaryo,
    kok: s.kok,
    secenekler: s.secenekler,
    dogruCevap: s.dogruCevap,
    cozum: s.cozum,
    gorsel: s.gorsel ? { ...s.gorsel, url: undefined } : null,
  };
  const prompt = `Editör aşağıdaki soruyu "Olmamış" olarak işaretledi. Soruyu aynı kazanım, sınav, zorluk ve türde kalarak düzelt.

Sınav: ${s.sinav} (${secenekHarfleri(s.sinav).length} seçenek) · Ders: ${s.ders} ${s.sinif}. sınıf · Ünite: ${s.unite}
Kazanım: ${s.kazanimKodu} — ${s.kazanimMetni}
Zorluk: ${s.zorluk} · Tür: ${s.tur}

Editörün belirttiği sorunlar: ${etiketler.join(", ") || "belirtilmedi"}
Editör notu: ${not?.trim() || "yok"}

Mevcut soru (JSON):
${JSON.stringify(mevcut, null, 2)}

Sorunları gider; iyi olan kısımları koru. Görsel sorunluysa görseli ve SVG'yi baştan tasarla.`;
  return normalize(await cagir(prompt), s.sinav, s.tur);
}
