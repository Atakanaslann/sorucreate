"use client";
import { useState } from "react";
import clsx from "clsx";
import { Check, ClipboardPaste, Copy, ExternalLink, Loader2, Upload } from "lucide-react";

export const ARACLAR = [
  { key: "Claude", url: "https://claude.ai/new", not: "Önerilen: SVG ve uzun JSON'da en tutarlısı" },
  { key: "ChatGPT", url: "https://chatgpt.com/", not: "" },
  { key: "Gemini", url: "https://gemini.google.com/app", not: "" },
] as const;

/**
 * API'siz mod: promptu kopyala → sohbet aracında çalıştır → yanıtı yapıştır → içe aktar.
 */
export function ChatHandoff({
  prompt,
  baslik,
  onImport,
  dugmeMetni = "Havuza aktar",
}: {
  prompt: string;
  baslik?: string;
  onImport: (metin: string, arac: string) => Promise<string | null>;
  dugmeMetni?: string;
}) {
  const [arac, setArac] = useState<string>("Claude");
  const [kopya, setKopya] = useState(false);
  const [metin, setMetin] = useState("");
  const [busy, setBusy] = useState(false);
  const [hata, setHata] = useState<string | null>(null);

  const kopyala = async () => {
    await navigator.clipboard.writeText(prompt);
    setKopya(true);
    setTimeout(() => setKopya(false), 2000);
  };

  return (
    <div className="card pop space-y-6 p-6 sm:p-7">
      {baslik && <h3 className="font-display text-xl">{baslik}</h3>}
      <ol className="space-y-6">
        <li className="flex gap-4">
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-gradient-to-br from-[#f3dfae] to-[#b8873a] font-display text-sm font-semibold text-[#14100a]">1</span>
          <div className="min-w-0 flex-1 space-y-3">
            <p className="font-semibold">Promptu kopyala ve sohbet aracında yeni bir sohbete yapıştır</p>
            <div className="flex flex-wrap gap-2">
              {ARACLAR.map((a) => (
                <button key={a.key} type="button" onClick={() => setArac(a.key)} className={clsx("rounded-full border px-3 py-1.5 text-sm transition", arac === a.key ? "border-ink bg-ink text-white shadow-[0_6px_14px_-6px_rgba(13,16,23,.5)]" : "border-line-2 bg-card hover:border-ink/30")}>
                  {a.key}
                </button>
              ))}
            </div>
            <p className="text-xs text-muted">{ARACLAR.find((a) => a.key === arac)?.not || "Yanıt JSON değilse “Sadece istenen json kod bloğunu ver” diye tekrar iste."}</p>
            <div className="flex flex-wrap gap-2">
              <button type="button" className="btn btn-primary" onClick={kopyala}>{kopya ? <Check size={16} /> : <Copy size={16} />} {kopya ? "Kopyalandı" : "Promptu kopyala"}</button>
              <a className="btn" href={ARACLAR.find((a) => a.key === arac)!.url} target="_blank" rel="noreferrer"><ExternalLink size={16} /> {arac}&apos;ı aç</a>
            </div>
            <details className="rounded-xl bg-paper p-3 text-xs text-ink-2">
              <summary className="cursor-pointer font-semibold">Promptu göster ({prompt.length.toLocaleString("tr-TR")} karakter)</summary>
              <pre className="mt-3 max-h-72 overflow-auto whitespace-pre-wrap font-mono leading-relaxed">{prompt}</pre>
            </details>
          </div>
        </li>
        <li className="flex gap-4">
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-gradient-to-br from-[#f3dfae] to-[#b8873a] font-display text-sm font-semibold text-[#14100a]">2</span>
          <div className="min-w-0 flex-1 space-y-3">
            <p className="font-semibold">Gelen yanıtın tamamını buraya yapıştır</p>
            <textarea className="field font-mono !text-xs" rows={7} value={metin} onChange={(e) => setMetin(e.target.value)} placeholder={'```json\n{ "sorular": [ … ] }\n```'} />
            <div className="flex flex-wrap items-center gap-2">
              <button type="button" className="btn" onClick={async () => setMetin(await navigator.clipboard.readText())}><ClipboardPaste size={16} /> Panodan yapıştır</button>
              <button
                type="button"
                className="btn btn-ok"
                disabled={busy || !metin.trim()}
                onClick={async () => {
                  setBusy(true);
                  setHata(null);
                  const err = await onImport(metin, arac);
                  setBusy(false);
                  if (err) setHata(err);
                  else setMetin("");
                }}
              >
                {busy ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />} {dugmeMetni}
              </button>
            </div>
            {hata && <p className="rounded-xl bg-bad-soft p-3 text-sm text-bad">{hata}</p>}
          </div>
        </li>
      </ol>
    </div>
  );
}
