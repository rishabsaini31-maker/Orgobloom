const path = require("path");

/** @type {import('next').NextConfig} */
const workspaceRoot = path.join(__dirname, "..");

const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
      {
        protocol: "http",
        hostname: "localhost",
        port: "8000",
      },
      {
        protocol: "https",
        hostname: "*.onrender.com",
      },
      {
        protocol: "https",
        hostname: "*.vercel.app",
      },
    ],
  },
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
  },
  outputFileTracingRoot: workspaceRoot,
  // Keep Turbopack root aligned with outputFileTracingRoot to avoid Vercel warning
  turbopack: {
    root: workspaceRoot,
  },
  // Increase webpack timeout for slow connections (used when running with --webpack flag)
  webpack: (config, { dev }) => {
    if (dev) {
      config.watchOptions = {
        poll: 1000,
        aggregateTimeout: 300,
      };
    }
    return config;
  },
  // Disable strict mode to prevent double rendering issues
  reactStrictMode: false,
};

module.exports = nextConfig;
