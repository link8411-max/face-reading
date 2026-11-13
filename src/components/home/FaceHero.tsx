import Link from "next/link";
import { CAST } from "@/content/cast";
import TodayLabel from "@/components/home/TodayLabel";

// 메인 대표 카드: 관상(/face2)으로 바로 이어진다. 오른쪽은 관상을 맡은 해태.
export default function FaceHero() {
  const c = CAST.haetae;
  return (
    <section aria-labelledby="face-hero-title" className="press relative overflow-hidden bg-card border border-line rounded-[28px] p-[22px] min-h-[210px]">
      <div className="relative z-10 max-w-[56%]">
        <span className="inline-block text-xs font-bold bg-lime text-ink px-2.5 py-1 rounded-full">사진 테스트</span>
        <h2 id="face-hero-title" className="font-serif font-extrabold text-[23px] leading-[1.3] tracking-tight mt-3 break-keep">
          내 얼굴에는
          <br />
          어떤 기운이
          <br />
          담겨 있을까?
        </h2>
        <p className="text-xs text-muted mt-2"><TodayLabel suffix="오늘의 얼굴 운" /></p>
        <Link href="/face2" className="mt-3.5 h-11 px-5 rounded-full inline-flex items-center justify-center bg-accent text-white text-[15px] font-bold">
          시작하기<span className="sr-only"> – 내 관상 보러 가기</span>
        </Link>
        <p className="text-[11px] text-muted mt-2">사진은 저장되지 않아요</p>
      </div>
      <img
        src={c.img}
        alt={`${c.name} 캐릭터`}
        width={142}
        height={142}
        fetchPriority="high"
        className="absolute right-3.5 bottom-3.5 w-[142px] h-[142px] rounded-[34px] object-cover"
        style={{ background: c.bg }}
      />
    </section>
  );
}
