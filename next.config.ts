import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Compiler optimizations
  compiler: {
    removeConsole: process.env.NODE_ENV === "production",
  },

  // Image optimizations
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "api.dicebear.com",
      },
      {
        protocol: "https",
        hostname: "**.cdninstagram.com",
      },
      {
        protocol: "https",
        hostname: "**.fbcdn.net",
      },
      {
        protocol: "https",
        hostname: "abs.twimg.com",
      },
      {
        protocol: "https",
        hostname: "**.tiktokcdn.com",
      },
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
      {
        protocol: "https",
        hostname: "social-flow-media.s3.eu-north-1.amazonaws.com",
      },
    ],
    dangerouslyAllowSVG: true, // delete this after testing
    formats: ["image/webp", "image/avif"],
    minimumCacheTTL: 60,
  },

  // Headers for better caching
  async headers() {
    return [
      {
        source: "/api/auth/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=300, s-maxage=300",
          },
        ],
      },
    ];
  },

  env: {
    NEXTAUTH_URL: process.env.NEXTAUTH_URL,
  },
};

export default nextConfig;
