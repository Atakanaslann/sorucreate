"use client";
import { useCallback, useEffect, useState } from "react";

const KEY = "sorucreate.deneme";

function read(): string[] {
  try { return JSON.parse(localStorage.getItem(KEY) ?? "[]"); } catch { return []; }
}

/** Deneme sepeti: tarayıcıda tutulan seçili soru ID'leri. */
export function useDeneme() {
  const [ids, setIds] = useState<string[]>([]);
  useEffect(() => {
    setIds(read());
    const h = () => setIds(read());
    window.addEventListener("deneme-change", h);
    return () => window.removeEventListener("deneme-change", h);
  }, []);
  const save = useCallback((n: string[]) => {
    try { localStorage.setItem(KEY, JSON.stringify(n)); } catch {}
    setIds(n);
    window.dispatchEvent(new Event("deneme-change"));
  }, []);
  const toggle = useCallback((id: string) => {
    const cur = read();
    save(cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]);
  }, [save]);
  return { ids, toggle, save, has: (id: string) => ids.includes(id) };
}
