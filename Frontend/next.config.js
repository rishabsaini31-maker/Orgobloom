const path = require("path");

/** @type {import('next').NextConfig} */
const workspaceRoot = path.join(__dirname, "..");

const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.supabase.co",
      },
      {
        protocol: "https",
        hostname: "supabase.co",
      },
      {
        protocol: "https",
        hostname: "*.onrender.com",
      },
      {
        protocol: "https",
        hostname: "**.vercel.app",
      },
      {
        protocol: "http",
        hostname: "localhost",
        port: "8000",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
    ],
    // Optimize image loading
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 60 * 60 * 24 * 30, // 30 days cache
  },
  outputFileTracingRoot: workspaceRoot,
  // Keep Turbopack root aligned with outputFileTracingRoot to avoid Vercel warning
  turbopack: {
    root: workspaceRoot,
  },
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
    NEXT_PUBLIC_RAZORPAY_KEY_ID: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
  },
  // Enable experimental features for better performance
  experimental: {
    optimizePackageImports: [
      "@tanstack/react-query",
      "react-hot-toast",
      "lucide-react",
    ],
  },
};

module.exports = nextConfig;
