import "server-only";
import { dersBul } from "@/data/curriculum";
import { ornekSorular } from "@/data/seed";
import { backend } from "./backend";
import { fingerprint, jaccard, BENZERLIK_ESIGI } from "./similarity";
import type { Soru, SoruFiltre, SoruIcerik, Sinav, Geribildirim } from "./types";

/**
 * Soru havuzu işlemleri. Depolama `backend()` ile seçilir:
 * SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY tanımlıysa Supabase, yoksa data/pool.json.
 */

let tohumlandi = false;
async function tumu(): Promise<Soru[]> {
  const b = backend();
  const list = await b.all();
  if (list.length || tohumlandi) return list;
  tohumlandi = true;
  const ornek = ornekSorular();
  const ids = await yeniIdler(ornek.map((s) => ({ sinav: s.sinav, ders: s.ders })));
  const yeni = ornek.map((s, i) => ({ ...s, id: ids[i] }));
  await b.save(yeni);
  return yeni;
}

async function yeniIdler(items: { sinav: Sinav; ders: string }[]) {
  const gruplar = new Map<string, number[]>();
  items.forEach((it, i) => {
    const key = `${it.sinav}-${dersBul(it.sinav, it.ders)?.kisa ?? "GEN"}`;
    gruplar.set(key, [...(gruplar.get(key) ?? []), i]);
  });
  const ids: string[] = new Array(items.length);
  for (const [key, idx] of gruplar) {
    const son = await backend().sayacArtir(key, idx.length);
    idx.forEach((i, k) => (ids[i] = `SC-${key}-${String(son - idx.length + 1 + k).padStart(5, "0")}`));
  }
  return ids;
}

export async function listQuestions(f: SoruFiltre = {}) {
  const q = f.q?.toLocaleLowerCase("tr-TR").trim();
  return (await tumu())
    .filter((s) => {
      if (f.sinav && s.sinav !== f.sinav) return false;
      if (f.ders && s.ders !== f.ders) return false;
      if (f.unite && s.unite !== f.unite) return false;
      if (f.kazanim && s.kazanimKodu !== f.kazanim) return false;
      if (f.zorluk && s.zorluk !== f.zorluk) return false;
      if (f.tur && s.tur !== f.tur) return false;
      if (f.durum) {
        if (s.durum !== f.durum) return false;
      } else if (s.durum === "kaldirildi") return false;
      if (q) {
        const hay = `${s.id} ${s.senaryo} ${s.kok} ${s.unite} ${s.kazanimKodu}`.toLocaleLowerCase("tr-TR");
        if (!hay.includes(q)) return false;
      }
      return true;
    })
    .sort((a, b) => b.olusturma.localeCompare(a.olusturma));
}

export async function getQuestion(id: string) {
  await tumu();
  return backend().get(id);
}

export async function getQuestions(ids: string[]) {
  const all = await tumu();
  return ids.map((id) => all.find((s) => s.id === id)).filter(Boolean) as Soru[];
}

export function findSimilar(sorular: Soru[], cand: Pick<Soru, "kazanimKodu" | "parmakIzi" | "id">) {
  return sorular
    .filter((s) => s.id !== cand.id && s.durum !== "kaldirildi" && s.kazanimKodu === cand.kazanimKodu)
    .map((s) => ({ id: s.id, skor: jaccard(s.parmakIzi, cand.parmakIzi) }))
    .filter((x) => x.skor >= BENZERLIK_ESIGI)
    .sort((a, b) => b.skor - a.skor);
}

export async function similarTo(id: string) {
  const all = await tumu();
  const s = all.find((x) => x.id === id);
  return s ? findSimilar(all, s) : [];
}

export type YeniSoru = Omit<
  Soru,
  "id" | "durum" | "surum" | "geribildirim" | "revizyonlar" | "parmakIzi" | "olusturma" | "guncelleme"
>;

export async function createQuestions(items: YeniSoru[]) {
  if (!items.length) return [];
  const ids = await yeniIdler(items);
  const now = new Date().toISOString();
  const created: Soru[] = items.map((it, i) => ({
    ...it,
    id: ids[i],
    durum: "taslak",
    surum: 1,
    geribildirim: [],
    revizyonlar: [],
    parmakIzi: fingerprint(it.senaryo, it.kok),
    olusturma: now,
    guncelleme: now,
  }));
  await backend().save(created);
  return created;
}

