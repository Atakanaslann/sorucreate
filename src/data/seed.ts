import type { Soru } from "@/lib/types";
import { fingerprint } from "@/lib/similarity";

/**
 * Arayüzün API anahtarı olmadan da gezilebilmesi için birkaç ÖZGÜN örnek soru.
 * Hiçbiri yayınevi sorusundan uyarlanmamıştır.
 */

function cupStack(x: number, baseY: number, count: number, color: string, stroke: string) {
  const cupH = 46;
  const step = 10;
  let out = "";
  for (let i = 0; i < count; i++) {
    const y = baseY - cupH - i * step;
    out += `<path d="M${x - 22} ${y} L${x + 22} ${y} L${x + 16} ${y + cupH} L${x - 16} ${y + cupH} Z" fill="${color}" stroke="${stroke}" stroke-width="1.5"/>`;
    out += `<rect x="${x - 23}" y="${y - 3}" width="46" height="5" rx="2" fill="#fff" stroke="${stroke}" stroke-width="1.5"/>`;
  }
  return { svg: out, top: baseY - cupH - (count - 1) * step - 3 };
}

function dim(x: number, y1: number, y2: number, label: string) {
  const mid = (y1 + y2) / 2;
  return `<line x1="${x}" y1="${y1}" x2="${x}" y2="${y2}" stroke="#334155" stroke-width="1.2"/>
<line x1="${x - 4}" y1="${y1}" x2="${x + 4}" y2="${y1}" stroke="#334155" stroke-width="1.2"/>
<line x1="${x - 4}" y1="${y2}" x2="${x + 4}" y2="${y2}" stroke="#334155" stroke-width="1.2"/>
<text x="${x + 8}" y="${mid + 4}" font-size="13" fill="#0f172a">${label}</text>`;
}

function cupsSvg() {
  const base = 150;
  const parts: string[] = [];
  const conf = [
    { x: 50, n: 1, c: "#fde68a", s: "#b45309", l: "10 cm" },
    { x: 165, n: 3, c: "#fde68a", s: "#b45309", l: "14 cm" },
    { x: 325, n: 1, c: "#bfdbfe", s: "#1d4ed8", l: "14 cm" },
    { x: 440, n: 3, c: "#bfdbfe", s: "#1d4ed8", l: "16 cm" },
  ];
  for (const k of conf) {
    const st = cupStack(k.x, base, k.n, k.c, k.s);
    parts.push(st.svg, dim(k.x + 34, st.top, base, k.l));
  }
  parts.push(`<line x1="20" y1="${base}" x2="530" y2="${base}" stroke="#94a3b8" stroke-width="2"/>`);
  parts.push(`<text x="115" y="180" font-size="15" font-weight="600" text-anchor="middle" fill="#b45309">A tipi bardaklar</text>`);
  parts.push(`<text x="390" y="180" font-size="15" font-weight="600" text-anchor="middle" fill="#1d4ed8">B tipi bardaklar</text>`);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 550 195" font-family="Inter, Arial, sans-serif"><rect width="550" height="195" fill="#ffffff"/>${parts.join("")}</svg>`;
}

