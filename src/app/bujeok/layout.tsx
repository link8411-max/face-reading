import type { Metadata } from 'next'

const SITE = 'https://unse-ai.com'
const TITLE = '무료 부적 만들기 | 소원을 붓으로 그린 나만의 부적, 잠금화면 저장 – 운명을 읽다'
const DESCRIPTION = '재물·합격·건강·연애·액막이 중 소원 하나를 고르면 부적을 붓으로 그려 드려요. 생년월일을 넣으면 사주에서 부족한 기운을 채우는 쪽으로 그리고, 잠금화면 이미지로 저장하거나 친구에게 선물할 수 있어요.'
const IMAGE = `/api/og?title=${encodeURIComponent('나만의 부적')}&subtitle=${encodeURIComponent('소원을 붓으로 그려 드려요')}`

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  keywords: '부적, 부적 만들기, 무료 부적, 재물 부적, 합격 부적, 잠금화면 부적, 부적 선물, 행운 부적',
  alternates: { canonical: `${SITE}/bujeok` },
  openGraph: { title: TITLE, description: DESCRIPTION, type: 'website', locale: 'ko_KR', siteName: '운명을 읽다', url: `${SITE}/bujeok`, images: [{ url: IMAGE, width: 1200, height: 630 }] },
  twitter: { card: 'summary_large_image', title: TITLE, description: DESCRIPTION, images: [IMAGE] },
}

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: '나만의 부적',
  description: '소원과 화풍을 고르면 부적을 붓으로 그려 주고 잠금화면 이미지로 저장할 수 있는 무료 서비스',
  url: `${SITE}/bujeok`,
  applicationCategory: 'EntertainmentApplication',
  operatingSystem: 'Web',
  offers: { '@type': 'Offer', price: '0', priceCurrency: 'KRW' },
}

const breadcrumbJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: '운명을 읽다', item: SITE },
    { '@type': 'ListItem', position: 2, name: '나만의 부적', item: `${SITE}/bujeok` },
  ],
}

export default function BujeokLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      {children}
    </>
  )
}
