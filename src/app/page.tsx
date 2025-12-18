"use client";

import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#F5E6D3] via-[#E8D4C4] to-[#F5E6D3] text-[#5C4033] relative overflow-hidden">
      {/* 민화 문양 배경 */}
      <div className="absolute inset-0 opacity-20 pointer-events-none">
        <div className="absolute top-20 left-10 w-3 h-3 bg-[#C41E3A] rounded-full" />
        <div className="absolute top-40 right-16 w-2 h-2 bg-[#1E3A5F] rounded-full" />
        <div className="absolute top-72 left-1/4 w-2.5 h-2.5 bg-[#FFD700] rounded-full" />
        <div className="absolute bottom-60 right-1/3 w-3 h-3 bg-[#C41E3A] rounded-full" />
        <div className="absolute bottom-32 left-1/3 w-2 h-2 bg-[#D4AF37] rounded-full" />
        <div className="absolute top-1/2 right-10 w-2.5 h-2.5 bg-[#1E3A5F] rounded-full" />
        {/* 추가 장식 */}
        <div className="absolute top-1/3 left-20 w-1.5 h-1.5 bg-[#FFD700] rounded-full" />
        <div className="absolute bottom-1/4 right-24 w-2 h-2 bg-[#C41E3A] rounded-full" />
      </div>

      <main className="container mx-auto px-4 py-12 max-w-lg relative z-10">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex justify-center items-center gap-2 mb-4">
            <span className="text-[#C41E3A]/70">━━</span>
            <span className="text-3xl animate-float">☯</span>
            <span className="text-[#C41E3A]/70">━━</span>
          </div>
          <h1 className="mb-3">
            <span className="block text-4xl font-bold text-[#C41E3A]" style={{ textShadow: "0 2px 8px rgba(196, 30, 58, 0.2)" }}>
              운명을 읽다
            </span>
            <span className="block text-lg text-[#5C4033]/80 mt-2">
              무료 AI 관상 & 2026 신년운세
            </span>
          </h1>
          <p className="text-[#5C4033]/60 tracking-widest text-sm">
            AI와 전통 명리학이 만나다
          </p>
          <div className="flex justify-center items-center gap-2 mt-3">
            <span className="text-[#FFD700]/80 text-xs">◆</span>
            <span className="text-[#C41E3A]/60 text-xs">━━━━━</span>
            <span className="text-[#FFD700]/80 text-xs">◆</span>
          </div>
        </div>

        {/* Menu Cards */}
        <div className="space-y-4">
          {/* 관상 테스트 */}
          <Link href="/face2" className="block">
            <div className="bg-white/60 backdrop-blur-sm rounded-3xl p-6 hover:bg-white/80 transition group border-2 border-[#C41E3A]/30 shadow-lg hover:shadow-xl">
              <div className="flex items-center gap-4">
                <div className="text-5xl">👤</div>
                <div className="flex-1">
                  <h2 className="text-xl font-bold mb-1 text-[#5C4033] group-hover:text-[#C41E3A] transition">
                    무료 관상 분석
                  </h2>
                  <p className="text-[#5C4033]/70 text-sm">
                    얼굴 사진으로 보는 초년·중년·말년운
                  </p>
                </div>
                <div className="text-[#C41E3A]/60 group-hover:text-[#C41E3A] transition text-2xl">→</div>
              </div>
              <div className="flex gap-2 mt-4">
                <span className="text-xs px-3 py-1 bg-[#C41E3A]/15 text-[#C41E3A] rounded-full border border-[#C41E3A]/30">전통 관상학</span>
                <span className="text-xs px-3 py-1 bg-[#FFD700]/15 text-[#D4AF37] rounded-full border border-[#FFD700]/40">무제한 무료</span>
                <span className="text-xs px-3 py-1 bg-[#1E3A5F]/10 text-[#1E3A5F] rounded-full border border-[#1E3A5F]/30">재물운</span>
              </div>
            </div>
          </Link>

          {/* 오늘의 운세 */}
          <Link href="/fortune/daily" className="block">
            <div className="bg-white/60 backdrop-blur-sm rounded-3xl p-6 hover:bg-white/80 transition group relative overflow-hidden border-2 border-[#FFD700]/40 shadow-lg hover:shadow-xl">
              <div className="absolute top-2 right-2 bg-gradient-to-r from-[#C41E3A] to-[#FFD700] text-white text-xs font-bold px-3 py-1 rounded-full animate-pulse-heart">
                NEW
              </div>
              <div className="flex items-center gap-4">
                <div className="text-5xl">☯</div>
                <div className="flex-1">
                  <h2 className="text-xl font-bold mb-1 text-[#5C4033] group-hover:text-[#C41E3A] transition">
                    오늘의 운세
                  </h2>
                  <p className="text-[#5C4033]/70 text-sm">
                    띠별로 보는 오늘 하루 운세
                  </p>
                </div>
                <div className="text-[#C41E3A]/60 group-hover:text-[#C41E3A] transition text-2xl">→</div>
              </div>
              <div className="flex gap-2 mt-4">
                <span className="text-xs px-3 py-1 bg-[#C41E3A]/15 text-[#C41E3A] rounded-full border border-[#C41E3A]/30">매일 업데이트</span>
                <span className="text-xs px-3 py-1 bg-[#FFD700]/15 text-[#D4AF37] rounded-full border border-[#FFD700]/40">행운시간</span>
                <span className="text-xs px-3 py-1 bg-[#FFD700]/15 text-[#D4AF37] rounded-full border border-[#FFD700]/40">행운색</span>
              </div>
            </div>
          </Link>

          {/* 신년 운세 */}
          <Link href="/fortune" className="block">
            <div className="bg-white/60 backdrop-blur-sm rounded-3xl p-6 hover:bg-white/80 transition group relative overflow-hidden border-2 border-[#C41E3A]/30 shadow-lg hover:shadow-xl">
              <div className="absolute top-2 right-2 bg-gradient-to-r from-[#FFD700] to-[#D4AF37] text-[#5C4033] text-xs font-bold px-3 py-1 rounded-full">
                2026 🐎
              </div>
              <div className="flex items-center gap-4">
                <div className="text-5xl">🔮</div>
                <div className="flex-1">
                  <h2 className="text-xl font-bold mb-1 text-[#5C4033] group-hover:text-[#C41E3A] transition">
                    2026 신년 운세
                  </h2>
                  <p className="text-[#5C4033]/70 text-sm">
                    사주팔자로 보는 병오년 운세
                  </p>
                </div>
                <div className="text-[#C41E3A]/60 group-hover:text-[#C41E3A] transition text-2xl">→</div>
              </div>
              <div className="flex gap-2 mt-4">
                <span className="text-xs px-3 py-1 bg-[#FFD700]/15 text-[#D4AF37] rounded-full border border-[#FFD700]/40">사주팔자</span>
                <span className="text-xs px-3 py-1 bg-[#C41E3A]/15 text-[#C41E3A] rounded-full border border-[#C41E3A]/30">천간지지</span>
                <span className="text-xs px-3 py-1 bg-[#1E3A5F]/10 text-[#1E3A5F] rounded-full border border-[#1E3A5F]/30">오행분석</span>
              </div>
            </div>
          </Link>
        </div>

        {/* 마당놀이 섹션 */}
        <div className="mt-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-[#C41E3A]/30 to-transparent"></div>
            <h2 className="text-lg font-bold text-[#5C4033] flex items-center gap-2">
              <span>🎭</span> 마당놀이
            </h2>
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-[#C41E3A]/30 to-transparent"></div>
          </div>
          <p className="text-center text-[#5C4033]/60 text-sm mb-4">재미로 즐기는 이색 테스트</p>

          <div className="space-y-3">
            {/* 동물상 테스트 */}
            <Link href="/animal" className="block">
              <div className="bg-white/50 backdrop-blur-sm rounded-2xl p-5 hover:bg-white/70 transition group border border-[#FFD700]/30 shadow-md hover:shadow-lg relative overflow-hidden">
                <div className="absolute top-2 right-2 bg-gradient-to-r from-[#C41E3A] to-[#FFD700] text-white text-xs font-bold px-2 py-0.5 rounded-full animate-pulse-heart">
                  NEW
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-4xl">🦊</div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-[#5C4033] group-hover:text-[#C41E3A] transition">
                      동물상 테스트
                    </h3>
                    <p className="text-[#5C4033]/60 text-xs">
                      나는 어떤 동물을 닮았을까?
                    </p>
                  </div>
                  <div className="flex gap-1">
                    <span className="text-lg">🐶</span>
                    <span className="text-lg">🐱</span>
                    <span className="text-lg">🐰</span>
                  </div>
                  <div className="text-[#C41E3A]/40 group-hover:text-[#C41E3A] transition text-xl">→</div>
                </div>
              </div>
            </Link>

            {/* 삼국지 닮은꼴 */}
            <Link href="/samguk" className="block">
              <div className="bg-white/50 backdrop-blur-sm rounded-2xl p-5 hover:bg-white/70 transition group border border-[#1E3A5F]/20 shadow-md hover:shadow-lg">
                <div className="flex items-center gap-4">
                  <div className="text-4xl">⚔️</div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-[#5C4033] group-hover:text-[#C41E3A] transition">
                      삼국지 닮은꼴
                    </h3>
                    <p className="text-[#5C4033]/60 text-xs">
                      나는 어떤 삼국지 영웅일까?
                    </p>
                  </div>
                  <div className="flex gap-1">
                    <span className="text-xs px-2 py-0.5 bg-[#1E3A5F]/15 text-[#1E3A5F] rounded-full">위</span>
                    <span className="text-xs px-2 py-0.5 bg-green-700/15 text-green-700 rounded-full">촉</span>
                    <span className="text-xs px-2 py-0.5 bg-[#C41E3A]/15 text-[#C41E3A] rounded-full">오</span>
                  </div>
                  <div className="text-[#C41E3A]/40 group-hover:text-[#C41E3A] transition text-xl">→</div>
                </div>
              </div>
            </Link>
          </div>
        </div>

        {/* Info Section */}
        <div className="mt-12 bg-white/50 backdrop-blur-sm rounded-3xl p-6 border-2 border-[#FFD700]/30 shadow-md">
          <h3 className="font-bold mb-3 text-center text-[#C41E3A]">☯ 특징</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="text-center">
              <div className="text-2xl mb-1">📜</div>
              <p className="text-[#5C4033]/80">전통 명리학 기반</p>
            </div>
            <div className="text-center">
              <div className="text-2xl mb-1">🤖</div>
              <p className="text-[#5C4033]/80">AI 정밀 분석</p>
            </div>
            <div className="text-center">
              <div className="text-2xl mb-1">🎯</div>
              <p className="text-[#5C4033]/80">체계적인 운세</p>
            </div>
            <div className="text-center">
              <div className="text-2xl mb-1">📱</div>
              <p className="text-[#5C4033]/80">공유하기 쉬움</p>
            </div>
          </div>
        </div>

        {/* Coupang Partners Banner */}
        <div className="mt-8">
          <p className="text-center text-xs text-[#5C4033]/60 mb-2">추천 상품</p>
          <div className="flex justify-center">
            <iframe
              src="https://ads-partners.coupang.com/widgets.html?id=950676&template=carousel&trackingCode=AF6497036&subId=&width=450&height=130&tsource="
              width="450"
              height="130"
              frameBorder="0"
              scrolling="no"
              referrerPolicy="unsafe-url"
              className="rounded-2xl max-w-full"
            />
          </div>
          <p className="text-center text-[#5C4033]/50 text-[10px] mt-2">
            쿠팡 파트너스 활동의 일환으로 일정액의 수수료를 제공받습니다
          </p>
        </div>

        {/* FAQ Section */}
        <div className="mt-12 bg-white/50 backdrop-blur-sm rounded-3xl p-6 border-2 border-[#C41E3A]/20 shadow-md">
          <h2 className="font-bold mb-4 text-center text-[#C41E3A] text-lg">자주 묻는 질문</h2>
          <div className="space-y-4 text-sm">
            <details className="group">
              <summary className="cursor-pointer text-[#5C4033] hover:text-[#C41E3A] transition list-none flex items-center gap-2 font-medium">
                <span className="text-[#FFD700] group-open:rotate-90 transition-transform">▶</span>
                관상이란 무엇인가요?
              </summary>
              <p className="mt-2 text-[#5C4033]/80 pl-5 leading-relaxed">
                관상(觀相)은 사람의 얼굴 생김새를 보고 성격, 운명, 건강 등을 판단하는 동양의 전통 학문입니다.
                눈, 코, 입, 이마, 턱 등 각 부위의 특징을 분석하여 초년운, 중년운, 말년운을 예측합니다.
              </p>
            </details>
            <details className="group">
              <summary className="cursor-pointer text-[#5C4033] hover:text-[#C41E3A] transition list-none flex items-center gap-2 font-medium">
                <span className="text-[#FFD700] group-open:rotate-90 transition-transform">▶</span>
                AI가 어떻게 얼굴을 분석하나요?
              </summary>
              <p className="mt-2 text-[#5C4033]/80 pl-5 leading-relaxed">
                최신 AI 기술(Google Gemini)을 활용하여 업로드된 얼굴 사진의 이목구비를 분석합니다.
                전통 관상학의 기준을 바탕으로 각 부위의 특징을 파악하고, 종합적인 관상 해석을 제공합니다.
              </p>
            </details>
            <details className="group">
              <summary className="cursor-pointer text-[#5C4033] hover:text-[#C41E3A] transition list-none flex items-center gap-2 font-medium">
                <span className="text-[#FFD700] group-open:rotate-90 transition-transform">▶</span>
                2026년 병오년 운세는 어떻게 보나요?
              </summary>
              <p className="mt-2 text-[#5C4033]/80 pl-5 leading-relaxed">
                음력 생년월일시를 입력하면 사주팔자와 천간지지를 분석하여 2026년 병오년(丙午年) 운세를 확인할 수 있습니다.
                총운, 재물운, 직장운, 건강운, 애정운을 상세하게 알려드립니다.
              </p>
            </details>
            <details className="group">
              <summary className="cursor-pointer text-[#5C4033] hover:text-[#C41E3A] transition list-none flex items-center gap-2 font-medium">
                <span className="text-[#FFD700] group-open:rotate-90 transition-transform">▶</span>
                AI 관상과 무료 관상의 차이는?
              </summary>
              <p className="mt-2 text-[#5C4033]/80 pl-5 leading-relaxed">
                무료 관상은 얼굴 인식 라이브러리로 즉시 분석하여 빠른 결과를 제공하며 무제한 이용 가능합니다.
                AI 관상은 Google Gemini AI가 더 정밀하게 분석하여 개인화된 결과를 제공하며 하루 1회 무료입니다.
              </p>
            </details>
            <details className="group">
              <summary className="cursor-pointer text-[#5C4033] hover:text-[#C41E3A] transition list-none flex items-center gap-2 font-medium">
                <span className="text-[#FFD700] group-open:rotate-90 transition-transform">▶</span>
                무료인가요?
              </summary>
              <p className="mt-2 text-[#5C4033]/80 pl-5 leading-relaxed">
                네, 모든 서비스는 무료입니다. 무료 관상 분석은 무제한, AI 관상 분석은 하루 1회 무료로 이용하실 수 있습니다.
              </p>
            </details>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-[#5C4033]/50 text-xs mt-6">
          ⚠️ 재미로만 봐주세요! 과학적 근거는 없습니다.
        </p>
      </main>
    </div>
  );
}
