// next.config.ts
import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  images: {
    domains: [
      "lh3.googleusercontent.com",
      "firebasestorage.googleapis.com",
      "avatars.githubusercontent.com",
    ],
  },
  trailingSlash: true,
  experimental: {},
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve = config.resolve || {};
      config.resolve.alias = {
        ...config.resolve.alias,
        "@": path.resolve(__dirname),
      };
    }
    return config;
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
};

// Configuration conditionnelle basée sur la cible de déploiement
const getConfig = () => {
  if (process.env.DEPLOY_TARGET === "firebase") {
    return {
      ...nextConfig,
      output: "export" as const,
    };
  }
  return nextConfig;
};

export default getConfig();
