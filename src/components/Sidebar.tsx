"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Sparkles, Library, FileStack } from "lucide-react";
import clsx from "clsx";

const NAV = [
  { href: "/", label: "Pano", icon: LayoutDashboard },
  { href: "/uret", label: "Soru üret", icon: Sparkles },
  { href: "/havuz", label: "Soru havuzu", icon: Library },
  { href: "/deneme", label: "Deneme oluştur", icon: FileStack },
];

export function Sidebar() {
  const path = usePathname();
  const active = (h: string) => (h === "/" ? path === "/" : path.startsWith(h) || (h === "/havuz" && path.startsWith("/soru")));
  return (
    <>
      <aside className="no-print sticky top-0 hidden h-screen w-64 shrink-0 flex-col bg-ink px-5 py-7 text-white lg:flex">
        <Link href="/" className="mb-10 flex items-center gap-3 px-2">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-[#e2c27a] to-[#a8792a] font-display text-lg font-semibold text-ink">S</span>
          <span>
            <span className="block font-display text-lg leading-none">SoruCreate</span>
            <span className="text-[11px] tracking-wide text-white/50">TYT · AYT · LGS</span>
          </span>
        </Link>
        <nav className="flex flex-col gap-1">
          {NAV.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={clsx(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition",
                active(href) ? "bg-white/10 font-semibold text-white" : "text-white/60 hover:bg-white/5 hover:text-white",
              )}
            >
              <Icon size={18} strokeWidth={1.8} className={active(href) ? "text-[#e2c27a]" : ""} />
              {label}
            </Link>
          ))}
        </nav>
        <div className="mt-auto rounded-2xl border border-white/10 bg-white/5 p-4 text-xs leading-relaxed text-white/60">
          <span className="mb-1 block font-semibold text-white/90">Kaynak ilkesi</span>
          Birincil referans MEB ve ÖSYM. Yayınevleri yalnızca stil referansı; içerik kopyalanmaz.
        </div>
      </aside>
      <nav className="no-print fixed inset-x-0 bottom-0 z-40 flex justify-around border-t border-line bg-card/95 py-2 backdrop-blur lg:hidden">
        {NAV.slice(0, 4).map(({ href, label, icon: Icon }) => (
          <Link key={href} href={href} className={clsx("flex flex-col items-center gap-1 px-2 text-[11px]", active(href) ? "text-ink font-semibold" : "text-muted")}>
            <Icon size={20} strokeWidth={1.8} />
            {label}
          </Link>
        ))}
      </nav>
    </>
  );
}
