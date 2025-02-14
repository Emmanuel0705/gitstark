import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  images: {
    remotePatterns: [
      {
        hostname: "images.unsplash.com",
      },
      {
        hostname: "plus.unsplash.com",
      },
      {
        hostname: "originui.com",
      },
      {
        hostname: "starknet.id",
      },
    ],
  },
};

export default nextConfig;
