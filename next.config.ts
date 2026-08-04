import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,

  // Compiler optimizations
  compiler: {
    // Remove console logs in production
    removeConsole:
      process.env.NODE_ENV === "production"
        ? {
            exclude: ["error", "warn"],
          }
        : false,
  },

  // Enable React features
  reactStrictMode: true,
};

export default nextConfig;
