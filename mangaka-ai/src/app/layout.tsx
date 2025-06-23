import type { Metadata } from "next";
import { Geist, Geist_Mono, Bangers } from "next/font/google";
import ClientToaster from "../components/ClientToaster";
import "./globals.css";
import "../styles/globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: 'swap',
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: 'swap',
});

const bangers = Bangers({
  variable: "--font-bangers",
  subsets: ["latin"],
  weight: "400",
  display: 'swap',
});

export const metadata: Metadata = {
  title: "MANGAKA AI - Créez des manga sans savoir dessiner",
  description: "L'IA qui transforme vos idées en histoires manga professionnelles. Générez personnages, décors et scènes en quelques clics.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${bangers.variable} antialiased`}
        suppressHydrationWarning
      >
        {children}
        <ClientToaster />
      </body>
    </html>
  );
}
