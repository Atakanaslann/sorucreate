# SoruCreate

TYT · AYT · LGS için MEB müfredatına uygun, orta/zor seviyede, metin tabanlı ve **yeni nesil (görselli)** soru üreten; soruları benzersiz ID ile havuzda tutan ve **Olmuş / Olmamış** akışıyla kalite kontrolünden geçiren web platformu.

Ayrıntılı plan: [docs/PLAN.md](docs/PLAN.md)

## Hızlı başlangıç

```bash
npm install
npm i -g @anthropic-ai/claude-code   # bir kez
claude                               # bir kez: Claude Pro/Max hesabınla giriş yap, sonra çık
cp .env.example .env.local           # Supabase service_role anahtarını yapıştır (isteğe bağlı)
npm run dev                          # http://localhost:3000
```

### “Üret” nasıl çalışıyor (API ücreti yok)

“Üret”e basınca bir **üretim işi** kuyruğa eklenir. İşi bilgisayarındaki **Claude Code** (`claude -p`) yapar; Claude Code, giriş yaptığın **Claude aboneliğini** kullanır. Sorular hazır olunca havuza “Onay bekliyor” olarak düşer.

- `npm run dev` ile yerelde çalışırken üretici sunucunun içindedir, başka bir şey açmana gerek yok.
- Uygulama Vercel'de yayındaysa: `.env.local` içinde Supabase bilgileri ve `URETICI=harici` ile bilgisayarında `npm run worker` açık kalsın; siteden basılan “Üret” işlerini o yapar.
- Güvenlik: üretici alt sürece `ANTHROPIC_API_KEY` geçirmez, böylece yanlışlıkla API faturalanmaz.

Diğer yollar: “Kopyala” modu (prompt → Claude.ai / ChatGPT / Gemini → yanıtı yapıştır) ve anahtar varsa “API” modu.

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

`SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` tanımlıysa havuz ve üretim kuyruğu Supabase'te (`supabase/schema.sql`), değilse `data/pool.json` dosyasında tutulur. Tablolarda RLS açık ve politika yok: yalnızca sunucudaki service_role anahtarı erişir.
