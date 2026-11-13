import type { Metadata } from "next";
import Link from "next/link";
import { Icon } from "@/components/icons";
import CoupangBanner from "@/components/CoupangBanner";
import { mbtiProfiles } from "@/content/mbtiTypes";
import type { MbtiType } from "@/lib/mbti/compat";
import { mbtiArt } from "@/lib/art";
import CastSay from "@/components/cast/CastSay";

export const metadata: Metadata = {
  title: "MBTI 궁합·16유형 풀이 | 운명을 읽다",
  description: "MBTI 16유형별 성격, 잘 맞는 궁합, 연애 스타일, 여행지와 직업, 이달의 운세까지. 궁합 계산기로 두 유형의 궁합 점수도 확인해 보세요.",
  alternates: { canonical: "https://unse-ai.com/mbti" },
  openGraph: { title: "MBTI 궁합·16유형 풀이 | 운명을 읽다", description: "16유형 풀이와 궁합 계산기", url: "https://unse-ai.com/mbti", type: "website", locale: "ko_KR", siteName: "운명을 읽다", images: [{ url: `/api/og?title=${encodeURIComponent("MBTI 궁합")}&cast=gumiho`, width: 1200, height: 630 }] },
};

const GROUPS: { title: string; types: MbtiType[]; color: string }[] = [
  { title: '분석가형 (NT)', types: ['INTJ', 'INTP', 'ENTJ', 'ENTP'], color: 'bg-[#1B2552]' },
  { title: '외교관형 (NF)', types: ['INFJ', 'INFP', 'ENFJ', 'ENFP'], color: 'bg-[#143A33]' },
  { title: '관리자형 (SJ)', types: ['ISTJ', 'ISFJ', 'ESTJ', 'ESFJ'], color: 'bg-[#3A3318]' },
  { title: '탐험가형 (SP)', types: ['ISTP', 'ISFP', 'ESTP', 'ESFP'], color: 'bg-[#2D2352]' },
];

export default function MbtiHub() {
  return (
    <div className="max-w-lg mx-auto px-4 py-6 space-y-6">
      <header>
        <h1 className="font-serif text-3xl font-bold">MBTI 궁합·16유형 풀이</h1>
        <p className="text-sm text-muted leading-relaxed mt-2">
          MBTI는 에너지 방향(E/I), 세상을 보는 방식(S/N), 판단 방식(T/F), 생활 방식(J/P) 네 가지 축으로 성격을 16가지로 나눠요. 내 유형을 눌러 잘 맞는 궁합과 연애 스타일, 어울리는 여행지와 직업, 이달의 운세를 확인해 보세요.
        </p>
      </header>
      <CastSay cast="gumiho" lineKey="say.mbti.hub" />
      {GROUPS.map((g) => (
        <section key={g.title}>
          <h2 className="font-bold text-base mb-2">{g.title}</h2>
          <ul className="grid grid-cols-4 gap-2 list-none">
            {g.types.map((t) => (
              <li key={t}>
                <Link href={`/mbti/${t.toLowerCase()}`} className={`${g.color} block rounded-2xl overflow-hidden text-center`}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={mbtiArt(t).face} alt={`${t} ${mbtiProfiles[t].nickname} 캐릭터`} width={240} height={240} loading="lazy" className="block w-full h-auto aspect-square object-cover" />
                  <span className="block pt-1.5 text-[13px] font-bold">{t}</span>
                  <span className="block px-1 pb-1.5 text-[11px] text-muted truncate">{mbtiProfiles[t].nickname}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ))}
      <Link href="/face-match" className="block bg-card border border-line text-ink rounded-[22px] p-5">
        <Icon name="heart" size={26} className="mb-1" />
        <span className="block font-bold text-lg">얼굴 궁합</span>
        <span className="block text-sm text-muted">두 얼굴로 보는 친구·연인·짝사랑 궁합</span>
      </Link>
      <Link href="/mbti/match" className="block bg-[#143A33] text-ink rounded-[22px] p-5">
        <Icon name="rings" size={26} className="mb-1" />
        <span className="block font-bold text-lg mt-1">MBTI 궁합 계산기</span>
        <span className="block text-sm text-muted">두 유형의 연애·친구·직장 궁합 점수 →</span>
      </Link>
      <CoupangBanner subId="mbti-hub" />
    </div>
  );
}
