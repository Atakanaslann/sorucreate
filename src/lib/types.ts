export const SINAVLAR = ["TYT", "AYT", "LGS"] as const;
export type Sinav = (typeof SINAVLAR)[number];

export type Zorluk = "orta" | "zor";
export type SoruTuru = "gorselli" | "gorselsiz";
export type Durum = "taslak" | "onaylandi" | "revizyonda" | "kaldirildi";

export const OLMAMIS_NEDENLERI = [
  { key: "gorsel_uyumsuz", label: "Görsel soruyla uyumsuz" },
  { key: "mufredat_disi", label: "Müfredat / kazanım dışı" },
  { key: "cevap_hatali", label: "Cevap veya çözüm hatalı" },
  { key: "cok_kolay", label: "Zorluk düşük kaldı" },
  { key: "celdirici_zayif", label: "Çeldiriciler zayıf" },
  { key: "dil_anlatim", label: "Dil / anlatım sorunlu" },
  { key: "diger", label: "Diğer" },
] as const;
export type OlmamisNedeni = (typeof OLMAMIS_NEDENLERI)[number]["key"];

export interface Secenek {
  harf: string;
  metin: string;
  /** Bu seçenek neden doğru / neden yanlış (çeldirici gerekçesi) */
  gerekce: string;
}

export interface GorselBrif {
  /** Görselin Türkçe tarifi */
  aciklama: string;
  /** Görsel üretim servisine verilecek İngilizce prompt */
  prompt: string;
  negatifPrompt: string;
  /** Görselde mutlaka okunabilir olması gereken sayı/etiketler */
  zorunluOgeler: string[];
  /** Claude'un çizdiği kesin ölçülü SVG (opsiyonel) */
  svg?: string;
  /** Yüklenen / üretilen görsel (data URL veya URL) */
  url?: string;
}

export interface Geribildirim {
  tarih: string;
  karar: "olmus" | "olmamis";
  nedenler: OlmamisNedeni[];
  not?: string;
  aksiyon?: "revize" | "kaldir";
}

export interface SoruIcerik {
  senaryo: string;
  kok: string;
  secenekler: Secenek[];
  dogruCevap: string;
  cozum: string;
  beceri: string;
  gorsel?: GorselBrif;
}

export interface Revizyon extends SoruIcerik {
  surum: number;
  tarih: string;
  neden?: string;
}

export interface Soru extends SoruIcerik {
  id: string;
  sinav: Sinav;
  ders: string;
  sinif: number;
  unite: string;
  kazanimKodu: string;
  kazanimMetni: string;
  zorluk: Zorluk;
  tur: SoruTuru;
  durum: Durum;
  surum: number;
  geribildirim: Geribildirim[];
  revizyonlar: Revizyon[];
  parmakIzi: string;
  olusturma: string;
  guncelleme: string;
  meta: { kaynak: "ornek" | "claude" | "manuel"; model?: string };
}

export interface SoruFiltre {
  sinav?: string;
  ders?: string;
  unite?: string;
  kazanim?: string;
  zorluk?: string;
  tur?: string;
  durum?: string;
  q?: string;
}

export const secenekHarfleri = (sinav: Sinav) =>
  sinav === "LGS" ? ["A", "B", "C", "D"] : ["A", "B", "C", "D", "E"];

export const DURUM_ETIKET: Record<Durum, string> = {
  taslak: "Onay bekliyor",
  onaylandi: "Onaylandı",
  revizyonda: "Revizyonda",
  kaldirildi: "Kaldırıldı",
};

export const GUNLUK_HEDEF = { gorselli: 20, gorselsiz: 30 } as const;
