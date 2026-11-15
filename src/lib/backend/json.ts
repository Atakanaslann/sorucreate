import { promises as fs } from "fs";
import path from "path";
import { randomUUID } from "crypto";
import type { Backend } from "./types";
import type { Soru, UretimIsi } from "../types";

interface DB {
  sayaclar: Record<string, number>;
  sorular: Soru[];
  isler?: UretimIsi[];
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
    const db = JSON.parse(await fs.readFile(DB_PATH, "utf8")) as DB;
    db.isler ??= [];
    return db;
  } catch {
    return { sayaclar: {}, sorular: [], isler: [] };
  }
}

async function write(db: DB) {
  await fs.mkdir(DATA_DIR, { recursive: true });
  const tmp = `${DB_PATH}.${randomUUID()}.tmp`;
  await fs.writeFile(tmp, JSON.stringify(db, null, 2), "utf8");
  await fs.rename(tmp, DB_PATH);
}

export const jsonBackend: Backend = {
  ad: "yerel",
  all: async () => (await load()).sorular,
  get: async (id) => (await load()).sorular.find((s) => s.id === id) ?? null,
  save: (list) =>
    locked(async () => {
      const db = await load();
      for (const s of list) {
        const i = db.sorular.findIndex((x) => x.id === s.id);
        if (i >= 0) db.sorular[i] = s;
        else db.sorular.push(s);
      }
      await write(db);
    }),
  sayacArtir: (anahtar, n) =>
    locked(async () => {
      const db = await load();
      db.sayaclar[anahtar] = (db.sayaclar[anahtar] ?? 0) + n;
      await write(db);
      return db.sayaclar[anahtar];
    }),
  isEkle: (istek) =>
    locked(async () => {
      const db = await load();
      const is: UretimIsi = { id: randomUUID(), durum: "kuyrukta", istek, soru_idleri: [], olusturma: new Date().toISOString() };
      db.isler!.push(is);
      db.isler = db.isler!.slice(-200);
      await write(db);
      return is;
    }),
  isGetir: async (id) => (await load()).isler!.find((x) => x.id === id) ?? null,
  isListe: async (limit) => [...(await load()).isler!].reverse().slice(0, limit),
  isAl: (isci) =>
    locked(async () => {
      const db = await load();
      const is = db.isler!.find((x) => x.durum === "kuyrukta");
      if (!is) return null;
      Object.assign(is, { durum: "calisiyor", isci, baslama: new Date().toISOString() });
      await write(db);
      return { ...is };
    }),
  isGuncelle: (id, p) =>
    locked(async () => {
      const db = await load();
      const is = db.isler!.find((x) => x.id === id);
      if (is) Object.assign(is, p);
      await write(db);
    }),
};
