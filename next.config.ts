import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // Enable React 19 compiler optimizations for automatic memoization
    reactCompiler: true,
    // Enable optimizePackageImports for better tree-shaking and bundling
    optimizePackageImports: [
      '@radix-ui/react-icons',
      'lucide-react',
      '@tanstack/react-query',
      '@hookform/resolvers',
      'react-hook-form',
      'zod'
    ],
  },
  // Optimize images with modern formats
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
  // Performance optimizations
  compress: true,
  poweredByHeader: false,
  compiler: {
    // Remove console.log in production builds
    removeConsole: process.env.NODE_ENV === 'production',
  },
};

export default nextConfig;