async function mutate(id: string, fn: (s: Soru) => void) {
  const s = await backend().get(id);
  if (!s) return null;
  fn(s);
  s.guncelleme = new Date().toISOString();
  await backend().save([s]);
  return s;
}

export function addFeedback(id: string, g: Omit<Geribildirim, "tarih">) {
  return mutate(id, (s) => {
    s.geribildirim.push({ ...g, tarih: new Date().toISOString() });
    if (g.karar === "olmus") s.durum = "onaylandi";
    else if (g.aksiyon === "kaldir") s.durum = "kaldirildi";
    else s.durum = "revizyonda";
  });
}

function snapshot(s: Soru, neden?: string) {
  const { senaryo, kok, secenekler, dogruCevap, cozum, beceri, gorsel } = s;
  s.revizyonlar.push({ senaryo, kok, secenekler, dogruCevap, cozum, beceri, gorsel, surum: s.surum, tarih: new Date().toISOString(), neden });
}

/** İçeriği yeni sürümle değiştirir; eski sürüm geçmişe yazılır, ID değişmez. */
export function reviseQuestion(id: string, icerik: SoruIcerik, neden?: string, model?: string, kaynak?: Soru["meta"]["kaynak"]) {
  return mutate(id, (s) => {
    snapshot(s, neden);
    Object.assign(s, icerik);
    s.surum += 1;
    s.durum = "taslak";
    s.parmakIzi = fingerprint(s.senaryo, s.kok);
    if (model) s.meta = { ...s.meta, model, ...(kaynak ? { kaynak } : {}) };
  });
}

export function restoreRevision(id: string, surum: number) {
  return mutate(id, (s) => {
    const r = s.revizyonlar.find((x) => x.surum === surum);
    if (!r) return;
    snapshot(s, `Sürüm ${surum} geri yüklendi`);
    const { senaryo, kok, secenekler, dogruCevap, cozum, beceri, gorsel } = r;
    Object.assign(s, { senaryo, kok, secenekler, dogruCevap, cozum, beceri, gorsel });
    s.surum += 1;
    s.durum = "taslak";
    s.parmakIzi = fingerprint(s.senaryo, s.kok);
  });
}

export function setStatus(id: string, durum: Soru["durum"]) {
  return mutate(id, (s) => {
    s.durum = durum;
  });
}

export function setImage(id: string, url: string | undefined) {
  return mutate(id, (s) => {
    if (s.gorsel) s.gorsel.url = url;
  });
}

export async function stats() {
  const all = await tumu();
  const fmt = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Istanbul" });
  const today = fmt.format(new Date());
  const aktif = all.filter((s) => s.durum !== "kaldirildi");
  const bugun = all.filter((s) => fmt.format(new Date(s.olusturma)) === today && s.meta.kaynak !== "ornek");
  const count = (arr: Soru[], key: (s: Soru) => string) =>
    arr.reduce<Record<string, number>>((acc, s) => {
      const k = key(s);
      acc[k] = (acc[k] ?? 0) + 1;
      return acc;
    }, {});
  const nedenler: Record<string, number> = {};
  let olmus = 0;
  let olmamis = 0;
  for (const s of all)
    for (const g of s.geribildirim) {
      if (g.karar === "olmus") olmus++;
      else {
        olmamis++;
        for (const n of g.nedenler) nedenler[n] = (nedenler[n] ?? 0) + 1;
      }
    }
  return {
    toplam: aktif.length,
    durum: count(all, (s) => s.durum),
    dersZorluk: count(aktif, (s) => `${s.sinav} ${s.ders}|${s.zorluk}`),
    bugun: { gorselli: bugun.filter((s) => s.tur === "gorselli").length, gorselsiz: bugun.filter((s) => s.tur === "gorselsiz").length },
    geribildirim: { olmus, olmamis, nedenler },
    kapsananKazanim: new Set(aktif.map((s) => `${s.sinav}|${s.kazanimKodu}`)).size,
    son: [...all].sort((a, b) => b.guncelleme.localeCompare(a.guncelleme)).slice(0, 6),
  };
}
