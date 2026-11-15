import type { Metadata } from "next";
import { Inter, Fraunces, JetBrains_Mono } from "next/font/google";
import { Sidebar } from "@/components/Sidebar";
import { Topbar } from "@/components/Topbar";
import { CommandPalette } from "@/components/CommandPalette";
import { Toaster } from "@/components/Toaster";
import "./globals.css";

const inter = Inter({ variable: "--font-inter", subsets: ["latin", "latin-ext"] });
const fraunces = Fraunces({ variable: "--font-fraunces", subsets: ["latin", "latin-ext"], axes: ["SOFT", "WONK", "opsz"] });
const mono = JetBrains_Mono({ variable: "--font-mono-jb", subsets: ["latin", "latin-ext"] });

export const metadata: Metadata = {
  title: "SoruCreate",
  description: "MEB müfredatına uygun TYT · AYT · LGS soru üretim ve havuz platformu",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="tr">
      <body className={`${inter.variable} ${fraunces.variable} ${mono.variable}`}>
        <div className="flex min-h-screen">
          <Sidebar />
          <div className="flex min-w-0 flex-1 flex-col">
            <Topbar />
            <main className="min-w-0 flex-1 px-4 pb-28 pt-6 sm:px-8 lg:px-12 lg:pb-16">{children}</main>
          </div>
        </div>
        <CommandPalette />
        <Toaster />
      </body>
    </html>
  );
}
