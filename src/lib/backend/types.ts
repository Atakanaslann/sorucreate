import type { Soru, UretimIsi } from "../types";

/** Depolama arayüzü: yerel JSON dosyası ya da Supabase. */
export interface Backend {
  ad: "yerel" | "supabase";
  all(): Promise<Soru[]>;
  get(id: string): Promise<Soru | null>;
  save(list: Soru[]): Promise<void>;
  /** Sayaç anahtarını n artırır, yeni değeri döner (atanan numaralar: deger-n+1 … deger). */
  sayacArtir(anahtar: string, n: number): Promise<number>;
  isEkle(istek: UretimIsi["istek"]): Promise<UretimIsi>;
  isGetir(id: string): Promise<UretimIsi | null>;
  isListe(limit: number): Promise<UretimIsi[]>;
  isAl(isci: string): Promise<UretimIsi | null>;
  isGuncelle(id: string, p: Partial<UretimIsi>): Promise<void>;
}
