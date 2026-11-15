# SoruCreate — Proje Planı

> TYT, AYT, LGS ve deneme sınavları için **MEB müfredatına uygun**, **orta / zor** seviyede, metin tabanlı ve **yeni nesil (görselli)** soru üreten, bunları bir havuzda biriktiren ve kalite kontrolünden geçiren web platformu.

---

## 1. Hedefler

| Hedef | Ölçüt |
|---|---|
| Günlük üretim | **50 soru / gün** → 20 görselli (yeni nesil) + 30 görselsiz |
| Müfredat uyumu | Her soru bir **MEB kazanım koduna** bağlı; kazanım dışı soru havuza onaysız giremez |
| Zorluk | Yalnızca **orta** ve **zor** (kolay soru üretilmez) |
| Kalite | Her soru insan onayından geçer: **Olmuş / Olmamış** |
| Yeniden kullanım | Her sorunun kalıcı, benzersiz bir **Soru ID**'si var; havuzdan filtreyle çekilir, denemeye eklenir |

## 2. Kaynak politikası

1. **Birincil referans: MEB ve ÖSYM.**
   - Kazanımlar: MEB öğretim programları (Türkiye Yüzyılı Maarif Modeli — `tymm.meb.gov.tr`, eski programlar `mufredat.meb.gov.tr`).
   - Soru tarzı: ÖSYM'nin yayımladığı geçmiş TYT/AYT soruları, MEB'in LGS örnek soruları ve "örnek soru kitapçıkları".
   - Sınav kapsamı: ÖSYM YKS kılavuzu, MEB LGS kapsam duyuruları (LGS: 8. sınıf 1. ve 2. dönem konuları, her yıl duyurulan kapsama göre).
2. **Yayınevleri yalnızca stil referansıdır.** Görsel dil, sayfa düzeni, "Buna göre…" soru kökü kalıbı gibi biçim özellikleri incelenir; **hiçbir soru, metin, görsel ya da sayı kurgusu kopyalanmaz**. Üretim promptunda "özgün senaryo, telifli içeriğe benzemeyen kurgu" kuralı sabittir.
3. Kullanıcının yüklediği referans görsellerden çıkan stil notları (bkz. §5.3) üretim promptuna gömülüdür.

## 3. Müfredat etiketleme şeması

Her soru şu etiketleri taşır:

| Alan | Örnek | Not |
|---|---|---|
| `sinav` | `TYT` · `AYT` · `LGS` | "Deneme" bir sınav türü değil, havuzdan oluşturulan **set**tir (§8) |
| `ders` | Matematik, Geometri, Türkçe, Fizik, Kimya, Biyoloji, Tarih, Coğrafya, Felsefe, Din K., Fen Bilimleri, İnkılap Tarihi, İngilizce | |
| `sinif` | 9 · 10 · 11 · 12 · 8 | Kazanımın ait olduğu sınıf |
| `unite` | "Çarpanlar ve Katlar" | |
| `kazanimKodu` | `M.8.1.1.2` | MEB kodu |
| `kazanimMetni` | "İki doğal sayının EBOB ve EKOK'unu hesaplar…" | |
| `zorluk` | `orta` · `zor` | |
| `tur` | `gorselli` · `gorselsiz` | |
| `beceri` | işlem, yorumlama, modelleme, akıl yürütme, grafik okuma | Yeni nesil soruların ölçtüğü üst düzey beceri |
| `secenekSayisi` | 5 (TYT/AYT, A–E) · 4 (LGS, A–D) | Sınava göre otomatik |

Müfredat ağacı (`src/data/curriculum.ts`) şimdilik çekirdek bir alt küme içerir ve her kazanım `dogrulandi: true/false` bayrağı taşır. **Faz 2'de** resmi MEB program PDF'lerinden tam liste içe aktarılıp doğrulanacak; doğrulanmamış kazanımlar arayüzde işaretlenir.

## 4. Soru veri modeli

```
Soru
├─ id               SC-LGS-MAT-00042   (sınav-ders-sıra; kalıcı, değişmez)
├─ etiketler        §3'teki tüm alanlar
├─ senaryo          günlük hayat bağlamı (yeni nesil sorularda zorunlu)
├─ kok              "Buna göre, … kaçtır?"
├─ secenekler[]     { harf, metin, gerekce }   ← her çeldiricinin neden yanlış olduğu
├─ dogruCevap       "C"
├─ cozum            adım adım çözüm
├─ gorsel
│   ├─ aciklama     görselin Türkçe tarifi (öğretmen/tasarımcı için)
│   ├─ prompt       görsel üretim servisine verilecek İngilizce prompt
│   ├─ negatifPrompt
│   ├─ zorunluOgeler  görselde mutlaka okunması gereken sayılar/etiketler
│   ├─ svg          (ops.) Claude'un çizdiği kesin ölçülü SVG figür
│   └─ url          (ops.) üretilen/yüklenen görsel
├─ durum            taslak → onaylandi | revizyonda → kaldirildi
├─ geribildirim[]   Olmuş/Olmamış kayıtları (neden + not + tarih)
├─ revizyonlar[]    önceki sürümlerin tam kopyası (geri alınabilir)
├─ parmakIzi        benzerlik kontrolü için normalize metin imzası
└─ meta             üretim modeli, tarih, süre, maliyet
```

