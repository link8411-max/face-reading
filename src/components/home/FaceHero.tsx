import Link from "next/link";
import { MoonDeco } from "@/components/icons";
import TodayLabel from "@/components/home/TodayLabel";

// 메인 히어로: 얼굴 테스트로 바로 이어지는 카드 하나 (디자인 시안 Main)
export default function FaceHero() {
  return (
    <section aria-labelledby="face-hero-title" className="relative overflow-hidden bg-card rounded-[28px] px-6 pt-7 pb-6 flex flex-col">
      <span className="absolute -right-3.5 -top-2.5 pointer-events-none">
        <MoonDeco />
      </span>
      <p className="relative text-xs font-medium text-accent">
        <TodayLabel suffix="오늘의 얼굴 운" />
      </p>
      <h2 id="face-hero-title" className="relative font-serif font-bold text-[28px] leading-[1.4] mt-2.5 max-w-[230px] break-keep">
        내 얼굴에는
        <br />
        어떤 기운이
        <br />
        담겨 있을까?
      </h2>
      <p className="relative text-sm leading-relaxed text-muted mt-3">사진 한 장으로 보는 관상과 동물상</p>
      <Link href="/face2" className="relative mt-[22px] h-[52px] rounded-full flex items-center justify-center bg-ink text-paper text-[15px] font-medium">
        내 얼굴 보러 가기
      </Link>
      <p className="relative mt-2.5 text-xs text-muted text-center">사진은 저장되지 않아요</p>
    </section>
  );
}
