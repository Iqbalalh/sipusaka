import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */

  // Image remote pattern from S3
  images: {
    remotePatterns: process.env.NEXT_PUBLIC_S3_HOSTNAME ? [
      {
        protocol: (process.env.NEXT_PUBLIC_S3_PROTOCOL || "https").replace(/:$/, ""),
        hostname: process.env.NEXT_PUBLIC_S3_HOSTNAME,
        pathname: process.env.NEXT_PUBLIC_S3_PATHNAME || "/database/**",
      },
    ] as any : [],
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