## 5. Üretim hattı

### 5.1 Akış
```
Konu/kazanım seç → (ops.) tema ver: "karton bardak", "yırtık kağıt", "futbol topu hızı"
   → Claude: soru + çözüm + çeldirici gerekçeleri + görsel brifi + (ops.) SVG
   → Otomatik kontroller (§6)
   → Havuza "taslak" olarak düşer
   → İnceleme ekranı: Olmuş ✅ / Olmamış ❌
```

### 5.2 Yapay zekâ — iki üretim yolu
**A) Sohbet aracıyla (varsayılan, API anahtarı gerekmez).** Kullanıcının Claude / ChatGPT / Gemini abonelik kotası kullanılır:
1. Üret ekranında kazanım, zorluk, tür, tema ve adet (1–10) seçilir → **Promptu hazırla**.
2. Uygulama; sistem kuralları + kazanım + havuzdaki benzer sorular + sık “olmamış” nedenleri + JSON çıktı biçimini içeren tam promptu üretir → **Kopyala**, sohbet aracında yeni sohbete yapıştırılır.
3. Gelen yanıt (```json bloğu) geri yapıştırılır → şema doğrulaması (seçenek sayısı, doğru cevap, SVG temizliği) → havuza “Onay bekliyor” olarak düşer. Hatalı JSON'da hangi alanın bozuk olduğu söylenir.
4. Revizyon da aynı şekilde: Olmamış → Revize et → revizyon promptu kopyalanır → düzeltilmiş soru yapıştırılır → yeni sürüm, ID değişmez.
- Öneri: soru metni ve SVG için **Claude** (uzun JSON ve SVG'de en tutarlısı), görsel için **ChatGPT**.

**B) API ile (isteğe bağlı).** `ANTHROPIC_API_KEY` tanımlanırsa tek tıkla otomatik üretim ve revizyon (`claude-opus-5-5`, yapılandırılmış çıktı). Toplu/gece üretimi (Faz 2) yalnızca bu yolla otomatikleşebilir.

- **Doğrulama turu (Faz 2):** ikinci bir model soruyu bağımsız çözer; cevap uyuşmazsa soru "şüpheli" işaretlenir.
- **Görseller — hibrit yaklaşım:**
  - **Kesin veri taşıyan figürler** (raf ölçüleri, terazideki ağırlıklar, ızgara, grafik, geometrik şekil): AI görsel modelleri sayıları ve oranları sık bozar. Bunlar için soruyla birlikte **SVG** üretilir; ölçüler birebir doğru olur, anında görünür.
  - **Atmosfer / gerçekçi sahne**: soru sayfasındaki **ChatGPT promptu** (sahne + zorunlu etiketler + kaçınılacaklar) kopyalanır, ChatGPT'de üretilen görsel indirilip **Görsel yükle** ile soruya eklenir. Yüklenen görsel SVG'nin önüne geçer; kaldırılırsa SVG'ye dönülür.

### 5.3 Referans görsellerden çıkan stil kuralları
Yüklenen 4 örnek sayfadan (Çarpanlar–Katlar, Oran–Orantı, Denklemler, Sayma–Olasılık):
- Senaryo 1–3 cümle; **çözüm için gereken bilgi görselin içinde** (ölçüler, etiketler, sayılar).
- Görsel: temiz, düz (flat) vektör illüstrasyon; pastel ama ayırt edilebilir renkler; beyaz zemin; gölge yok/az.
- Soru kökü kalın ve "Buna göre, …" kalıbıyla biter; olumsuz kök ("…**en çok** …", "**değildir**") altı çizili/kalın.
- Seçenekler sayısal ve sıralı; çeldiriciler tipik öğrenci hatalarından türetilir.
- Kaynak etiketi biçimi (ör. "(MSÜ 2019)") **kullanılmaz**; yerine kendi ID'miz yazılır.

### 5.4 Günlük hedef
- Panoda günlük sayaç: `görselli x/20`, `görselsiz y/30`.
- "Günün planını oluştur" butonu: zayıf kalan ders/kazanımlara göre dağıtım önerir (ör. LGS Mat 8, TYT Mat 12, TYT Türkçe 10…).
- Faz 2: zamanlanmış toplu üretim (gece Batch API ile %50 maliyetle), sabah onay kuyruğu hazır.

## 6. Kalite kontrol

1. **Şema kontrolü:** seçenek sayısı sınava uygun, tek doğru cevap, cevap şıkkı mevcut.
2. **Tekrar/benzerlik kontrolü:** aynı kazanımdaki sorularla metin benzerliği (kelime 3-gram Jaccard). Eşik (%35, `src/lib/similarity.ts`) üstü → "benzer soru var" uyarısı + bağlantı. Faz 2: embedding ile anlamsal benzerlik.
3. **Olmuş / Olmamış** (her sorunun en altında, sabit bar):
   - **Olmuş** → durum `onaylandi`, havuzda çekilebilir hale gelir.
   - **Olmamış** → neden seçimi (görsel soruyla uyumsuz · müfredat dışı · cevap/çözüm hatalı · çok kolay · çeldiriciler zayıf · dil/anlatım · diğer) + serbest not, ardından:
     - **Revize et:** Claude, işaretlenen nedenler ve not ile soruyu yeniden yazar. Eski sürüm `revizyonlar`'a girer, ID değişmez, tekrar onaya düşer.
     - **Kaldır:** soru `kaldirildi` olur (yumuşak silme; arşivden geri alınabilir).
4. **Geri bildirim döngüsü:** sık "olmamış" nedenleri istatistik panelinde görünür ve üretim promptuna "kaçınılacaklar" olarak eklenir.

## 7. Havuz ve soru çekme
- Filtreler: sınav, ders, ünite, kazanım, zorluk, tür, durum, serbest metin, ID.
- Çoklu seçim → "Denemeye ekle".
- Her kartta: ID, etiketler, küçük görsel, durum rozeti, onay/ret sayısı.

## 8. Deneme oluşturucu ve dışa aktarma
- Havuzdan seçilen (veya kurala göre otomatik çekilen: "TYT Mat, 40 soru, %60 orta %40 zor") sorularla deneme seti.
- Kitapçık görünümü: A4, iki sütun, soru numaraları, görseller; **cevap anahtarı** ve **çözüm kitapçığı** ayrı sayfa.
- Tarayıcıdan **PDF olarak yazdır** (Faz 1); Faz 2: sunucuda PDF + Word, A/B kitapçık (şık karıştırma).

## 9. İstatistik paneli
- Günlük/haftalık üretim, onay oranı, olmamış nedenleri dağılımı.
- Ders × zorluk ısı haritası, kazanım kapsama oranı (hangi kazanımda hiç soru yok).
- Maliyet takibi (soru başına API maliyeti).

## 10. Teknik mimari

| Katman | Seçim | Neden |
|---|---|---|
| Uygulama | **Next.js 15 (App Router) + TypeScript** | Tek kod tabanında arayüz + API, Vercel'e tek tıkla |
| Arayüz | Tailwind CSS v4, Lucide ikonlar, Fraunces + Inter yazı tipleri | Premium, sade, hızlı |
| Veri (Faz 1) | Yerel JSON deposu (`data/pool.json`) | Kurulumsuz çalışır |
| Veri (Faz 2) | **Supabase** (Postgres + Storage + Auth) — şema `supabase/schema.sql`'de hazır | Görsel depolama, çoklu kullanıcı, yedek |
| AI | Sohbet aracı (kopyala-yapıştır) veya Anthropic Claude API | Abonelik kotasıyla çalışır; API anahtarı opsiyonel |
| Görsel | SVG + ChatGPT (manuel yükleme) | |

Klasör yapısı:
```
src/app/            sayfalar: / (pano), /uret, /havuz, /soru/[id], /deneme
src/app/api/        questions, generate (API), import (sohbet aracı)
src/lib/            store, prompts, ai, context, similarity, types
src/data/           curriculum.ts, seed.ts
docs/PLAN.md        bu belge
supabase/schema.sql Faz 2 şeması
```

## 11. Alınan kararlar
1. **Üretim:** API yerine kullanıcının sohbet aracı kotası (Claude / ChatGPT / Gemini) — kopyala-yapıştır modu. API modu kodda hazır, anahtar eklenirse açılır.
2. **Görsel servisi:** ChatGPT (günlük kota). Veri taşıyan figürlerde SVG yedek/öncelik.
3. **Supabase:** çoklu cihaz/kişi kullanımı istenirse açılacak.
4. Başlangıç dersleri önerisi: LGS Matematik + TYT Matematik, ardından Fen ve Türkçe.

## 12. Yol haritası

| Faz | Kapsam |
|---|---|
| **Faz 1 (bu PR)** | Plan, arayüz, havuz, filtreler, soru sayfası, Olmuş/Olmamış + revize/kaldır akışı, revizyon geçmişi, sohbet aracıyla (kopyala-yapıştır) ve API ile üretim (soru + görsel prompt + SVG), ChatGPT görsel akışı, benzerlik uyarısı, günlük hedef panosu, deneme kitapçığı + cevap anahtarı yazdırma |
| Faz 2 | Supabase'e geçiş, görsel servisi entegrasyonu, görsel yükleme depolama, bağımsız çözüm doğrulaması, tam MEB kazanım listesi, toplu gece üretimi |
| Faz 3 | Çok kullanıcı (editör/onaylayıcı rolleri), A/B kitapçık, Word çıktısı, embedding benzerlik, öğrenci deneme sonuç analizi |
