import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: { globalNotFound: true }, // 루트 레이아웃이 (ko)·en 둘이라 없는 주소 404를 src/app/global-not-found.tsx가 그린다
  // AI 관상(/face, Gemini)은 무료 관상(/face2)으로 통합됨
  async redirects() {
    return [
      { source: "/face", destination: "/face2", permanent: true },
      // 하후돈 id는 "xiaohoudun"(오타)으로 굳어 있다. 올바른 철자로 들어온 링크(쇼츠·공유)를 넘긴다
      { source: "/samguk/people/xiahoudun", destination: "/samguk/people/xiaohoudun", permanent: true },
      { source: "/samguk/r/xiahoudun", destination: "/samguk/r/xiaohoudun", permanent: true },
      { source: "/samguk/cup/r/:board/xiahoudun", destination: "/samguk/cup/r/:board/xiaohoudun", permanent: true },
    ];
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
