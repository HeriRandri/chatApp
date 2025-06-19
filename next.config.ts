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

// next.config.js
module.exports = {
  experimental: {
    fontLoaders: [{ loader: "@next/font/google", options: { timeout: 30000 } }],
  },
};
module.exports = nextConfig;
