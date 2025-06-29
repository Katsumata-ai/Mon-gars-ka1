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
      { url: '/favicon.ico', sizes: '16x16 32x32', type: 'image/x-icon' },
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon.svg', type: 'image/svg+xml' }
    ],
    apple: [
      { url: '/apple-touch-icon-180x180.png', sizes: '180x180', type: 'image/png' },
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }
    ],
    other: [
      { rel: 'mask-icon', url: '/favicon.svg', color: '#DC2626' }
    ]
  },
  manifest: '/manifest.json',
  themeColor: '#DC2626',
  colorScheme: 'dark',
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
    locale: 'en_US',
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
        type: 'image/svg+xml',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    site: '@mangaka_ai',
    creator: '@mangaka_ai',
    title: 'MANGAKA AI - Create manga without knowing how to draw',
    description: 'The AI that transforms your ideas into professional manga stories. Generate characters, backgrounds and scenes with just a few clicks.',
    images: {
      url: 'https://ai-manga-generator.com/og-image.svg',
      alt: 'MANGAKA AI - Manga Creation Platform',
      width: 1200,
      height: 630,
    },
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
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Additional meta tags for better compatibility */}
        <meta name="theme-color" content="#DC2626" />
        <meta name="msapplication-TileColor" content="#DC2626" />
        <meta name="msapplication-config" content="/browserconfig.xml" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="MANGAKA AI" />
        <meta name="format-detection" content="telephone=no" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="application-name" content="MANGAKA AI" />

        {/* Structured data */}
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
