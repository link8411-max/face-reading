import type { Metadata } from 'next'
import ExamGame from '@/components/exam/ExamGame'
import SharedLandingTracker from '@/components/share/SharedLandingTracker'
import rounds from '@/content/exam/meme-rounds.json'
import { encodeShared, examOgImageUrl, examPhrase, parseShared } from '@/lib/exam/link'
import type { Round } from '@/lib/exam/types'
import { SITE } from '@/lib/shareBase'

type Props = { params: Promise<{ code: string }> }

const ALL = rounds.rounds as unknown as Round[]
const DESCRIPTION = '친구가 푼 밈 능력고사 성적표예요. 같은 5문제를 풀고 누가 더 잘 아는지 겨뤄 보세요.'
const NOINDEX = { index: false, follow: true } as const

// 친구가 보낸 도전장(검색 제외, 사이트맵 제외, canonical은 밈 능력고사 첫 화면). 잘못된 코드도 같은 처리로 일반 착지 화면을 보인다.
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { code } = await params
  const s = parseShared(code, ALL.length)
  const canonical = `${SITE}/exam/meme`
  if (!s) return { robots: NOINDEX, alternates: { canonical } }
  const phrase = examPhrase(s.grade)
  const correct = [...s.marks].filter((c) => c === 'O').length
  const image = examOgImageUrl(s.grade, correct)
  return {
    title: `${phrase} | 운명을 읽다`,
    description: DESCRIPTION,
    robots: NOINDEX,
    alternates: { canonical },
    openGraph: { title: phrase, description: DESCRIPTION, url: `${SITE}/exam/meme/r/${encodeShared(s)}`, siteName: '운명을 읽다', locale: 'ko_KR', type: 'website', images: [{ url: image, width: 1200, height: 630, alt: phrase }] },
    twitter: { card: 'summary_large_image', title: phrase, description: DESCRIPTION, images: [image] },
  }
}

export default async function ExamSharePage({ params }: Props) {
  const { code } = await params
  const shared = parseShared(code, ALL.length)
  return (
    <main className="mx-auto max-w-lg px-[22px] pt-8 pb-10">
      {shared && <SharedLandingTracker test="exam" resultId="meme" />}
      <h1 className="font-serif text-[27px] font-bold leading-[1.3]">밈 능력고사</h1>
      <p className="mt-2 text-sm leading-relaxed text-muted break-keep">매일 5문제로 신조어·밈·레트로 유행어를 얼마나 아는지 확인해 보세요.</p>
      <ExamGame rounds={ALL} challenge={shared} />
    </main>
  )
}
