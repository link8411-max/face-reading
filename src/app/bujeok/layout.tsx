import type { Metadata } from 'next'

const SITE = 'https://unse-ai.com'
const TITLE = '무료 부적 만들기 | 손으로 돌려 보는 부적 카드, 잠금화면 저장 – 운명을 읽다'
const DESCRIPTION = '재물·합격·건강·연애·액막이 중 소원 하나를 고르면 손으로 돌려 보는 부적 카드를 만들어 드려요. 종이·금박·홀로그램 마감을 고르고, 확대해서 뒷면의 뜻까지 볼 수 있어요. 잠금화면 이미지로 저장하거나 친구에게 이름을 넣어 선물해 보세요.'
const IMAGE = `/api/og?title=${encodeURIComponent('나만의 부적')}&subtitle=${encodeURIComponent('손으로 돌려 보는 부적 카드')}`

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
