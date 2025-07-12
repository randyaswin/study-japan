import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
  // Enable static export for PWA
  output: 'export',
  // Disable server-side features for static export
  distDir: 'out',
  // Ensure service worker is copied
  webpack: (config, { dev, isServer }) => {
    if (!dev && !isServer) {
      // Copy service worker to output
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
      };
    }
    return config;
  },
  // Ensure proper base path for static export
  basePath: '',
  assetPrefix: '',
};

export default nextConfig;
