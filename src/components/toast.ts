export type ToastTur = "ok" | "uyari" | "bilgi";
export interface ToastDetay { text: string; tur?: ToastTur; aciklama?: string }

/** Herhangi bir istemci bileşeninden bildirim göstermek için. */
export function toast(text: string, tur: ToastTur = "ok", aciklama?: string) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent<ToastDetay>("toast", { detail: { text, tur, aciklama } }));
}