function graphSvg() {
  const ox = 60, oy = 220, sx = 36, sy = 6;
  const P = (t: number, x: number) => `${ox + t * sx},${oy - x * sy}`;
  const ticksX = [2, 4, 6, 8, 10]
    .map((t) => `<line x1="${ox + t * sx}" y1="${oy}" x2="${ox + t * sx}" y2="${oy + 5}" stroke="#334155"/><text x="${ox + t * sx}" y="${oy + 20}" font-size="12" text-anchor="middle" fill="#0f172a">${t}</text>`)
    .join("");
  const ticksY = [12, 24]
    .map((v) => `<line x1="${ox - 5}" y1="${oy - v * sy}" x2="${ox}" y2="${oy - v * sy}" stroke="#334155"/><text x="${ox - 10}" y="${oy - v * sy + 4}" font-size="12" text-anchor="end" fill="#0f172a">${v}</text>`)
    .join("");
  const guides = `<line x1="${ox}" y1="${oy - 24 * sy}" x2="${ox + 6 * sx}" y2="${oy - 24 * sy}" stroke="#94a3b8" stroke-dasharray="4 4"/>
<line x1="${ox + 4 * sx}" y1="${oy - 24 * sy}" x2="${ox + 4 * sx}" y2="${oy}" stroke="#94a3b8" stroke-dasharray="4 4"/>
<line x1="${ox + 6 * sx}" y1="${oy - 24 * sy}" x2="${ox + 6 * sx}" y2="${oy}" stroke="#94a3b8" stroke-dasharray="4 4"/>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 480 270" font-family="Inter, Arial, sans-serif"><rect width="480" height="270" fill="#ffffff"/>
${guides}
<line x1="${ox}" y1="${oy}" x2="${ox + 11 * sx}" y2="${oy}" stroke="#0f172a" stroke-width="1.5"/>
<line x1="${ox}" y1="${oy}" x2="${ox}" y2="20" stroke="#0f172a" stroke-width="1.5"/>
<text x="${ox + 11 * sx}" y="${oy + 38}" font-size="12" text-anchor="end" fill="#0f172a">Zaman (s)</text>
<text x="${ox + 6}" y="26" font-size="12" fill="#0f172a">Konum (m)</text>
${ticksX}${ticksY}
<text x="${ox - 10}" y="${oy + 4}" font-size="12" text-anchor="end" fill="#0f172a">0</text>
<polyline points="${P(0, 0)} ${P(4, 24)} ${P(6, 24)} ${P(10, 0)}" fill="none" stroke="#059669" stroke-width="3" stroke-linejoin="round"/>
<circle cx="${ox + 4 * sx}" cy="${oy - 24 * sy}" r="4" fill="#059669"/><circle cx="${ox + 6 * sx}" cy="${oy - 24 * sy}" r="4" fill="#059669"/>
<circle cx="${ox + 10 * sx}" cy="${oy}" r="5" fill="#fff" stroke="#0f172a" stroke-width="1.5"/>
</svg>`;
}

