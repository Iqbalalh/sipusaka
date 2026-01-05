import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */

  // Image remote pattern from S3
  images: {
    remotePatterns: [
      {
        protocol: process.env.NEXT_PUBLIC_S3_PROTOCOL || "https",
        // @ts-expect-error cause it was misbahaving
        hostname: process.env.NEXT_PUBLIC_S3_HOSTNAME,
        port: "",
        pathname: process.env.NEXT_PUBLIC_S3_PATHNAME || "/database/**",
      },
    ],
    unoptimized: true,
  },
  
  webpack(config) {
    config.module.rules.push({
      test: /\.svg$/,
      use: ["@svgr/webpack"],
    });
    return config;
  },

  turbopack: {
    rules: {
      "*.svg": {
        loaders: ["@svgr/webpack"],
        as: "*.js",
      },
    },
  },
};

export default nextConfig;
