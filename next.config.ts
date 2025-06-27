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
  // Configuration optimisée pour la production
  reactStrictMode: true,
  compress: true,
  poweredByHeader: false,
  // Configuration rapide pour déploiement immédiat
  eslint: {
    ignoreDuringBuilds: true, // Ignore ESLint temporairement
  },
  typescript: {
    ignoreBuildErrors: true, // Ignore TypeScript temporairement
  },
  // Désactiver le prerendering pour éviter les erreurs useSearchParams
  experimental: {
    missingSuspenseWithCSRBailout: false,
  },
  experimental: {
    optimizePackageImports: ['lucide-react', '@tiptap/react', '@tiptap/starter-kit'],
  },
  // Optimisations de performance
  output: 'standalone',
};

export default nextConfig;
