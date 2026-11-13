'use client'
// 집시세 "이번 주 신고가" 배너. 실제 데이터가 있을 때만 쓰인다(BujeokAd가 고른다). 부적 아래에만 놓는다.
// 화면에 절반 이상 보이면 house_banner_view, 누르면 house_banner_click (slot bujeok). 단지명·금액은 GA에 보내지 않는다.
import { useEffect, useRef } from 'react'
import { track } from '@/lib/analytics'
import { HOUSE_BANNER_SLOT, HOUSE_BANNER_URL, type WeeklyHigh } from '@/lib/zipsise/banner'

export default function HouseBanner({ high }: { high: WeeklyHigh }) {
  const box = useRef<HTMLDivElement>(null)
  const sent = useRef(false)

  useEffect(() => {
    const el = box.current
    if (!el) return
    const send = () => {
      if (sent.current) return
      sent.current = true
      track('house_banner_view', { slot: HOUSE_BANNER_SLOT })
    }
    if (!('IntersectionObserver' in window)) {
      send()
      return
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          send()
          io.disconnect()
        }
      },
      { threshold: 0.5 },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])

  return (
    <div ref={box} className="no-screenshot mt-6">
      <a
        href={HOUSE_BANNER_URL}
        target="_blank"
        rel="nofollow noopener"
        onClick={() => track('house_banner_click', { slot: HOUSE_BANNER_SLOT })}
        className="block rounded-[22px] border border-line bg-card px-5 py-4 text-left"
      >
        <span className="flex items-center justify-between text-xs">
          <span className="text-accent-ink font-medium">이번 주 신고가</span>
          <span className="text-muted">집시세</span>
        </span>
        <span className="mt-1.5 block text-[15px] font-medium text-ink break-keep">
          {high.regionName} {high.aptName} {high.amountText}
        </span>
        <span className="mt-0.5 block text-sm text-muted">이전 최고가보다 {high.jumpText}</span>
        <span className="mt-3 flex h-10 items-center justify-center rounded-full bg-ink text-paper text-sm font-medium">다른 신고가 보기</span>
      </a>
    </div>
  )
}
