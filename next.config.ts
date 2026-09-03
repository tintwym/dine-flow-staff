import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Hide the floating Next.js Dev Tools badge during local/phone testing
  devIndicators: false,
  // Phone scans open http://192.168.x.x:3000 — allow Next dev assets over LAN
  allowedDevOrigins: ["192.168.0.6", "127.0.0.1", "localhost"],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
