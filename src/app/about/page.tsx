import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
    title: "서비스 소개 | 운명을 읽다",
    description: "AI와 전통 명리학의 만남, 운명을 읽다 서비스를 소개합니다.",
};

export default function AboutPage() {
    return (
        <div className="max-w-2xl mx-auto px-4 py-12 text-stone-800 leading-relaxed">
            <div className="text-center mb-12">
                <span className="text-4xl mb-4 block">☯️</span>
                <h1 className="text-3xl font-bold text-[#C41E3A]">운명을 읽다</h1>
                <p className="text-stone-500 mt-2 italic">AI와 전통 명리학의 조화로운 조우</p>
            </div>

            <section className="mb-10">
                <h2 className="text-2xl font-bold mb-4 border-b-2 border-stone-100 pb-2">서비스 가치</h2>
                <p>
                    '운명을 읽다'는 고대의 지혜인 명리학과 관상학을 현대의 인공지능 기술로 재해석하여,
                    누구나 쉽고 재미있게 자신의 운명을 탐구할 수 있도록 돕는 서비스입니다.
                </p>
            </section>

            <section className="mb-10">
                <h2 className="text-2xl font-bold mb-4 border-b-2 border-stone-100 pb-2">제공 서비스</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 bg-stone-50 rounded-lg">
                        <h3 className="font-bold text-[#C41E3A] mb-2">🔮 AI 정밀 관상</h3>
                        <p className="text-sm">Google Gemini AI가 분석하는 정교한 얼굴 분석 리포트</p>
                    </div>
                    <div className="p-4 bg-stone-50 rounded-lg">
                        <h3 className="font-bold text-[#C41E3A] mb-2">🐎 2026 신년운세</h3>
                        <p className="text-sm">사주팔자 기반의 병오년 토정비결 전문 분석</p>
                    </div>
                    <div className="p-4 bg-stone-50 rounded-lg">
                        <h3 className="font-bold text-[#C41E3A] mb-2">✨ 매일의 행운</h3>
                        <p className="text-sm">띠별 오늘의 운세와 행운의 컬러/시간 처방</p>
                    </div>
                    <div className="p-4 bg-stone-50 rounded-lg">
                        <h3 className="font-bold text-[#C41E3A] mb-2">🎭 이색 테스트</h3>
                        <p className="text-sm">삼국지 닮은꼴, 동물상 테스트 등 즐거운 콘텐츠</p>
                    </div>
                </div>
            </section>

            <section className="mb-10">
                <h2 className="text-2xl font-bold mb-4 border-b-2 border-stone-100 pb-2">준수 사항</h2>
                <p className="text-sm text-stone-600">
                    본 서비스의 모든 결과는 인공지능의 분석과 전통 문헌을 기반으로 하며, 과학적 근거보다는 삶의 통찰과 재미를 위한 가이드로 제공됩니다.
                    사용자의 개인정보는 분석 즉시 파기되며 절대 다른 용도로 사용하지 않습니다.
                </p>
            </section>

            <div className="text-center mt-12">
                <Link href="/" className="px-6 py-2 bg-[#C41E3A] text-white rounded-full hover:bg-[#A01830] transition-colors">
                    메인으로 돌아가기
                </Link>
            </div>
        </div>
    );
}
