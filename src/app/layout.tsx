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
  title: {
    default: "MANGAKA AI - Create manga without knowing how to draw",
    template: "%s | MANGAKA AI"
  },
  description: "The AI that transforms your ideas into professional manga stories. Generate characters, backgrounds and scenes with just a few clicks.",
  keywords: ["manga", "AI", "artificial intelligence", "manga creator", "manga generator", "comic", "anime", "drawing", "art", "creative"],
  authors: [{ name: "MANGAKA AI Team" }],
  creator: "MANGAKA AI",
  publisher: "MANGAKA AI",
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: '16x16', type: 'image/x-icon' },
      { url: '/favicon.svg', type: 'image/svg+xml' }
    ],
    apple: [
      { url: '/favicon.svg', sizes: '180x180', type: 'image/svg+xml' }
    ]
  },
  manifest: '/manifest.json',
  themeColor: '#DC2626',
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    type: 'website',
    locale: 'fr_FR',
    url: 'https://ai-manga-generator.com',
    siteName: 'MANGAKA AI',
    title: 'MANGAKA AI - Create manga without knowing how to draw',
    description: 'The AI that transforms your ideas into professional manga stories. Generate characters, backgrounds and scenes with just a few clicks.',
    images: [
      {
        url: 'https://ai-manga-generator.com/og-image.svg',
        width: 1200,
        height: 630,
        alt: 'MANGAKA AI - Manga Creation Platform',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'MANGAKA AI - Create manga without knowing how to draw',
    description: 'The AI that transforms your ideas into professional manga stories. Generate characters, backgrounds and scenes with just a few clicks.',
    images: ['https://ai-manga-generator.com/og-image.svg'],
    creator: '@mangaka_ai',
  },
  verification: {
    google: 'your-google-verification-code',
  },
  alternates: {
    canonical: 'https://ai-manga-generator.com',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'MANGAKA AI',
    description: 'The AI that transforms your ideas into professional manga stories. Generate characters, backgrounds and scenes with just a few clicks.',
    url: 'https://ai-manga-generator.com',
    applicationCategory: 'DesignApplication',
    operatingSystem: 'Web',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'EUR',
      description: 'Free tier available with premium options'
    },
    creator: {
      '@type': 'Organization',
      name: 'MANGAKA AI Team'
    },
    featureList: [
      'AI Image Generation',
      'Manga Character Creation',
      'Scene Creator',
      'Page Editor',
      'Script Editor'
    ]
  }

  return (
    <html lang="fr" suppressHydrationWarning>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
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
