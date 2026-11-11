import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import GiftLanding from '@/components/bujeok/GiftLanding'
import { bujeokOgUrl, cleanName, giftHeadline, parseBujeokCode } from '@/lib/bujeok/link'
import { SITE } from '@/lib/shareBase'

type Q = Record<string, string | string[] | undefined>
type Props = { params: Promise<{ code: string }>; searchParams: Promise<Q> }
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v)

const DESCRIPTION = '친구가 보낸 부적이에요. 열어서 손으로 돌려 보고 잠금화면에 저장해 보세요.'
const NOINDEX = { index: false, follow: true } as const

// 선물 착지(검색 제외, 사이트맵 제외, canonical은 /bujeok). 카톡 봇은 JS를 실행하지 않아 미리보기 글은 서버 메타로 만든다.
// 이름은 cleanName을 통과한 것만 제목·화면에 쓰고, 미리보기 이미지에는 넣지 않는다.
export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const { code } = await params
  const spec = parseBujeokCode(code)
  const canonical = `${SITE}/bujeok`
  if (!spec) return { robots: NOINDEX, alternates: { canonical } }
  const q = await searchParams
  const title = giftHeadline(cleanName(one(q.to)))
  const image = bujeokOgUrl(spec)
  return {
    title: `${title} | 운명을 읽다`,
    description: DESCRIPTION,
    robots: NOINDEX,
    alternates: { canonical },
    openGraph: { title, description: DESCRIPTION, url: `${SITE}/bujeok/r/${code}`, siteName: '운명을 읽다', locale: 'ko_KR', type: 'website', images: [{ url: image, width: 1200, height: 630, alt: '부적' }] },
    twitter: { card: 'summary_large_image', title, description: DESCRIPTION, images: [image] },
  }
}

export default async function BujeokGiftPage({ params, searchParams }: Props) {
  const { code } = await params
  const spec = parseBujeokCode(code)
  if (!spec) redirect('/bujeok')
  const q = await searchParams
  return <GiftLanding spec={spec} to={cleanName(one(q.to))} from={cleanName(one(q.from))} />
}
