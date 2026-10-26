import type { Metadata } from "next";
import Link from "next/link";
import { mbtiProfiles } from "@/content/mbtiTypes";
import type { MbtiType } from "@/lib/mbti/compat";

export const metadata: Metadata = {
  title: "MBTI 궁합·16유형 풀이 | 운명을 읽다",
  description: "MBTI 16유형별 성격, 잘 맞는 궁합, 연애 스타일, 여행지와 직업, 이달의 운세까지. 궁합 계산기로 두 유형의 궁합 점수도 확인해 보세요.",
  alternates: { canonical: "https://unse-ai.com/mbti" },
  openGraph: { title: "MBTI 궁합·16유형 풀이 | 운명을 읽다", description: "16유형 풀이와 궁합 계산기", url: "https://unse-ai.com/mbti", type: "website", locale: "ko_KR", siteName: "운명을 읽다" },
};

const GROUPS: { title: string; types: MbtiType[]; color: string }[] = [
  { title: '분석가형 (NT)', types: ['INTJ', 'INTP', 'ENTJ', 'ENTP'], color: 'bg-[#EDE6F7]' },
  { title: '외교관형 (NF)', types: ['INFJ', 'INFP', 'ENFJ', 'ENFP'], color: 'bg-[#E3F2E8]' },
  { title: '관리자형 (SJ)', types: ['ISTJ', 'ISFJ', 'ESTJ', 'ESFJ'], color: 'bg-[#E7EDF6]' },
  { title: '탐험가형 (SP)', types: ['ISTP', 'ISFP', 'ESTP', 'ESFP'], color: 'bg-[#FBF1D3]' },
];

export default function MbtiHub() {
  return (
    <div className="max-w-lg mx-auto px-4 py-6 space-y-6">
      <header>
        <h1 className="font-serif text-3xl font-bold text-vermilion">MBTI 궁합·16유형 풀이</h1>
        <p className="text-sm text-muted leading-relaxed mt-2">
          MBTI는 에너지 방향(E/I), 세상을 보는 방식(S/N), 판단 방식(T/F), 생활 방식(J/P) 네 가지 축으로 성격을 16가지로 나눠요. 내 유형을 눌러 잘 맞는 궁합과 연애 스타일, 어울리는 여행지와 직업, 이달의 운세를 확인해 보세요.
        </p>
      </header>
      <Link href="/mbti/match" className="block bg-gradient-to-br from-[#6B3FA0] to-[#9466C9] text-white rounded-3xl p-5">
        <span className="block text-2xl" aria-hidden>💞</span>
        <span className="block font-bold text-lg mt-1">MBTI 궁합 계산기</span>
        <span className="block text-sm opacity-85">두 유형의 연애·친구·직장 궁합 점수 →</span>
      </Link>
      {GROUPS.map((g) => (
        <section key={g.title}>
          <h2 className="font-bold text-base mb-2">{g.title}</h2>
          <div className="grid grid-cols-2 gap-2">
            {g.types.map((t) => (
              <Link key={t} href={`/mbti/${t.toLowerCase()}`} className={`${g.color} rounded-2xl p-3`}>
                <span className="block font-bold text-lg">{t}</span>
                <span className="block text-xs text-muted">{mbtiProfiles[t].nickname}</span>
              </Link>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
