"use client";

import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-stone-950 via-red-950 to-stone-950 text-white relative overflow-hidden">
      {/* 전통 문양 배경 */}
      <div className="absolute inset-0 opacity-5 pointer-events-none">
        <div className="absolute top-10 left-5 text-6xl">卍</div>
        <div className="absolute top-32 right-10 text-5xl">福</div>
        <div className="absolute top-60 left-8 text-4xl">壽</div>
        <div className="absolute bottom-60 right-5 text-6xl">吉</div>
        <div className="absolute bottom-32 left-1/4 text-5xl">運</div>
        <div className="absolute top-1/2 right-1/4 text-4xl">命</div>
      </div>

      <main className="container mx-auto px-4 py-12 max-w-lg relative z-10">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex justify-center items-center gap-2 mb-4">
            <span className="text-amber-600/60">━━</span>
            <span className="text-3xl animate-float">☯</span>
            <span className="text-amber-600/60">━━</span>
          </div>
          <h1 className="text-4xl font-bold mb-3 text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-yellow-400 to-amber-200" style={{ textShadow: "0 0 30px rgba(251, 191, 36, 0.3)" }}>
            運命을 읽다
          </h1>
          <p className="text-amber-100/60 tracking-widest">
            AI와 전통 명리학이 만나다
          </p>
          <div className="flex justify-center items-center gap-2 mt-3">
            <span className="text-red-800/60 text-xs">◆</span>
            <span className="text-amber-600/40 text-xs">━━━━━</span>
            <span className="text-red-800/60 text-xs">◆</span>
          </div>
        </div>

        {/* Menu Cards */}
        <div className="space-y-4">
          {/* 관상 테스트 */}
          <Link href="/face" className="block">
            <div className="bg-gradient-to-b from-stone-900/80 to-red-950/50 backdrop-blur-lg rounded-2xl p-6 hover:from-stone-800/80 hover:to-red-900/50 transition group border border-amber-600/20">
              <div className="flex items-center gap-4">
                <div className="text-5xl">👤</div>
                <div className="flex-1">
                  <h2 className="text-xl font-bold mb-1 text-amber-100 group-hover:text-amber-300 transition">
                    AI 觀相 분석
                  </h2>
                  <p className="text-stone-400 text-sm">
                    얼굴 사진으로 보는 초년·중년·말년운
                  </p>
                </div>
                <div className="text-amber-600/50 group-hover:text-amber-400 transition">→</div>
              </div>
              <div className="flex gap-2 mt-4">
                <span className="text-xs px-2 py-1 bg-red-900/30 text-red-300 rounded-full border border-red-600/20">전통 관상학</span>
                <span className="text-xs px-2 py-1 bg-amber-900/30 text-amber-300 rounded-full border border-amber-600/20">AI 분석</span>
                <span className="text-xs px-2 py-1 bg-emerald-900/30 text-emerald-300 rounded-full border border-emerald-600/20">財物運</span>
              </div>
            </div>
          </Link>

          {/* 오늘의 운세 */}
          <Link href="/fortune/daily" className="block">
            <div className="bg-gradient-to-b from-stone-900/80 to-red-950/50 backdrop-blur-lg rounded-2xl p-6 hover:from-stone-800/80 hover:to-red-900/50 transition group relative overflow-hidden border border-amber-600/20">
              <div className="absolute top-2 right-2 bg-gradient-to-r from-red-700 to-amber-600 text-amber-100 text-xs font-bold px-2 py-1 rounded-full animate-pulse-heart">
                NEW
              </div>
              <div className="flex items-center gap-4">
                <div className="text-5xl">☯</div>
                <div className="flex-1">
                  <h2 className="text-xl font-bold mb-1 text-amber-100 group-hover:text-amber-300 transition">
                    오늘의 運勢
                  </h2>
                  <p className="text-stone-400 text-sm">
                    띠별로 보는 오늘 하루 운세
                  </p>
                </div>
                <div className="text-amber-600/50 group-hover:text-amber-400 transition">→</div>
              </div>
              <div className="flex gap-2 mt-4">
                <span className="text-xs px-2 py-1 bg-red-900/30 text-red-300 rounded-full border border-red-600/20">매일 업데이트</span>
                <span className="text-xs px-2 py-1 bg-amber-900/30 text-amber-300 rounded-full border border-amber-600/20">행운시간</span>
                <span className="text-xs px-2 py-1 bg-amber-900/30 text-amber-200 rounded-full border border-amber-600/20">행운색</span>
              </div>
            </div>
          </Link>

          {/* 신년 운세 */}
          <Link href="/fortune" className="block">
            <div className="bg-gradient-to-b from-stone-900/80 to-red-950/50 backdrop-blur-lg rounded-2xl p-6 hover:from-stone-800/80 hover:to-red-900/50 transition group relative overflow-hidden border border-amber-600/20">
              <div className="absolute top-2 right-2 bg-gradient-to-r from-amber-600 to-yellow-500 text-stone-900 text-xs font-bold px-2 py-1 rounded-full">
                丙午年 🐎
              </div>
              <div className="flex items-center gap-4">
                <div className="text-5xl">🔮</div>
                <div className="flex-1">
                  <h2 className="text-xl font-bold mb-1 text-amber-100 group-hover:text-amber-300 transition">
                    2026 新年 운세
                  </h2>
                  <p className="text-stone-400 text-sm">
                    사주팔자로 보는 병오년 운세
                  </p>
                </div>
                <div className="text-amber-600/50 group-hover:text-amber-400 transition">→</div>
              </div>
              <div className="flex gap-2 mt-4">
                <span className="text-xs px-2 py-1 bg-amber-900/30 text-amber-300 rounded-full border border-amber-600/20">四柱八字</span>
                <span className="text-xs px-2 py-1 bg-red-900/30 text-red-300 rounded-full border border-red-600/20">天干地支</span>
                <span className="text-xs px-2 py-1 bg-emerald-900/30 text-emerald-300 rounded-full border border-emerald-600/20">五行分析</span>
              </div>
            </div>
          </Link>
        </div>

        {/* Info Section */}
        <div className="mt-12 bg-gradient-to-b from-stone-900/50 to-red-950/30 rounded-2xl p-6 border border-amber-600/20">
          <h3 className="font-bold mb-3 text-center text-amber-100">☯ 特徵</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="text-center">
              <div className="text-2xl mb-1">📜</div>
              <p className="text-stone-400">전통 명리학 기반</p>
            </div>
            <div className="text-center">
              <div className="text-2xl mb-1">🤖</div>
              <p className="text-stone-400">AI 정밀 분석</p>
            </div>
            <div className="text-center">
              <div className="text-2xl mb-1">🎯</div>
              <p className="text-stone-400">체계적인 운세</p>
            </div>
            <div className="text-center">
              <div className="text-2xl mb-1">📱</div>
              <p className="text-stone-400">공유하기 쉬움</p>
            </div>
          </div>
        </div>

        {/* Coupang Partners Banner */}
        <div className="mt-8">
          <p className="text-center text-xs text-stone-500 mb-2">추천 상품</p>
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
          <p className="text-center text-stone-700 text-[10px] mt-2">
            쿠팡 파트너스 활동의 일환으로 일정액의 수수료를 제공받습니다
          </p>
        </div>

        {/* Footer */}
        <p className="text-center text-stone-600 text-xs mt-6">
          ⚠️ 재미로만 봐주세요! 과학적 근거는 없습니다.
        </p>
      </main>
    </div>
  );
}
