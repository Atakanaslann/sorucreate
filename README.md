# SoruCreate

TYT · AYT · LGS için MEB müfredatına uygun, orta/zor seviyede, metin tabanlı ve **yeni nesil (görselli)** soru üreten; soruları benzersiz ID ile havuzda tutan ve **Olmuş / Olmamış** akışıyla kalite kontrolünden geçiren web platformu.

Ayrıntılı plan: [docs/PLAN.md](docs/PLAN.md)

## Hızlı başlangıç

```bash
npm install
cp .env.example .env.local   # ANTHROPIC_API_KEY değerini doldurun
npm run dev                  # http://localhost:3000
```

API anahtarı olmadan da arayüz örnek sorularla çalışır; yalnızca “Üret” ve “AI ile revize et” devre dışı kalır.

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
