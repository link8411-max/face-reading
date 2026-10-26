// 사이트 공통 선 아이콘 (이모지 대체). 선 굵기 1.6, 색은 글자색(currentColor)을 따른다.
// 모양은 디자인 캔버스 시안(Main/TestStart/ResultCard) 기준.
import type { ReactNode } from "react";

export const ICON_NAMES = [
  "home", "face", "moon", "rings", "cat", "fan", "heart", "shield",
  "back", "spark", "story", "download", "refresh", "chevron", "users", "sun",
] as const;
export type IconName = (typeof ICON_NAMES)[number];

const PATHS: Record<IconName, ReactNode> = {
  home: <path d="M4 11l8-7 8 7v8a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1z" />,
  face: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M9 10.5h.01M15 10.5h.01M9 14.5c1.6 1.6 4.4 1.6 6 0" />
    </>
  ),
  moon: <path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z" />,
  rings: (
    <>
      <circle cx="9" cy="12" r="5.5" />
      <circle cx="15" cy="12" r="5.5" />
    </>
  ),
  cat: (
    <>
      <path d="M5 9V4l4 3h6l4-3v5a7 7 0 0 1-14 0z" />
      <path d="M9.5 12h.01M14.5 12h.01M11 15h2" />
    </>
  ),
  fan: (
    <>
      <path d="M12 20L4 9a10 10 0 0 1 16 0z" />
      <path d="M12 20V6M12 20L8 7.2M12 20l4-12.8" />
    </>
  ),
  heart: (
    <>
      <path d="M8.5 19.5c-4-3-6-5.6-6-8.5a3.8 3.8 0 0 1 6.8-2.3A3.8 3.8 0 0 1 15 11c0 2.9-2.5 5.5-6.5 8.5z" />
      <path d="M15.2 6.6a3.4 3.4 0 0 1 6.3 2.1c0 2.3-1.6 4.4-4.5 6.6" />
    </>
  ),
  shield: (
    <>
      <path d="M12 3l7 3v5c0 4.5-3 8-7 10-4-2-7-5.5-7-10V6z" />
      <path d="M9 12l2 2 4-4" />
    </>
  ),
  back: <path d="M15 6l-6 6 6 6" />,
  spark: <path d="M12 4l1.8 4.6L18.5 10l-4.7 1.6L12 16l-1.8-4.4L5.5 10l4.7-1.4z" />,
  story: (
    <>
      <rect x="3.5" y="3.5" width="17" height="17" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <path d="M17 7h.01" />
    </>
  ),
  download: <path d="M12 4v11M7.5 10.5L12 15l4.5-4.5M5 19.5h14" />,
  refresh: <path d="M19.5 12a7.5 7.5 0 1 1-2.2-5.3M19.5 4.5v4h-4" />,
  chevron: <path d="M9 6l6 6-6 6" />,
  sun: (
    <>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6l1.4 1.4M17 17l1.4 1.4M5.6 18.4L7 17M17 7l1.4-1.4" />
    </>
  ),
  users: (
    <>
      <circle cx="9" cy="9" r="3.5" />
      <path d="M3 19.5c.8-3.2 3.2-5 6-5s5.2 1.8 6 5" />
      <path d="M15.5 5.8a3.5 3.5 0 0 1 0 6.4M17.5 14.8c1.8.6 3 2.2 3.5 4.7" />
    </>
  ),
};

export function Icon({ name, size = 22, className }: { name: IconName; size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      {PATHS[name]}
    </svg>
  );
}

// 웃는 얼굴 그림 (테스트 시작·결과 카드). 핑크는 볼 홍조에만 쓴다.
export function SmileFace({ size = 120 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 120 120" fill="none" strokeLinecap="round" aria-hidden="true">
      <circle cx="60" cy="60" r="50" fill="#FBF6F1" />
      <path d="M44 54c2-3 6-3 8 0M68 54c2-3 6-3 8 0" stroke="#2E2A27" strokeWidth="2.4" />
      <path d="M48 74c7 7 17 7 24 0" stroke="#2E2A27" strokeWidth="2.4" />
      <circle cx="40" cy="68" r="6" fill="#E9BCA8" />
      <circle cx="80" cy="68" r="6" fill="#E9BCA8" />
    </svg>
  );
}

// 초승달·별 장식 (히어로·결과 카드 오른쪽 위). 바탕색 위에 겹쳐 그린다.
export function MoonDeco({ bg = "#ECE5D9", size = 150 }: { bg?: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 150 150" fill="none" aria-hidden="true">
      <circle cx="88" cy="62" r="44" fill="#FBF6F1" />
      <circle cx="108" cy="50" r="40" fill={bg} />
      <path d="M30 30l3 7 7 3-7 3-3 7-3-7-7-3 7-3z" fill="#9A4F35" />
      <circle cx="132" cy="118" r="3" fill="#9A4F35" />
      <circle cx="52" cy="112" r="2" fill="#2E2A27" />
    </svg>
  );
}
