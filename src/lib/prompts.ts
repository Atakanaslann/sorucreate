import { z } from "zod";
import { secenekHarfleri, OLMAMIS_NEDENLERI } from "./types";
import type { Sinav, SoruIcerik, Soru, OlmamisNedeni, SoruTuru, Zorluk } from "./types";

/**
 * Soru üretim promptları ve çıktı doğrulama. Hem API modu (src/lib/ai.ts) hem de
 * API'siz "kopyala-yapıştır" modu (Claude.ai / ChatGPT / Gemini) aynı kuralları kullanır.
 */

export const SoruSchema = z.object({
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
export type SoruCikti = z.infer<typeof SoruSchema>;

export const SISTEM = `Sen Türkiye'de TYT, AYT ve LGS için soru yazan kıdemli bir ölçme-değerlendirme uzmanısın.

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

export function normalizeCikti(out: SoruCikti, sinav: Sinav, tur: SoruTuru): SoruIcerik {
  const harfler = secenekHarfleri(sinav);
  const secenekler = out.secenekler.slice(0, harfler.length).map((s, i) => ({ ...s, harf: harfler[i] }));
  if (secenekler.length !== harfler.length) throw new Error(`Seçenek sayısı ${harfler.length} olmalıydı (${out.secenekler.length} geldi).`);
  const dogru = out.dogruCevap.trim().toUpperCase().slice(0, 1);
  if (!harfler.includes(dogru)) throw new Error("Doğru cevap seçeneklerde yok.");
  return {
    senaryo: out.senaryo,
    kok: out.kok,
    secenekler,
    dogruCevap: dogru,
    cozum: out.cozum,
    beceri: out.beceri,
    gorsel: tur === "gorselli" && out.gorsel ? { ...out.gorsel, svg: sanitizeSvg(out.gorsel.svg) } : undefined,
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

export function uretimPromptu(r: UretimIstegi, adet = 1) {
  const harfler = secenekHarfleri(r.sinav);
  return `Aşağıdaki özelliklere göre ${adet} adet soru yaz.${adet > 1 ? " Sorular birbirinden farklı bağlamlarda olsun." : ""}

Sınav: ${r.sinav} (${harfler.length} seçenek: ${harfler.join(", ")})
Ders: ${r.ders} — ${r.sinif}. sınıf
Ünite: ${r.unite}
Kazanım: ${r.kazanimKodu} — ${r.kazanimMetni}
Zorluk: ${r.zorluk}
Tür: ${r.tur === "gorselli" ? "YENİ NESİL, GÖRSELLİ (gorsel alanı ve svg zorunlu)" : "GÖRSELSİZ (gorsel = null)"}
${r.tema ? `Bağlam/tema önerisi: ${r.tema}` : "Bağlamı sen seç; özgün ve öğrencinin günlük hayatına yakın olsun."}
${r.kacinilacaklar?.length ? `\nEditörün daha önce reddettiği sorulardaki sorunlar (bunlardan kaçın):\n- ${r.kacinilacaklar.join("\n- ")}` : ""}
${r.mevcutKokler?.length ? `\nBu kazanımda havuzda zaten olan sorular (bunlara benzeme):\n- ${r.mevcutKokler.join("\n- ")}` : ""}`.trim();
}

export function revizyonPromptu(s: Soru, nedenler: OlmamisNedeni[], not?: string) {
  const etiketler = nedenler.map((n) => OLMAMIS_NEDENLERI.find((x) => x.key === n)?.label ?? n);
  const mevcut = {
    senaryo: s.senaryo,
    kok: s.kok,
    secenekler: s.secenekler,
    dogruCevap: s.dogruCevap,
    cozum: s.cozum,
    beceri: s.beceri,
    gorsel: s.gorsel ? { ...s.gorsel, url: undefined } : null,
  };
  return `Editör aşağıdaki soruyu "Olmamış" olarak işaretledi. Soruyu aynı kazanım, sınav, zorluk ve türde kalarak düzelt.

Sınav: ${s.sinav} (${secenekHarfleri(s.sinav).length} seçenek) · Ders: ${s.ders} ${s.sinif}. sınıf · Ünite: ${s.unite}
Kazanım: ${s.kazanimKodu} — ${s.kazanimMetni}
Zorluk: ${s.zorluk} · Tür: ${s.tur}

Editörün belirttiği sorunlar: ${etiketler.join(", ") || "belirtilmedi"}
Editör notu: ${not?.trim() || "yok"}

Mevcut soru (JSON):
${JSON.stringify(mevcut, null, 2)}

Sorunları gider; iyi olan kısımları koru. Görsel sorunluysa görseli ve SVG'yi baştan tasarla.`;
}

/* ---------- API'siz mod: sohbet aracına kopyalanacak tam prompt ---------- */

const ORNEK_JSON = `{
  "sorular": [
    {
      "senaryo": "…",
      "kok": "Buna göre, … kaçtır?",
      "secenekler": [
        { "harf": "A", "metin": "…", "gerekce": "Hangi öğrenci hatasından türediği" }
      ],
      "dogruCevap": "B",
      "cozum": "1. adım …\\n2. adım …",
      "beceri": "Modelleme",
      "gorsel": {
        "aciklama": "Görselin Türkçe tarifi",
        "prompt": "English image prompt …",
        "negatifPrompt": "photorealistic, extra text, watermark",
        "zorunluOgeler": ["10 cm", "14 cm"],
        "svg": "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 520 240'>…</svg>"
      }
    }
  ]
}`;

const CIKTI_KURALI = `
ÇIKTI BİÇİMİ (ÇOK ÖNEMLİ)
- Yanıtının TAMAMI tek bir \`\`\`json kod bloğu olsun; öncesinde ve sonrasında açıklama yazma.
- Kök nesne { "sorular": [ ... ] } biçiminde olsun. Alan adlarını aynen kullan:
${ORNEK_JSON}
- Görselsiz soruda "gorsel": null yaz.
- SVG içinde çift tırnak yerine tek tırnak kullan (JSON bozulmasın). Satır sonlarını \\n ile yaz.`;

export function manuelUretimPromptu(r: UretimIstegi, adet: number) {
  return `${SISTEM}\n${CIKTI_KURALI}\n\n---\n\n${uretimPromptu(r, adet)}`;
}

export function manuelRevizyonPromptu(s: Soru, nedenler: OlmamisNedeni[], not?: string) {
  return `${SISTEM}\n${CIKTI_KURALI}\n- "sorular" dizisinde yalnızca 1 soru (düzeltilmiş hali) olsun.\n\n---\n\n${revizyonPromptu(s, nedenler, not)}`;
}

/** Sohbet aracından yapıştırılan yanıtı ayrıştırır: kod bloğu, { sorular: [...] }, dizi veya tek soru. */
export function yapistirilaniAyristir(metin: string): SoruCikti[] {
  const blok = metin.match(/```(?:json)?\s*([\s\S]*?)```/i);
  let ham = (blok ? blok[1] : metin).trim();
  if (!blok) {
    const i = ham.search(/[[{]/);
    const j = Math.max(ham.lastIndexOf("}"), ham.lastIndexOf("]"));
    if (i >= 0 && j > i) ham = ham.slice(i, j + 1);
  }
  let veri: unknown;
  try {
    veri = JSON.parse(ham);
  } catch (e) {
    throw new Error(`Yapıştırılan metin geçerli JSON değil: ${(e as Error).message}`);
  }
  const dizi = Array.isArray(veri) ? veri : (veri as { sorular?: unknown[] })?.sorular ?? [veri];
  return dizi.map((x, i) => {
    const r = SoruSchema.safeParse({ gorsel: null, beceri: "Problem çözme", ...(x as object) });
    if (!r.success) {
      const ilk = r.error.issues[0];
      throw new Error(`${i + 1}. soru şemaya uymuyor: "${ilk.path.join(".")}" — ${ilk.message}`);
    }
    return r.data;
  });
}
