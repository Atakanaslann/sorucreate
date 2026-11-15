/** Basit, bağımlılıksız metin benzerliği: kelime 3-gram Jaccard. */

export function normalize(text: string) {
  return text
    .toLocaleLowerCase("tr-TR")
    .replace(/[^a-zçğıöşü0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function shingles(text: string, n = 3) {
  const words = normalize(text).split(" ").filter(Boolean);
  const set = new Set<string>();
  if (words.length < n) {
    if (words.length) set.add(words.join(" "));
    return set;
  }
  for (let i = 0; i <= words.length - n; i++) set.add(words.slice(i, i + n).join(" "));
  return set;
}

export function fingerprint(senaryo: string, kok: string) {
  return normalize(`${senaryo} ${kok}`);
}

export function jaccard(a: string, b: string) {
  const A = shingles(a);
  const B = shingles(b);
  if (!A.size || !B.size) return 0;
  let inter = 0;
  for (const x of A) if (B.has(x)) inter++;
  return inter / (A.size + B.size - inter);
}

export const BENZERLIK_ESIGI = 0.35;
