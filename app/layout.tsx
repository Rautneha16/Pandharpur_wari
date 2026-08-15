import type { Metadata } from "next";
import { Noto_Serif_Devanagari, Noto_Sans_Devanagari } from "next/font/google";
import "./globals.css";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";

const notoSerifDevanagari = Noto_Serif_Devanagari({
  variable: "--font-noto-serif",
  subsets: ["devanagari", "latin"],
  weight: ["400", "700", "800"],
});

const notoSansDevanagari = Noto_Sans_Devanagari({
  variable: "--font-noto-sans",
  subsets: ["devanagari", "latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Pandharpur Wari — वारी • अभंग • भक्ती",
  description: "An immersive digital Pandharpur Wari devotional music experience.",
  icons: {
    icon: "/images/logo.png",
  },
};

export const viewport = {
  viewportFit: "cover",
  width: "device-width",
  initialScale: 1,
};

interface LayoutProps {
  children: React.ReactNode;
}

export default function RootLayout({ children }: LayoutProps) {
  return (
    <html
      lang="en"
      className={`${notoSerifDevanagari.variable} ${notoSansDevanagari.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {children}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
