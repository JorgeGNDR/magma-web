import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { SectionTransition } from "@/components/SectionTransition";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "MAGMA — Estudio de música contemporánea",
  description:
    "Producción musical, grabación, mezcla y mastering con una identidad propia.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body>
        {children}
        <SectionTransition />
      </body>
    </html>
  );
}
