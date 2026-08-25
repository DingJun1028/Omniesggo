import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  serverExternalPackages: ['googleapis-common', 'googleapis', 'gaxios', '@google/genai', 'ioredis', 'pg'],
  typescript: {
    ignoreBuildErrors: true,
  },
  turbopack: {},
  // Allow access to remote image placeholder.
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "picsum.photos",
        port: "",
        pathname: "/**", // This allows any path under the hostname
      },
      {
        protocol: "https",
        hostname: "thumbs4.imagebam.com",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "api.dicebear.com",
        port: "",
        pathname: "/**",
      },
    ],
  },
  output: "standalone",
  transpilePackages: ["motion"],
  webpack: (config, { dev, isServer }) => {
    // 1. Handle HMR disabling
    if (dev && process.env.DISABLE_HMR === "true") {
      config.watchOptions = {
        ignored: /.*/,
      };
    }

    // 2. Add fallbacks for Node.js modules in client-side bundle
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        os: false,
        net: false,
        tls: false,
        child_process: false,
        http2: false,
        dns: false,
        crypto: false,
        stream: false,
        buffer: false,
      };
    }

    return config;
  },
};

export default nextConfig;
