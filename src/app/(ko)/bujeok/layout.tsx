import type { Metadata } from 'next'

const SITE = 'https://unse-ai.com'
const TITLE = '무료 부적 만들기 | 손으로 돌려 보는 부적 카드 – 운명을 읽다'
const DESCRIPTION = '합격·재물·건강 등 소원 11가지 중 하나를 고르고 마지막 한 획을 직접 그어 완성하는 부적 카드예요. 잠금화면 저장과 선물까지 무료예요.'
const IMAGE = '/bujeok/og-bujeok.png' // 1200×630, scripts/bujeok-examples.ts가 만든 정지 그림

// 구조화 데이터와 본문 가이드는 선물 착지(/bujeok/r/…)에 중첩되지 않게 page.tsx에서 렌더한다 (/fortune과 같은 방식)
export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  keywords: '부적, 부적 만들기, 무료 부적, 재물 부적, 합격 부적, 잠금화면 부적, 부적 선물, 행운 부적, 부적 카드',
  alternates: { canonical: `${SITE}/bujeok` },
  openGraph: { title: TITLE, description: DESCRIPTION, type: 'website', locale: 'ko_KR', siteName: '운명을 읽다', url: `${SITE}/bujeok`, images: [{ url: IMAGE, width: 1200, height: 630 }] },
  twitter: { card: 'summary_large_image', title: TITLE, description: DESCRIPTION, images: [IMAGE] },
}

export default function BujeokLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
