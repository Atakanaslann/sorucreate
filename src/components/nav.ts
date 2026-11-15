import { LayoutDashboard, Sparkles, Library, FileStack, ScanEye } from "lucide-react";

export const NAV = [
  { href: "/", label: "Pano", kisa: "Pano", icon: LayoutDashboard, kisayol: "G P", aciklama: "Günlük hedefler ve istatistik" },
  { href: "/uret", label: "Soru üret", kisa: "Üret", icon: Sparkles, kisayol: "G U", aciklama: "Kazanım seç, Claude üretsin" },
  { href: "/incele", label: "İnceleme", kisa: "İncele", icon: ScanEye, kisayol: "G I", aciklama: "Bekleyenleri klavyeyle onayla" },
  { href: "/havuz", label: "Soru havuzu", kisa: "Havuz", icon: Library, kisayol: "G H", aciklama: "Filtrele, ara, denemeye ekle" },
  { href: "/deneme", label: "Deneme oluştur", kisa: "Deneme", icon: FileStack, kisayol: "G D", aciklama: "Kitapçık, cevap anahtarı, çözümler" },
] as const;

export function navAktif(path: string, h: string) {
  if (h === "/") return path === "/";
  return path.startsWith(h) || (h === "/havuz" && path.startsWith("/soru"));
}

export function acPalet() {
  window.dispatchEvent(new Event("palet"));
}
