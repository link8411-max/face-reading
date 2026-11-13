import type { Metadata } from "next";
import AllTests from "./AllTests";
import CoupangBanner from "@/components/CoupangBanner";
import { ALL_ITEMS } from "@/content/navigation";

const url = "https://unse-ai.com/all";
const title = "전체 테스트 모음 – 운명을 읽다";
const description = "관상·동물상·삼국지 닮은꼴, 사주·신년운세·오늘의 운세, 얼굴 궁합·MBTI 궁합, 월드컵과 밈 능력고사까지 운명을 읽다의 모든 무료 테스트를 한곳에 모았어요.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: url },
  openGraph: { title, description, url, type: "website", locale: "ko_KR", siteName: "운명을 읽다", images: [{ url: `/api/og?title=${encodeURIComponent("전체 테스트")}&cast=haetae`, width: 1200, height: 630 }] },
};

// 묶음 소제목 없이 한 줄로 늘어놓는다(검색으로 거르기 쉽게)
const ITEMS = ALL_ITEMS.map((i) => ({ ...i, group: undefined }));

export default function Page() {
  return (
    <div className="max-w-lg mx-auto px-4 pt-6 pb-6">
      <h1 className="font-serif text-[28px] font-extrabold tracking-tight">전체 테스트</h1>
      <p className="text-sm text-muted leading-relaxed mt-2 mb-5">사진 한 장, 생년월일, MBTI로 보는 무료 테스트를 모두 모았어요. 글자를 쳐서 바로 찾을 수 있어요.</p>
      <AllTests items={ITEMS} />
      <CoupangBanner subId="all" />
    </div>
  );
}
