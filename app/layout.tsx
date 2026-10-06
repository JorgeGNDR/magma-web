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
  metadataBase: new URL("https://magmaestudio.com"),
  title: "MAGMA | Estudio de grabación en Puerto de Sagunto, Valencia",
  description:
    "Estudio de música en Puerto de Sagunto, Valencia. Producción musical, grabación, mezcla y mastering para dar identidad propia a tu proyecto.",
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "es_ES",
    url: "/",
    siteName: "MAGMA Estudio",
    title: "MAGMA | Estudio de grabación en Puerto de Sagunto, Valencia",
    description: "Producción musical, grabación, mezcla y mastering con identidad propia en Puerto de Sagunto, Valencia.",
  },
  twitter: {
    card: "summary",
    title: "MAGMA | Estudio de grabación en Puerto de Sagunto, Valencia",
    description: "Producción musical, grabación, mezcla y mastering con identidad propia.",
  },
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
