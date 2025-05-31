import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  // Configuration simplifiée pour éviter les problèmes de démarrage
  reactStrictMode: false,
  compress: true,
  poweredByHeader: false,
};

export default nextConfig;
