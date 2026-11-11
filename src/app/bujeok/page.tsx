import { fetchWeeklyHigh } from '@/lib/zipsise/highs'
import PageGuide from '@/components/PageGuide'
import BujeokClient, { type Initial } from '@/components/bujeok/BujeokClient'
import { FINISHES, STYLES, WISHES, type BujeokStyle, type Finish, type Wish } from '@/lib/bujeok/keys'

const SITE = 'https://unse-ai.com'
const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: '나만의 부적',
  description: '소원과 그림체, 마감을 고르면 손으로 돌려 볼 수 있는 부적 카드를 만들어 주고 잠금화면 이미지로 저장하거나 친구에게 선물할 수 있는 무료 서비스',
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

type Q = Record<string, string | string[] | undefined>
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v)

// 허용 목록에 있는 값만 받는다. 모르는 값은 무시하고 기본 시작 화면
function parseInitial(q: Q): Initial {
  const mode = one(q.mode)
  const wish = one(q.wish)
  const style = one(q.style)
  const finish = one(q.finish)
  return {
    mode: mode === 'gift' ? 'gift' : mode === 'mine' ? 'mine' : undefined,
    wish: (WISHES as readonly string[]).includes(wish ?? '') ? (wish as Wish) : undefined,
    style: (STYLES as readonly string[]).includes(style ?? '') ? (style as BujeokStyle) : undefined,
    finish: (FINISHES as readonly string[]).includes(finish ?? '') ? (finish as Finish) : undefined,
  }
}

export default async function BujeokPage({ searchParams }: { searchParams: Promise<Q> }) {
  const initial = parseInitial(await searchParams)
  // 쿼리가 바뀌어 같은 페이지로 이동하면(선물하기 등) 입력 상태를 새로 시작한다
  const high = await fetchWeeklyHigh() // 1시간 캐시, 실패하면 null(쿠팡 배너로 대신)
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      <BujeokClient key={JSON.stringify(initial)} initial={initial} high={high} />
      <PageGuide route="/bujeok" />
    </>
  )
}
