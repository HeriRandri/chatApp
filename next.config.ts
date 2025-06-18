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
};
module.exports = {
  // Output standalone pour l'optimisation
  output: "standalone",
};

module.exports = nextConfig;
