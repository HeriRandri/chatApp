// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig: import("next").NextConfig = {
  images: {
    domains: [
      "lh3.googleusercontent.com",
      "firebasestorage.googleapis.com",
      "avatars.githubusercontent.com",
    ],
  },
  // Choisissez l'une des deux options ci-dessous selon votre cible de déploiement :
  // output: 'standalone', // Pour Docker/Cloud Run
  output: "export", // Pour Firebase Hosting (statique)
};

module.exports = {
  output: "export", // Obligatoire pour next export
  trailingSlash: true, // Recommandé pour Firebase
};
// next.config.js
module.exports = {
  output: "export",
  experimental: {
    optimizeFonts: false, // Désactive l'optimisation des polices
  },
};
import path from "path";

interface WebpackConfig {
  resolve: {
    alias: Record<string, string>;
  };
}

interface ModuleExports {
  webpack: (config: WebpackConfig) => WebpackConfig;
}

const moduleExports: ModuleExports = {
  webpack: (config: WebpackConfig): WebpackConfig => {
    config.resolve.alias = {
      ...config.resolve.alias,
      "@": path.resolve(__dirname),
    };
    return config;
  },
};
module.exports = moduleExports;
module.exports = nextConfig;
