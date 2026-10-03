/** @type {import('next').NextConfig} */
const nextConfig = {
  // Type errors MUST be caught at build time — never ignore them
  typescript: {
    ignoreBuildErrors: false,
  },
  // Strict mode for React
  reactStrictMode: true,
  // Server-only packages (not bundled for client)
  serverExternalPackages: ['firebase-admin', '@upstash/redis', 'ioredis', 'pg'],
  // Experimental features
  experimental: {},
  // Security: disable x-powered-by header (defense-in-depth with middleware)
  poweredByHeader: false,
  // Image optimization
  images: {
    formats: ['image/avif', 'image/webp'],
  },
  // Turbopack (default bundler in Next.js 16)
  turbopack: {},
};

module.exports = nextConfig;
