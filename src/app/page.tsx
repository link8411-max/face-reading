"use client";

import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-indigo-900 to-black text-white">
      <main className="container mx-auto px-4 py-12 max-w-lg">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-3 bg-gradient-to-r from-pink-400 via-purple-400 to-yellow-400 bg-clip-text text-transparent">
            운명을 읽다
          </h1>
          <p className="text-gray-300">
            AI와 전통 명리학이 만나다
          </p>
        </div>

        {/* Menu Cards */}
        <div className="space-y-4">
          {/* 관상 테스트 */}
          <Link href="/face" className="block">
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 hover:bg-white/15 transition group">
              <div className="flex items-center gap-4">
                <div className="text-5xl">👤</div>
                <div className="flex-1">
                  <h2 className="text-xl font-bold mb-1 group-hover:text-pink-400 transition">
                    AI 관상 분석
                  </h2>
                  <p className="text-gray-400 text-sm">
                    얼굴 사진으로 보는 초년·중년·말년운
                  </p>
                </div>
                <div className="text-gray-500 group-hover:text-white transition">→</div>
              </div>
              <div className="flex gap-2 mt-4">
                <span className="text-xs px-2 py-1 bg-pink-500/20 text-pink-300 rounded-full">전통 관상학</span>
                <span className="text-xs px-2 py-1 bg-purple-500/20 text-purple-300 rounded-full">AI 분석</span>
                <span className="text-xs px-2 py-1 bg-blue-500/20 text-blue-300 rounded-full">재물운</span>
              </div>
            </div>
          </Link>

          {/* 신년 운세 */}
          <Link href="/fortune" className="block">
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 hover:bg-white/15 transition group relative overflow-hidden">
              <div className="absolute top-2 right-2 bg-yellow-500 text-black text-xs font-bold px-2 py-1 rounded-full">
                2026 🐎
              </div>
              <div className="flex items-center gap-4">
                <div className="text-5xl">🔮</div>
                <div className="flex-1">
                  <h2 className="text-xl font-bold mb-1 group-hover:text-yellow-400 transition">
                    2026 신년 운세
                  </h2>
                  <p className="text-gray-400 text-sm">
                    사주팔자로 보는 병오년 운세
                  </p>
                </div>
                <div className="text-gray-500 group-hover:text-white transition">→</div>
              </div>
              <div className="flex gap-2 mt-4">
                <span className="text-xs px-2 py-1 bg-yellow-500/20 text-yellow-300 rounded-full">사주팔자</span>
                <span className="text-xs px-2 py-1 bg-orange-500/20 text-orange-300 rounded-full">천간지지</span>
                <span className="text-xs px-2 py-1 bg-red-500/20 text-red-300 rounded-full">오행분석</span>
              </div>
            </div>
          </Link>
        </div>

        {/* Info Section */}
        <div className="mt-12 bg-white/5 rounded-2xl p-6">
          <h3 className="font-bold mb-3 text-center">✨ 특징</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="text-center">
              <div className="text-2xl mb-1">📚</div>
              <p className="text-gray-400">전통 명리학 기반</p>
            </div>
            <div className="text-center">
              <div className="text-2xl mb-1">🤖</div>
              <p className="text-gray-400">AI 정밀 분석</p>
            </div>
            <div className="text-center">
              <div className="text-2xl mb-1">🎯</div>
              <p className="text-gray-400">체계적인 운세</p>
            </div>
            <div className="text-center">
              <div className="text-2xl mb-1">📱</div>
              <p className="text-gray-400">공유하기 쉬움</p>
            </div>
          </div>
        </div>

        {/* Coupang Partners Banner */}
        <div className="mt-8">
          <p className="text-center text-xs text-gray-400 mb-2">추천 상품</p>
          <div className="flex justify-center">
            <iframe
              src="https://ads-partners.coupang.com/widgets.html?id=950676&template=carousel&trackingCode=AF6497036&subId=&width=450&height=130&tsource="
              width="450"
              height="130"
              frameBorder="0"
              scrolling="no"
              referrerPolicy="unsafe-url"
              className="rounded-lg max-w-full"
            />
          </div>
          <p className="text-center text-gray-600 text-[10px] mt-2">
            쿠팡 파트너스 활동의 일환으로 일정액의 수수료를 제공받습니다
          </p>
        </div>

        {/* Footer */}
        <p className="text-center text-gray-500 text-xs mt-6">
          ⚠️ 재미로만 봐주세요! 과학적 근거는 없습니다.
        </p>
      </main>
    </div>
  );
}
