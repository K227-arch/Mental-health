import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
      { protocol: "https", hostname: "rr8rue9y.us-east.insforge.app" },
    ],
  },
  serverExternalPackages: ["@insforge/sdk"],
};

export default nextConfig;
