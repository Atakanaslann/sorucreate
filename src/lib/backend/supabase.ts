import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Backend } from "./types";
import type { Soru, UretimIsi } from "../types";

let _c: SupabaseClient | null = null;
function c() {
  _c ??= createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return _c;
}

function hata(e: { message: string } | null) {
  if (e) throw new Error(`Supabase: ${e.message}`);
}

const satir = (s: Soru) => ({
  id: s.id,
  sinav: s.sinav,
  ders: s.ders,
  kazanim_kodu: s.kazanimKodu,
  durum: s.durum,
  data: s,
  olusturma: s.olusturma,
  guncelleme: s.guncelleme,
});

export const supabaseBackend: Backend = {
  ad: "supabase",
  async all() {
    const out: Soru[] = [];
    for (let from = 0; ; from += 1000) {
      const { data, error } = await c().from("sorular").select("data").order("olusturma", { ascending: false }).range(from, from + 999);
      hata(error);
      out.push(...(data ?? []).map((r) => r.data as Soru));
      if (!data || data.length < 1000) return out;
    }
  },
  async get(id) {
    const { data, error } = await c().from("sorular").select("data").eq("id", id).maybeSingle();
    hata(error);
    return (data?.data as Soru) ?? null;
  },
  async save(list) {
    if (!list.length) return;
    const { error } = await c().from("sorular").upsert(list.map(satir));
    hata(error);
  },
  async sayacArtir(anahtar, n) {
    const { data, error } = await c().rpc("sayac_artir", { p_anahtar: anahtar, p_adet: n });
    hata(error);
    return data as number;
  },
  async isEkle(istek) {
    const { data, error } = await c().from("uretim_isleri").insert({ istek }).select().single();
    hata(error);
    return data as UretimIsi;
  },
  async isGetir(id) {
    const { data, error } = await c().from("uretim_isleri").select().eq("id", id).maybeSingle();
    hata(error);
    return (data as UretimIsi) ?? null;
  },
  async isListe(limit) {
    const { data, error } = await c().from("uretim_isleri").select().order("olusturma", { ascending: false }).limit(limit);
    hata(error);
    return (data ?? []) as UretimIsi[];
  },
  async isAl(isci) {
    const { data, error } = await c().rpc("is_al", { p_isci: isci });
    hata(error);
    return ((data as UretimIsi[]) ?? [])[0] ?? null;
  },
  async isGuncelle(id, p) {
    const { error } = await c().from("uretim_isleri").update(p).eq("id", id);
    hata(error);
  },
};
