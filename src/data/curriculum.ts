import type { Sinav } from "@/lib/types";

/**
 * Çekirdek müfredat ağacı (Faz 1).
 *
 * Kodlar MEB öğretim programlarındaki kazanım numaralandırmasını izler.
 * `dogrulandi: false` olan kazanımlar resmi program metniyle henüz satır satır
 * karşılaştırılmadı — Faz 2'de tymm.meb.gov.tr / mufredat.meb.gov.tr
 * PDF'lerinden tam liste içe aktarılıp doğrulanacak.
 */
export interface Kazanim {
  kod: string;
  metin: string;
  sinif: number;
  dogrulandi: boolean;
}
export interface Unite {
  ad: string;
  kazanimlar: Kazanim[];
}
export interface Ders {
  ad: string;
  kisa: string;
  uniteler: Unite[];
}

const k = (kod: string, sinif: number, metin: string): Kazanim => ({
  kod,
  metin,
  sinif,
  dogrulandi: false,
});

const LGS_MAT: Ders = {
  ad: "Matematik",
  kisa: "MAT",
  uniteler: [
    {
      ad: "Çarpanlar ve Katlar",
      kazanimlar: [
        k("M.8.1.1.1", 8, "Verilen pozitif tam sayıların çarpanlarını bulur; tam sayıları üslü ifade ya da asal çarpanların çarpımı biçiminde yazar."),
        k("M.8.1.1.2", 8, "İki doğal sayının EBOB ve EKOK'unu hesaplar, ilgili problemleri çözer."),
        k("M.8.1.1.3", 8, "Verilen iki doğal sayının aralarında asal olup olmadığını belirler."),
      ],
    },
    {
      ad: "Üslü İfadeler",
      kazanimlar: [
        k("M.8.1.2.1", 8, "Tam sayıların, tam sayı kuvvetlerini hesaplar."),
        k("M.8.1.2.2", 8, "Üslü ifadelerle ilgili temel kuralları anlar, birbirine denk ifadeler oluşturur."),
        k("M.8.1.2.4", 8, "Çok büyük ve çok küçük sayıları bilimsel gösterimle ifade eder ve karşılaştırır."),
      ],
    },
    {
      ad: "Kareköklü İfadeler",
      kazanimlar: [
        k("M.8.1.3.1", 8, "Tam kare pozitif tam sayılarla bu sayıların karekökleri arasındaki ilişkiyi belirler."),
        k("M.8.1.3.2", 8, "Tam kare olmayan kareköklü bir sayının hangi iki doğal sayı arasında olduğunu belirler."),
        k("M.8.1.3.4", 8, "Kareköklü ifadelerde çarpma ve bölme işlemlerini yapar."),
      ],
    },
    {
      ad: "Veri Analizi",
      kazanimlar: [
        k("M.8.4.1.1", 8, "En fazla üç veri grubuna ait çizgi ve sütun grafiklerini yorumlar."),
        k("M.8.4.1.2", 8, "Verileri sütun, daire veya çizgi grafiği ile gösterir ve bu gösterimler arasında dönüşümler yapar."),
      ],
    },
    {
      ad: "Basit Olayların Olma Olasılığı",
      kazanimlar: [
        k("M.8.5.1.1", 8, "Bir olaya ait olası durumları belirler."),
        k("M.8.5.1.3", 8, "Eşit şansa sahip olan olaylarda her bir çıktının olma olasılığının eşit olduğunu ve bu değerin 1/n olduğunu açıklar."),
        k("M.8.5.1.4", 8, "Basit bir olayın olma olasılığını hesaplar."),
      ],
    },
    {
      ad: "Cebirsel İfadeler ve Özdeşlikler",
      kazanimlar: [
        k("M.8.2.1.2", 8, "Cebirsel ifadelerin çarpımını yapar."),
        k("M.8.2.1.3", 8, "Özdeşlikleri modellerle açıklar."),
        k("M.8.2.1.4", 8, "Cebirsel ifadeleri çarpanlara ayırır."),
      ],
    },
    {
      ad: "Doğrusal Denklemler",
      kazanimlar: [
        k("M.8.2.2.1", 8, "Birinci dereceden bir bilinmeyenli denklemleri çözer."),
        k("M.8.2.2.3", 8, "Doğrusal ilişki içeren gerçek hayat durumlarına ait tablo, grafik ve denklemi oluşturur ve yorumlar."),
        k("M.8.2.2.4", 8, "Doğrunun eğimini modellerle açıklar."),
      ],
    },
    {
      ad: "Eşitsizlikler",
      kazanimlar: [
        k("M.8.2.3.1", 8, "Birinci dereceden bir bilinmeyenli eşitsizlik içeren günlük hayat durumlarına uygun matematik cümleleri yazar."),
        k("M.8.2.3.3", 8, "Birinci dereceden bir bilinmeyenli eşitsizlikleri çözer."),
      ],
    },
    {
      ad: "Üçgenler",
      kazanimlar: [
        k("M.8.3.1.3", 8, "Üçgen eşitsizliğini kullanarak, verilen uzunluklarla üçgen oluşturur."),
        k("M.8.3.1.5", 8, "Pisagor bağıntısını oluşturur, ilgili problemleri çözer."),
      ],
    },
    {
      ad: "Dönüşüm Geometrisi",
      kazanimlar: [
        k("M.8.3.3.1", 8, "Nokta, doğru parçası ve diğer düzlemsel şekillerin öteleme altındaki görüntülerini çizer."),
        k("M.8.3.3.2", 8, "Nokta, doğru parçası ve diğer düzlemsel şekillerin yansıma altındaki görüntülerini çizer."),
      ],
    },
    {
      ad: "Geometrik Cisimler",
      kazanimlar: [
        k("M.8.3.4.2", 8, "Dik prizmaların yüzey alanı bağıntısını oluşturur, ilgili problemleri çözer."),
        k("M.8.3.4.5", 8, "Dik dairesel silindirin hacim bağıntısını oluşturur, ilgili problemleri çözer."),
      ],
    },
  ],
};

