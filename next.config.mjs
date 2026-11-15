/** @type {import('next').NextConfig} */
// 由 next.config.ts 等價轉寫（ESM .mjs）—— vinext module runner 載入 TS 設定檔
// 於 Windows 上逾時 60s（fetchModule /next.config.ts 掛死），改用 .mjs 繞過。
// 內容與 next.config.ts 完全一致（僅移除型別標註）。
// 2026-10-27 De-Google：@google/genai 別名至 src/lib/genai（Ollama 墊片）。
import path from 'node:path';

const nextConfig = {
  reactStrictMode: true,
  serverExternalPackages: ['googleapis-common', 'googleapis', 'gaxios', 'ioredis', 'pg'],
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
        pathname: "/**", // This allows any path under the hostname.
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
    // 0. De-Google：@google/genai 一律解析至本地 Ollama 墊片（不連 Google）
    config.resolve.alias = {
      ...config.resolve.alias,
      '@google/genai': path.resolve('./src/lib/genai'),
    };

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
