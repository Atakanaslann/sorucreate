import "server-only";
import { promises as fs } from "fs";
import path from "path";
import { randomUUID } from "crypto";
import { dersBul } from "@/data/curriculum";
import { ornekSorular } from "@/data/seed";
import { fingerprint, jaccard, BENZERLIK_ESIGI } from "./similarity";
import type { Soru, SoruFiltre, SoruIcerik, Sinav, Geribildirim } from "./types";

/**
 * Faz 1 veri katmanı: tek bir JSON dosyası. Arayüz bu modülün fonksiyonlarını
 * kullanır; Faz 2'de aynı imzalarla Supabase'e taşınacak.
 */

interface DB {
  sayaclar: Record<string, number>;
  sorular: Soru[];
}

const DATA_DIR = process.env.SORUCREATE_DATA_DIR ?? path.join(process.cwd(), "data");
const DB_PATH = path.join(DATA_DIR, "pool.json");

let queue: Promise<unknown> = Promise.resolve();
function locked<T>(fn: () => Promise<T>): Promise<T> {
  const run = queue.then(fn, fn);
  queue = run.catch(() => undefined);
  return run;
}

async function load(): Promise<DB> {
  try {
    return JSON.parse(await fs.readFile(DB_PATH, "utf8")) as DB;
  } catch {
    const db: DB = { sayaclar: {}, sorular: [] };
    for (const s of ornekSorular()) {
      const { id, ...rest } = s;
      void id;
      db.sorular.push({ ...rest, id: nextId(db, s.sinav, s.ders) } as Soru);
    }
    await save(db);
    return db;
  }
}

async function save(db: DB) {
  await fs.mkdir(DATA_DIR, { recursive: true });
  const tmp = `${DB_PATH}.${randomUUID()}.tmp`;
  await fs.writeFile(tmp, JSON.stringify(db, null, 2), "utf8");
  await fs.rename(tmp, DB_PATH);
}

function nextId(db: DB, sinav: Sinav, ders: string) {
  const kisa = dersBul(sinav, ders)?.kisa ?? "GEN";
  const key = `${sinav}-${kisa}`;
  const n = (db.sayaclar[key] ?? 0) + 1;
  db.sayaclar[key] = n;
  return `SC-${key}-${String(n).padStart(5, "0")}`;
}

export async function listQuestions(f: SoruFiltre = {}) {
  const db = await load();
  const q = f.q?.toLocaleLowerCase("tr-TR").trim();
  return db.sorular
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
  const db = await load();
  return db.sorular.find((s) => s.id === id) ?? null;
}

export function findSimilar(sorular: Soru[], cand: Pick<Soru, "kazanimKodu" | "parmakIzi" | "id">) {
  return sorular
    .filter((s) => s.id !== cand.id && s.durum !== "kaldirildi" && s.kazanimKodu === cand.kazanimKodu)
    .map((s) => ({ id: s.id, skor: jaccard(s.parmakIzi, cand.parmakIzi) }))
    .filter((x) => x.skor >= BENZERLIK_ESIGI)
    .sort((a, b) => b.skor - a.skor);
}

export async function similarTo(id: string) {
  const db = await load();
  const s = db.sorular.find((x) => x.id === id);
  return s ? findSimilar(db.sorular, s) : [];
}

export type YeniSoru = Omit<
  Soru,
  "id" | "durum" | "surum" | "geribildirim" | "revizyonlar" | "parmakIzi" | "olusturma" | "guncelleme"
>;

export function createQuestions(items: YeniSoru[]) {
  return locked(async () => {
    const db = await load();
    const now = new Date().toISOString();
    const created: Soru[] = items.map((it) => ({
      ...it,
      id: nextId(db, it.sinav, it.ders),
      durum: "taslak",
      surum: 1,
      geribildirim: [],
      revizyonlar: [],
      parmakIzi: fingerprint(it.senaryo, it.kok),
      olusturma: now,
      guncelleme: now,
    }));
    db.sorular.push(...created);
    await save(db);
    return created;
  });
}

function mutate(id: string, fn: (s: Soru) => void) {
  return locked(async () => {
    const db = await load();
    const s = db.sorular.find((x) => x.id === id);
    if (!s) return null;
    fn(s);
    s.guncelleme = new Date().toISOString();
    await save(db);
    return s;
  });
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
  s.revizyonlar.push({
    senaryo, kok, secenekler, dogruCevap, cozum, beceri, gorsel,
    surum: s.surum, tarih: new Date().toISOString(), neden,
  });
}

/** İçeriği yeni sürümle değiştirir; eski sürüm geçmişe yazılır, ID değişmez. */
export function reviseQuestion(id: string, icerik: SoruIcerik, neden?: string, model?: string) {
  return mutate(id, (s) => {
    snapshot(s, neden);
    Object.assign(s, icerik);
    // Yüklenmiş görsel varsa ve yeni brif görsel taşıyorsa korunmaz: yeni brif = yeni görsel.
    s.surum += 1;
    s.durum = "taslak";
    s.parmakIzi = fingerprint(s.senaryo, s.kok);
    if (model) s.meta = { ...s.meta, model };
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
    if (!s.gorsel) return;
    s.gorsel.url = url;
  });
}

export async function stats() {
  const db = await load();
  const today = new Date().toISOString().slice(0, 10);
  const aktif = db.sorular.filter((s) => s.durum !== "kaldirildi");
  const bugun = db.sorular.filter((s) => s.olusturma.slice(0, 10) === today && s.meta.kaynak !== "ornek");
  const count = <T extends string>(arr: Soru[], key: (s: Soru) => T) =>
    arr.reduce<Record<string, number>>((acc, s) => {
      const k = key(s);
      acc[k] = (acc[k] ?? 0) + 1;
      return acc;
    }, {});
  const nedenler: Record<string, number> = {};
  let olmus = 0;
  let olmamis = 0;
  for (const s of db.sorular)
    for (const g of s.geribildirim) {
      if (g.karar === "olmus") olmus++;
      else {
        olmamis++;
        for (const n of g.nedenler) nedenler[n] = (nedenler[n] ?? 0) + 1;
      }
    }
  return {
    toplam: aktif.length,
    durum: count(db.sorular, (s) => s.durum),
    sinav: count(aktif, (s) => s.sinav),
    zorluk: count(aktif, (s) => s.zorluk),
    tur: count(aktif, (s) => s.tur),
    dersZorluk: count(aktif, (s) => `${s.sinav} ${s.ders}|${s.zorluk}`),
    bugun: { gorselli: bugun.filter((s) => s.tur === "gorselli").length, gorselsiz: bugun.filter((s) => s.tur === "gorselsiz").length },
    geribildirim: { olmus, olmamis, nedenler },
    kapsananKazanim: new Set(aktif.map((s) => `${s.sinav}|${s.kazanimKodu}`)).size,
    son: [...db.sorular].sort((a, b) => b.guncelleme.localeCompare(a.guncelleme)).slice(0, 6),
  };
}
