import type { Metadata } from "next";
import { Geist, Geist_Mono, Fredoka, Outfit, Lilita_One, Quicksand } from "next/font/google";
import { Header } from '@/components/Header';
import "./globals.css";
import { TabBar } from "@/components/TabBar";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const lilitaOne = Lilita_One({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-lilita-one",
});

const quicksand = Quicksand({
  subsets: ["latin"],
  variable: "--font-quicksand",
})

const fredoka = Fredoka({
  subsets: ["latin"],
  variable: "--font-fredoka", // Cute/Gamified font
});

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit", // Clean/Modern UI font
});

export const metadata: Metadata = {
  title: "MRTQuest",
  description: "Discover hidden attractions along Kuala Lumpur MRT lines",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${quicksand.variable} ${geistMono.variable} ${lilitaOne.variable} ${fredoka.variable} ${outfit.variable} min-h-screen antialiased`}
    >
      <body className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 pb-24">{children}</main>
        <TabBar />
      </body>
    </html>
  );
}
