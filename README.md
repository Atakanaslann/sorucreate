# SoruCreate

TYT · AYT · LGS için MEB müfredatına uygun, orta/zor seviyede, metin tabanlı ve **yeni nesil (görselli)** soru üreten; soruları benzersiz ID ile havuzda tutan ve **Olmuş / Olmamış** akışıyla kalite kontrolünden geçiren web platformu.

Ayrıntılı plan: [docs/PLAN.md](docs/PLAN.md)

## Hızlı başlangıç

```bash
npm install
cp .env.example .env.local   # (isteğe bağlı) ANTHROPIC_API_KEY
npm run dev                  # http://localhost:3000
```

**API anahtarı gerekmez.** Üret ekranında “Sohbet aracıyla” modu, Claude.ai / ChatGPT / Gemini'ye yapıştırılacak tam promptu hazırlar; gelen JSON yanıtı geri yapıştırınca sorular doğrulanıp havuza eklenir. Revizyon da aynı yolla yapılır. `ANTHROPIC_API_KEY` eklenirse “API ile” modu tek tıkla üretir.

Görseller: soru sayfasındaki “ChatGPT promptu” → ChatGPT → indir → “Görsel yükle”. Veri taşıyan figürler için SVG her zaman hazırdır.

## Sayfalar

| Sayfa | Ne yapar |
|---|---|
| `/` Pano | Günlük hedef (20 görselli + 30 görselsiz), havuz istatistikleri, olmamış nedenleri, ders × zorluk dağılımı |
| `/uret` | Sınav → ders → ünite → kazanım, zorluk, tür, tema seç; Claude soru + çözüm + çeldirici gerekçeleri + görsel prompt + SVG figür üretir |
| `/havuz` | Filtreler (sınav, ders, ünite, zorluk, tür, durum, metin/ID), denemeye ekleme |
| `/soru/[id]` | Kitapçık görünümü, cevap/çözüm, görsel brifi (prompt kopyala, SVG indir, görsel yükle), benzerlik kontrolü, revizyon geçmişi, alttaki **Olmuş / Olmamış** çubuğu |
| `/deneme` | Seçili veya kurala göre çekilen sorulardan iki sütunlu kitapçık, cevap anahtarı, çözüm kitapçığı → Yazdır / PDF |

## Veri

Faz 1'de havuz `data/pool.json` dosyasında tutulur (git'e girmez). Faz 2 için Supabase şeması `supabase/schema.sql`'de hazır.