const LGS_FEN: Ders = {
  ad: "Fen Bilimleri",
  kisa: "FEN",
  uniteler: [
    { ad: "Mevsimler ve İklim", kazanimlar: [k("F.8.1.1.1", 8, "Mevsimlerin oluşumuna yönelik tahminlerde bulunur.")] },
    { ad: "DNA ve Genetik Kod", kazanimlar: [k("F.8.2.2.1", 8, "Kalıtımla ilgili kavramları tanımlar."), k("F.8.2.2.2", 8, "Tek karakter çaprazlamaları ile ilgili problemler çözerek olası sonuçları tahmin eder.")] },
    { ad: "Basınç", kazanimlar: [k("F.8.3.1.1", 8, "Katı basıncını etkileyen değişkenleri deneyerek keşfeder ve günlük yaşamdan örneklerle açıklar."), k("F.8.3.1.2", 8, "Sıvı basıncını etkileyen değişkenleri tahmin eder ve tahminlerini test eder.")] },
    { ad: "Madde ve Endüstri", kazanimlar: [k("F.8.4.4.1", 8, "Asit ve bazların genel özelliklerini ifade eder."), k("F.8.4.5.1", 8, "Maddelerin ısı alışverişi sonucunda sıcaklığının değişebileceğini deneyerek keşfeder.")] },
    { ad: "Basit Makineler", kazanimlar: [k("F.8.5.1.1", 8, "Basit makinelerin sağladığı avantajları örnekler üzerinden açıklar.")] },
    { ad: "Enerji Dönüşümleri ve Çevre Bilimi", kazanimlar: [k("F.8.6.1.1", 8, "Besin zinciri ve enerji akışını açıklar.")] },
    { ad: "Elektrik Yükleri ve Elektrik Enerjisi", kazanimlar: [k("F.8.7.3.1", 8, "Elektrik enerjisinin ısı, ışık veya hareket enerjisine dönüşümüne örnekler verir.")] },
  ],
};

const TYT_MAT: Ders = {
  ad: "Matematik",
  kisa: "MAT",
  uniteler: [
    { ad: "Sayılar ve Problemler", kazanimlar: [k("M.9.1.2.1", 9, "Sayı kümelerini ve bu kümelerde işlemleri kullanarak gerçek hayat problemlerini çözer."), k("M.9.1.3.1", 9, "Üslü ve köklü ifadeleri içeren işlemler yapar.")] },
    { ad: "Oran – Orantı", kazanimlar: [k("M.9.3.3.1", 9, "Oran ve orantı kavramlarını kullanarak problemler çözer.")] },
    { ad: "Denklemler ve Eşitsizlikler", kazanimlar: [k("M.9.3.1.1", 9, "Birinci dereceden bir bilinmeyenli denklem ve eşitsizliklerin çözüm kümelerini bulur."), k("M.9.3.2.1", 9, "Mutlak değer içeren denklem ve eşitsizlikleri çözer.")] },
    { ad: "Kümeler", kazanimlar: [k("M.9.2.1.3", 9, "Kümelerle ilgili işlemleri yapar ve problemlerde kullanır.")] },
    { ad: "Veri ve İstatistik", kazanimlar: [k("M.9.5.1.1", 9, "Merkezi eğilim ve yayılım ölçülerini hesaplar."), k("M.9.5.2.1", 9, "Verileri uygun grafik türleriyle gösterir ve yorumlar.")] },
    { ad: "Sayma ve Olasılık", kazanimlar: [k("M.10.1.1.1", 10, "Olayların gerçekleşme sayısını toplama ve çarpma yöntemlerini kullanarak hesaplar."), k("M.10.1.1.2", 10, "Permütasyon kavramını açıklayarak problemler çözer."), k("M.10.1.1.3", 10, "Kombinasyon kavramını açıklayarak problemler çözer."), k("M.10.1.2.1", 10, "Olasılık kavramıyla ilgili uygulamalar yapar.")] },
    { ad: "Fonksiyonlar", kazanimlar: [k("M.10.2.1.1", 10, "Fonksiyonlarla ilgili problemler çözer."), k("M.10.2.1.2", 10, "Fonksiyonların grafiklerini çizer ve yorumlar.")] },
    { ad: "Mantık", kazanimlar: [k("M.9.1.1.1", 9, "Önermeyi, önermenin doğruluk değerini, iki önermenin denkliğini ve önermenin değilini açıklar.")] },
  ],
};

