"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight, Search, Sparkles } from "lucide-react";
import { NAV, navAktif, acPalet } from "./nav";
import { Logo } from "./Sidebar";
import { useStats } from "./useStats";

export function Topbar() {
  const path = usePathname();
  const st = useStats();
  const aktif = NAV.find((n) => navAktif(path, n.href));
  const soruId = path.startsWith("/soru/") ? decodeURIComponent(path.split("/")[2] ?? "") : null;
  return (
    <header className="no-print sticky top-0 z-30 border-b border-line bg-paper/75 backdrop-blur-xl backdrop-saturate-150">
      <div className="flex h-16 items-center gap-3 px-4 sm:px-8 lg:px-12">
        <Link href="/" className="lg:hidden"><Logo small /></Link>
        <nav className="flex min-w-0 items-center gap-1.5 text-sm">
          <span className="hidden text-muted sm:inline">SoruCreate</span>
          <ChevronRight size={14} className="hidden text-muted/60 sm:inline" />
          {soruId ? (
            <>
              <Link href="/havuz" className="text-muted hover:text-ink">Havuz</Link>
              <ChevronRight size={14} className="text-muted/60" />
              <span className="truncate font-mono text-[13px] font-semibold">{soruId}</span>
            </>
          ) : (
            <span className="truncate font-semibold">{aktif?.label ?? "SoruCreate"}</span>
          )}
        </nav>
        <div className="ml-auto flex items-center gap-2">
          {st && st.bekleyen > 0 && (
            <Link href="/incele" className="chip hidden !bg-gold-soft !text-[#7a5716] transition hover:!bg-[#f0e0bd] md:inline-flex">
              <span className="relative flex h-2 w-2"><span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-gold opacity-60" /><span className="relative inline-flex h-2 w-2 rounded-full bg-gold" /></span>
              {st.bekleyen} soru onay bekliyor
            </Link>
          )}
          <button onClick={acPalet} className="btn btn-sm hidden w-56 !justify-start !text-muted sm:inline-flex">
            <Search size={14} />
            <span className="flex-1 text-left font-normal">Soru ara…</span>
            <span className="kbd">⌘K</span>
          </button>
          <button onClick={acPalet} className="btn btn-sm !px-2.5 sm:hidden" aria-label="Ara"><Search size={16} /></button>
          {path !== "/uret" && (
            <Link href="/uret" className="btn btn-primary btn-sm"><Sparkles size={14} className="text-gold-2" /> Üret</Link>
          )}
        </div>
      </div>
    </header>
  );
}