export function ornekSorular(): Soru[] {
  const now = Date.now();
  const iso = (minAgo: number) => new Date(now - minAgo * 60000).toISOString();
  const base = {
    surum: 1,
    geribildirim: [],
    revizyonlar: [],
    meta: { kaynak: "ornek" as const },
  };
  const list: Omit<Soru, "parmakIzi">[] = [
    {
      ...base,
      id: "",
      sinav: "LGS",
      ders: "Matematik",
      sinif: 8,
      unite: "Doğrusal Denklemler",
      kazanimKodu: "M.8.2.2.3",
      kazanimMetni: "Doğrusal ilişki içeren gerçek hayat durumlarına ait tablo, grafik ve denklemi oluşturur ve yorumlar.",
      zorluk: "zor",
      tur: "gorselli",
      durum: "taslak",
      beceri: "Modelleme",
      senaryo:
        "Bir kafede A ve B tipi karton bardaklar iç içe geçecek biçimde üst üste dizilerek kuleler oluşturulmaktadır. Aynı tip bardaklardan oluşan bir kuleye eklenen her bardak, kulenin yüksekliğini hep aynı miktarda artırmaktadır. 1 ve 3 bardaktan oluşan kulelerin yükseklikleri aşağıdaki görselde verilmiştir.",
      kok: "A tipi bardaklardan oluşan bir kule ile B tipi bardaklardan oluşan bir kule eşit sayıda bardak içerdiğinde yükseklikleri de eşit oluyor. Buna göre, bu kulelerden birinin yüksekliği kaç santimetredir?",
      secenekler: [
        { harf: "A", metin: "15", gerekce: "n = 5 bulunduktan sonra A kulesinde her bardağın 1 cm eklediği sanılmıştır (10 + 5)." },
        { harf: "B", metin: "18", gerekce: "Doğru. A: 10 + 2(n − 1), B: 14 + (n − 1). Eşitlenince n = 5 ve yükseklik 18 cm." },
        { harf: "C", metin: "19", gerekce: "n = 5 bulunduktan sonra yükseklik B kulesi için 14 + n ile hesaplanmış, ilk bardak iki kez sayılmıştır." },
        { harf: "D", metin: "20", gerekce: "n = 5 bulunduktan sonra yükseklik A kulesi için 10 + 2n ile hesaplanmış, ilk bardağın artışı fazladan eklenmiştir." },
      ],
      dogruCevap: "B",
      cozum:
        "A tipi: 1 bardak 10 cm, 3 bardak 14 cm → her ek bardak (14 − 10) ÷ 2 = 2 cm ekler. n bardak: 10 + 2(n − 1) = 2n + 8.\nB tipi: 1 bardak 14 cm, 3 bardak 16 cm → her ek bardak 1 cm ekler. n bardak: 14 + (n − 1) = n + 13.\n2n + 8 = n + 13 ⇒ n = 5. Yükseklik: 2·5 + 8 = 18 cm.",
      gorsel: {
        aciklama: "Solda sarı A tipi karton bardaklardan 1'li (10 cm) ve 3'lü (14 cm) iki kule, sağda mavi B tipi bardaklardan 1'li (14 cm) ve 3'lü (16 cm) iki kule. Her kulenin yanında ölçü çizgisi ve santimetre değeri.",
        prompt:
          "Clean flat vector illustration for a Turkish 8th grade math exam question. White background. Left group: yellow paper coffee cups nested and stacked, one stack of 1 cup and one stack of 3 cups. Right group: light-blue paper cups, one stack of 1 cup and one stack of 3 cups. Thin dimension lines next to each stack. Soft pastel palette, crisp outlines, no shadows, textbook style, high legibility.",
        negatifPrompt: "photorealistic, 3d render, clutter, extra text, logos, brand names, watermark",
        zorunluOgeler: ["10 cm", "14 cm", "14 cm", "16 cm", "A tipi bardaklar", "B tipi bardaklar"],
        svg: cupsSvg(),
      },
      olusturma: iso(30),
      guncelleme: iso(30),
    },
    {
      ...base,
      id: "",
      sinav: "TYT",
      ders: "Fizik",
      sinif: 9,
      unite: "Hareket ve Kuvvet",
      kazanimKodu: "9.3.2.1",
      kazanimMetni: "Düzgün doğrusal hareket için konum-zaman, hız-zaman grafiklerini çizerek yorumlar.",
      zorluk: "orta",
      tur: "gorselli",
      durum: "onaylandi",
      beceri: "Grafik okuma",
      senaryo:
        "Bir antrenmanda futbolcu, topu kale çizgisinden itibaren düz bir doğru boyunca sürmekte, kısa bir süre durmakta ve ardından aynı doğru boyunca başladığı noktaya geri dönmektedir. Futbolcunun konum-zaman grafiği aşağıda verilmiştir.",
      kok: "Buna göre, futbolcunun 0–10 saniye aralığındaki ortalama sürati kaç m/s'dir?",
      secenekler: [
        { harf: "A", metin: "0", gerekce: "Ortalama hız (yer değiştirme ÷ zaman) hesaplanmıştır; başlangıca dönüldüğü için yer değiştirme sıfırdır." },
        { harf: "B", metin: "2,4", gerekce: "Yalnızca gidiş yolu (24 m) toplam süreye bölünmüştür." },
        { harf: "C", metin: "4", gerekce: "Hareketsiz geçen 2 saniye süreden çıkarılmadan, gidiş yolu 6 saniyeye bölünmüştür (24 ÷ 6)." },
        { harf: "D", metin: "4,8", gerekce: "Doğru. Toplam yol 24 + 24 = 48 m, toplam süre 10 s; 48 ÷ 10 = 4,8 m/s." },
        { harf: "E", metin: "6", gerekce: "Yalnızca ilk 4 saniyedeki sürat (24 ÷ 4) hesaplanmıştır." },
      ],
      dogruCevap: "D",
      cozum:
        "0–4 s: 0 m'den 24 m'ye → 24 m yol.\n4–6 s: konum sabit → 0 m yol.\n6–10 s: 24 m'den 0 m'ye → 24 m yol.\nOrtalama sürat = toplam yol ÷ toplam süre = 48 ÷ 10 = 4,8 m/s. (Ortalama hız ise yer değiştirme 0 olduğu için 0'dır.)",
      gorsel: {
        aciklama: "Konum (m) – zaman (s) grafiği: (0,0)'dan (4,24)'e doğrusal artış, (4,24)–(6,24) yatay, (6,24)'ten (10,0)'a doğrusal azalış. 4 ve 6 saniyeden kesikli kılavuz çizgiler.",
        prompt:
          "Minimal flat illustration of a young football player dribbling a ball along a straight white line on a green training pitch, side view, small cones marking start point, clean vector style, white margins, no text.",
        negatifPrompt: "crowd, stadium logos, jersey numbers, brand names, text, watermark",
        zorunluOgeler: ["Konum (m)", "Zaman (s)", "24", "4", "6", "10"],
        svg: graphSvg(),
      },
      olusturma: iso(90),
      guncelleme: iso(60),
    },
    {
      ...base,
      id: "",
      sinav: "TYT",
      ders: "Matematik",
      sinif: 9,
      unite: "Oran – Orantı",
      kazanimKodu: "M.9.3.3.1",
      kazanimMetni: "Oran ve orantı kavramlarını kullanarak problemler çözer.",
      zorluk: "orta",
      tur: "gorselsiz",
      durum: "taslak",
      beceri: "İşlem",
      senaryo:
        "Bir matbaada aynı hızda çalışan 4 baskı makinesi birlikte 6 saatte 9600 broşür basabilmektedir. Bir sipariş için 9600 broşürlük baskıya 4 makineyle başlanıyor; 3 saat sonra makinelerden biri arızalanıyor ve baskıya kalan makinelerle devam ediliyor.",
      kok: "Buna göre, siparişin tamamı baskıya başlandıktan kaç saat sonra tamamlanır?",
      secenekler: [
        { harf: "A", metin: "6", gerekce: "Arıza hiç hesaba katılmamıştır." },
        { harf: "B", metin: "6,5", gerekce: "Kalan iş süresi yanlış oranlanmıştır (3 · 3/4 + 4 gibi karışık işlem)." },
        { harf: "C", metin: "7", gerekce: "Doğru. Makine başına saatte 400 broşür; ilk 3 saatte 4800 basılır, kalan 4800'ü 3 makine saatte 1200 ile 4 saatte basar: 3 + 4 = 7." },
        { harf: "D", metin: "7,5", gerekce: "Kalan iş yanlışlıkla 3 makinenin 6 saatlik işinin yarısından fazlası sanılmıştır." },
        { harf: "E", metin: "8", gerekce: "Baskı en baştan 3 makineyle yapılmış gibi düşünülmüştür (6 · 4/3)." },
      ],
      dogruCevap: "C",
      cozum: "Bir makinenin saatlik üretimi: 9600 ÷ (4 · 6) = 400.\nİlk 3 saat: 4 · 400 · 3 = 4800 broşür.\nKalan 4800 broşür, 3 makine (saatte 1200) ile 4 saatte biter.\nToplam süre: 3 + 4 = 7 saat.",
      olusturma: iso(120),
      guncelleme: iso(120),
    },
    {
      ...base,
      id: "",
      sinav: "LGS",
      ders: "Matematik",
      sinif: 8,
      unite: "Çarpanlar ve Katlar",
      kazanimKodu: "M.8.1.1.2",
      kazanimMetni: "İki doğal sayının EBOB ve EKOK'unu hesaplar, ilgili problemleri çözer.",
      zorluk: "orta",
      tur: "gorselsiz",
      durum: "taslak",
      beceri: "Problem çözme",
      senaryo:
        "Bir durağa A hattının otobüsleri 12 dakikada bir, B hattının otobüsleri 18 dakikada bir gelmektedir. İki hattın otobüsleri bir gün saat 07.10'da durakta aynı anda bulunmuştur.",
      kok: "Buna göre, aynı gün 07.10'dan sonra saat 12.00'ye kadar iki hattın otobüsleri durakta kaç kez daha aynı anda bulunur?",
      secenekler: [
        { harf: "A", metin: "7", gerekce: "290 ÷ 36 bölümü aşağı yuvarlanırken bir eksik sayılmıştır." },
        { harf: "B", metin: "8", gerekce: "Doğru. EKOK(12, 18) = 36; 290 dakikada 36'nın 8 katı vardır (son buluşma 11.58)." },
        { harf: "C", metin: "9", gerekce: "07.10'daki buluşma da sayılmıştır." },
        { harf: "D", metin: "16", gerekce: "EKOK yerine EBOB (6) kullanılıp sonuç ikiye bölünmüş gibi hatalı bir yol izlenmiştir." },
      ],
      dogruCevap: "B",
      cozum: "EKOK(12, 18) = 36 → iki hat 36 dakikada bir aynı anda durakta olur.\n07.10–12.00 arası 290 dakika. 290 ÷ 36 = 8 (kalan 2).\nBuluşmalar: 07.46, 08.22, …, 11.58 → 8 kez.",
      olusturma: iso(200),
      guncelleme: iso(200),
    },
  ];
  return list.map((s) => ({ ...s, parmakIzi: fingerprint(s.senaryo, s.kok) }));
}
