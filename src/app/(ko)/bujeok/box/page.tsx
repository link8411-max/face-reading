import type { Metadata } from 'next'
import BujeokBox from '@/components/bujeok/BujeokBox'

const SITE = 'https://unse-ai.com'

// 내 부적함: 이 기기에 모은 부적. 검색 제외, 사이트맵 제외, canonical은 /bujeok
export const metadata: Metadata = {
  title: '내 부적함 | 운명을 읽다',
  description: '이 기기에 모아 둔 부적을 다시 열어 볼 수 있어요.',
  robots: { index: false, follow: true },
  alternates: { canonical: `${SITE}/bujeok` },
}

export default function BujeokBoxPage() {
  return <BujeokBox />
}