const TYT_GEO: Ders = {
  ad: "Geometri",
  kisa: "GEO",
  uniteler: [
    { ad: "Üçgenler", kazanimlar: [k("M.9.4.1.1", 9, "Üçgenin kenar ve açı özelliklerini kullanarak problemler çözer."), k("M.9.4.4.1", 9, "Dik üçgende Pisagor ve Öklid bağıntılarını kullanır.")] },
    { ad: "Dörtgenler ve Çokgenler", kazanimlar: [k("M.10.5.1.1", 10, "Çokgenlerin özelliklerini açıklayarak problemler çözer."), k("M.10.5.2.1", 10, "Dörtgenlerin temel elemanlarını ve özelliklerini kullanır.")] },
    { ad: "Katı Cisimler", kazanimlar: [k("M.10.6.1.1", 10, "Dik prizma ve piramidin uzunluk, alan ve hacim bağıntılarını kullanır.")] },
  ],
};

const TYT_TUR: Ders = {
  ad: "Türkçe",
  kisa: "TUR",
  uniteler: [
    { ad: "Paragraf", kazanimlar: [k("TYT.TR.PAR.1", 9, "Paragrafın ana düşüncesini ve yardımcı düşüncelerini belirler."), k("TYT.TR.PAR.2", 9, "Paragrafta anlatım biçimlerini ve düşünceyi geliştirme yollarını belirler.")] },
    { ad: "Sözcükte ve Cümlede Anlam", kazanimlar: [k("TYT.TR.ANL.1", 9, "Sözcüklerin bağlam içindeki anlamlarını belirler."), k("TYT.TR.ANL.2", 9, "Cümleler arası anlam ilişkilerini belirler.")] },
    { ad: "Grafik ve Tablo Yorumlama", kazanimlar: [k("TYT.TR.GRF.1", 9, "Grafik, tablo ve görsellerdeki bilgiyi sözel ifadelerle ilişkilendirir.")] },
  ],
};

const TYT_FIZ: Ders = {
  ad: "Fizik",
  kisa: "FIZ",
  uniteler: [
    { ad: "Hareket ve Kuvvet", kazanimlar: [k("9.3.1.1", 9, "Cisimlerin hareketlerini sınıflandırır; konum, yol, yer değiştirme, sürat ve hız kavramlarını açıklar."), k("9.3.2.1", 9, "Düzgün doğrusal hareket için konum-zaman, hız-zaman grafiklerini çizerek yorumlar.")] },
    { ad: "Enerji", kazanimlar: [k("9.4.1.1", 9, "İş, enerji ve güç kavramlarını ilişkilendirir.")] },
    { ad: "Isı ve Sıcaklık", kazanimlar: [k("9.5.1.1", 9, "Isı, sıcaklık ve iç enerji kavramlarını açıklar.")] },
    { ad: "Basınç ve Kaldırma Kuvveti", kazanimlar: [k("10.2.1.1", 10, "Basınç kavramını açıklar ve günlük hayattan örnekler verir.")] },
  ],
};

const AYT_MAT: Ders = {
  ad: "Matematik",
  kisa: "MAT",
  uniteler: [
    { ad: "Trigonometri", kazanimlar: [k("M.11.1.2.1", 11, "Trigonometrik fonksiyonları birim çember yardımıyla açıklar.")] },
    { ad: "Diziler", kazanimlar: [k("M.12.2.1.2", 12, "Aritmetik ve geometrik dizileri açıklar."), k("M.12.2.1.3", 12, "Dizilerle ilgili gerçek hayat problemleri çözer.")] },
    { ad: "Üstel ve Logaritmik Fonksiyonlar", kazanimlar: [k("M.12.1.1.1", 12, "Üstel fonksiyonu açıklar."), k("M.12.1.2.3", 12, "Logaritmik ve üstel denklemlerle gerçek hayat problemlerini çözer.")] },
    { ad: "Türev", kazanimlar: [k("M.12.4.3.1", 12, "Türevin uygulamalarıyla maksimum-minimum problemleri çözer.")] },
    { ad: "İntegral", kazanimlar: [k("M.12.5.2.1", 12, "Belirli integralin alan ile ilişkisini açıklar.")] },
  ],
};

export const MUFREDAT: Record<Sinav, Ders[]> = {
  LGS: [LGS_MAT, LGS_FEN],
  TYT: [TYT_MAT, TYT_GEO, TYT_TUR, TYT_FIZ],
  AYT: [AYT_MAT],
};

export function dersBul(sinav: Sinav, ders: string) {
  return MUFREDAT[sinav]?.find((d) => d.ad === ders);
}

export function kazanimBul(sinav: Sinav, ders: string, kod: string) {
  const d = dersBul(sinav, ders);
  for (const u of d?.uniteler ?? []) {
    const kz = u.kazanimlar.find((x) => x.kod === kod);
    if (kz) return { unite: u, kazanim: kz, ders: d! };
  }
  return null;
}
