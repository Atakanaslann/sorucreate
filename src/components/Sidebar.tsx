"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Command, ShieldCheck } from "lucide-react";
import clsx from "clsx";
import { GUNLUK_HEDEF } from "@/lib/types";
import { NAV, navAktif, acPalet } from "./nav";
import { useStats } from "./useStats";

function Meter({ label, v, max, tone }: { label: string; v: number; max: number; tone: "gold" | "blue" }) {
  const pct = Math.min(100, (v / max) * 100);
  return (
    <div>
      <div className="mb-1.5 flex items-baseline justify-between text-[11px]">
        <span className="text-white/55">{label}</span>
        <span className="tabular font-mono text-white/80">{v}<span className="text-white/35">/{max}</span></span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-white/[.07]">
        <div
          className={clsx("h-full rounded-full transition-[width] duration-700", tone === "gold" ? "bg-gradient-to-r from-[#a8792a] to-[#f0d79d]" : "bg-gradient-to-r from-[#2747c9] to-[#8ea2ff]")}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

export function Logo({ small = false }: { small?: boolean }) {
  return (
    <span className={clsx("relative grid shrink-0 place-items-center rounded-[12px] bg-gradient-to-br from-[#f3dfae] via-[#d4a85a] to-[#8c6020] font-display font-semibold text-[#14100a] shadow-[inset_0_1px_0_rgba(255,255,255,.6),0_8px_20px_-6px_rgba(212,168,90,.6)]", small ? "h-8 w-8 text-base" : "h-10 w-10 text-xl")}>
      S
    </span>
  );
}

export function Sidebar() {
  const path = usePathname();
  const st = useStats();
  return (
    <>
      <aside className="no-print sticky top-0 hidden h-screen w-[268px] shrink-0 flex-col overflow-hidden bg-[#0b0d14] px-4 py-6 text-white lg:flex">
        <div className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-[#d4a85a]/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 -right-20 h-72 w-72 rounded-full bg-[#2747c9]/25 blur-3xl" />

        <Link href="/" className="relative mb-8 flex items-center gap-3 px-2">
          <Logo />
          <span>
            <span className="block font-display text-[19px] leading-none tracking-tight">SoruCreate</span>
            <span className="mt-1 block text-[10.5px] font-medium uppercase tracking-[.18em] text-white/40">TYT · AYT · LGS</span>
          </span>
        </Link>

        <button onClick={acPalet} className="relative mb-6 flex h-10 items-center gap-2.5 rounded-xl border border-white/10 bg-white/[.04] px-3 text-left text-[13px] text-white/50 transition hover:border-white/20 hover:bg-white/[.07] hover:text-white/80">
          <Command size={14} />
          <span className="flex-1">Ara veya komut…</span>
          <span className="rounded-md border border-white/15 px-1.5 py-0.5 font-mono text-[10px] text-white/50">⌘K</span>
        </button>

        <p className="relative mb-2 px-3 text-[10px] font-semibold uppercase tracking-[.2em] text-white/30">Çalışma alanı</p>
        <nav className="relative flex flex-col gap-0.5">
          {NAV.map(({ href, label, icon: Icon }) => {
            const on = navAktif(path, href);
            return (
              <Link
                key={href}
                href={href}
                className={clsx(
                  "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13.5px] transition duration-300",
                  on ? "bg-gradient-to-r from-white/[.11] to-white/[.03] font-semibold text-white shadow-[inset_0_1px_0_rgba(255,255,255,.06)]" : "text-white/55 hover:bg-white/[.05] hover:text-white",
                )}
              >
                {on && <span className="absolute -left-4 top-1/2 h-6 w-[3px] -translate-y-1/2 rounded-r-full bg-gradient-to-b from-[#f3dfae] to-[#b8873a] shadow-[0_0_12px_rgba(230,201,138,.8)]" />}
                <Icon size={17} strokeWidth={1.8} className={clsx("transition", on ? "text-gold-2" : "text-white/45 group-hover:text-white/80")} />
                <span className="flex-1">{label}</span>
                {href === "/incele" && st && st.bekleyen > 0 && (
                  <span className="tabular rounded-full bg-gold-2/15 px-2 py-0.5 font-mono text-[10.5px] font-semibold text-gold-2">{st.bekleyen}</span>
                )}
              </Link>
            );
          })}
        </nav>

        <div className="relative mt-8 rounded-2xl border border-white/[.08] bg-white/[.035] p-4">
          <div className="mb-3.5 flex items-center justify-between">
            <span className="text-[10px] font-semibold uppercase tracking-[.2em] text-white/40">Bugün</span>
            <span className="tabular font-display text-lg leading-none text-white">
              {st ? st.bugun.gorselli + st.bugun.gorselsiz : "–"}
              <span className="text-xs text-white/35"> / {GUNLUK_HEDEF.gorselli + GUNLUK_HEDEF.gorselsiz}</span>
            </span>
          </div>
          <div className="space-y-3">
            <Meter label="Yeni nesil" v={st?.bugun.gorselli ?? 0} max={GUNLUK_HEDEF.gorselli} tone="gold" />
            <Meter label="Görselsiz" v={st?.bugun.gorselsiz ?? 0} max={GUNLUK_HEDEF.gorselsiz} tone="blue" />
          </div>
        </div>

        <div className="relative mt-auto flex items-start gap-2.5 rounded-2xl px-2 pt-6 text-[11.5px] leading-relaxed text-white/45">
          <ShieldCheck size={15} className="mt-0.5 shrink-0 text-gold-2/70" />
          <span><span className="font-semibold text-white/75">MEB · ÖSYM birincil kaynak.</span> Yayınevleri yalnızca stil referansı, içerik kopyalanmaz.</span>
        </div>
      </aside>

      <nav className="no-print fixed inset-x-3 bottom-3 z-40 flex justify-around rounded-2xl border border-white/10 bg-[#0b0d14]/92 px-1 py-1.5 shadow-[0_20px_40px_-12px_rgba(0,0,0,.5)] backdrop-blur-xl lg:hidden">
        {NAV.map(({ href, kisa, icon: Icon }) => {
          const on = navAktif(path, href);
          return (
            <Link key={href} href={href} className={clsx("flex min-w-0 flex-1 flex-col items-center gap-1 rounded-xl px-1 py-1.5 text-[10px] transition", on ? "bg-white/10 font-semibold text-white" : "text-white/50")}>
              <Icon size={19} strokeWidth={1.8} className={on ? "text-gold-2" : ""} />
              <span className="truncate">{kisa}</span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}
