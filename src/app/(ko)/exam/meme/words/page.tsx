import type { Metadata } from 'next'
import Link from 'next/link'
import rounds from '@/content/exam/meme-rounds.json'
import { badge } from '@/lib/exam/rounds'
import type { Card, Round } from '@/lib/exam/types'
import { kstDate } from '@/lib/kst'
import { ALL_CARDS, EMPTY_COPY, releasedCards, todayRoundNo, whenRank, wordSlug } from '@/lib/exam/words'

const SITE = 'https://unse-ai.com'
const URL = `${SITE}/exam/meme/words`
const TITLE = '신조어·밈·레트로 유행어 뜻 모음 | 밈 능력고사 – 운명을 읽다'
const DESCRIPTION = '밈 능력고사에 나온 신조어·밈·레트로 유행어의 뜻과 쓰임, 유래를 한곳에 모았어요. 유행한 때별로 골라 읽어 보세요.'
const IMAGE = `/api/og?title=${encodeURIComponent('유행어 뜻 모음')}&subtitle=${encodeURIComponent('밈 능력고사')}`

export const revalidate = 21600

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: URL },
  openGraph: { title: TITLE, description: DESCRIPTION, type: 'website', locale: 'ko_KR', siteName: '운명을 읽다', url: URL, images: [{ url: IMAGE, width: 1200, height: 630 }] },
  twitter: { card: 'summary_large_image', title: TITLE, description: DESCRIPTION, images: [IMAGE] },
}

export default function WordsIndexPage() {
  const all = rounds.rounds as unknown as Round[]
  const open = releasedCards(ALL_CARDS, all, todayRoundNo(kstDate(new Date()), all))
  const groups = new Map<string, Card[]>()
  for (const c of [...open].sort((a, b) => whenRank(a.when) - whenRank(b.when))) {
    const b = badge(c.when)
    groups.set(b, [...(groups.get(b) ?? []), c])
  }
  return (
    <main className="mx-auto max-w-lg px-[22px] pt-8 pb-10">
      <h1 className="font-serif text-[27px] font-bold leading-[1.3]">신조어·밈·레트로 유행어 뜻 모음</h1>
      <p className="mt-2 text-sm leading-relaxed text-muted break-keep">
        밈 능력고사에 나온 말의 뜻과 쓰임, 유래를 모아 둔 곳이에요. 말마다 한 장씩 있고, 유행한 때별로 나눠 놓았어요.
        정답이 미리 보이지 않도록 오늘 문제와 앞으로 나올 문제의 말은 다음 날부터 열려요.
      </p>
      {open.length === 0 ? (
        <p className="mt-6 rounded-[22px] border border-line bg-card px-5 py-5 text-[15px]">{EMPTY_COPY}</p>
      ) : (
        [...groups].map(([label, cards]) => (
          <section key={label} className="mt-8">
            <h2 className="font-serif text-lg font-bold">{label}</h2>
            <ul className="mt-3 space-y-2">
              {cards.map((c) => (
                <li key={c.term}>
                  <Link href={`/exam/meme/words/${wordSlug(c.term)}`} className="block rounded-[22px] border border-line bg-card-2 px-4 py-3">
                    <span className="font-bold">{c.term}</span>
                    <span className="text-muted"> — {c.gloss}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ))
      )}
      <Link href="/exam/meme" className="mt-8 flex h-[52px] items-center justify-center rounded-full bg-accent text-base font-medium text-white">
        오늘의 5문제 풀기
      </Link>
    </main>
  )
}
