import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,

  // Keep the development UI focused on the app itself.
  devIndicators: false,

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
