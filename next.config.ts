import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // AI 관상(/face, Gemini)은 무료 관상(/face2)으로 통합됨
  async redirects() {
    return [{ source: "/face", destination: "/face2", permanent: true }];
  },
  images: {
    dangerouslyAllowSVG: true,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },
};

export default nextConfig;
