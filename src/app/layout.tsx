import type { Metadata } from "next";
import { Inter, Fraunces } from "next/font/google";
import { Sidebar } from "@/components/Sidebar";
import "./globals.css";

const inter = Inter({ variable: "--font-inter", subsets: ["latin", "latin-ext"] });
const fraunces = Fraunces({ variable: "--font-fraunces", subsets: ["latin", "latin-ext"] });

export const metadata: Metadata = {
  title: "SoruCreate",
  description: "MEB müfredatına uygun TYT · AYT · LGS soru üretim ve havuz platformu",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="tr">
      <body className={`${inter.variable} ${fraunces.variable}`}>
        <div className="flex min-h-screen">
          <Sidebar />
          <main className="min-w-0 flex-1 px-4 py-6 sm:px-8 lg:px-12 lg:py-10">{children}</main>
        </div>
      </body>
    </html>
  );
}
