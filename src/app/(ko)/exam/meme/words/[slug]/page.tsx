import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import WordBody from '@/components/exam/WordBody'
import rounds from '@/content/exam/meme-rounds.json'
import { kstDate } from '@/lib/kst'
import type { Card, Round } from '@/lib/exam/types'
import { ALL_CARDS, cardBySlug, quizFor, relatedWords, releasedCards, todayRoundNo, wordSlug } from '@/lib/exam/words'

type Props = { params: Promise<{ slug: string }> }

const SITE = 'https://unse-ai.com'
const ROUNDS = rounds.rounds as unknown as Round[]

// 자정이 지나면 새로 열릴 말이 있어서 6시간마다 다시 만든다(너무 짧게 잡으면 ISR 쓰기 비용이 든다)
export const revalidate = 21600

export function generateStaticParams() {
  return ALL_CARDS.map((c) => ({ slug: wordSlug(c.term) }))
}

function titleOf(card: Card) {
  const full = `${card.term} 뜻 – ${card.gloss} | 밈 능력고사`
  return full.length <= 48 ? full : `${card.term} 뜻 – ${card.gloss}`
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const card = cardBySlug(slug)
  if (!card) return {}
  const title = titleOf(card)
  const description = `${card.meaning} ${card.usage}`.slice(0, 110)
  const url = `${SITE}/exam/meme/words/${wordSlug(card.term)}`
  const image = `/api/og?title=${encodeURIComponent(`${card.term} 뜻`)}&subtitle=${encodeURIComponent(card.gloss)}`
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: { title, description, type: 'article', locale: 'ko_KR', siteName: '운명을 읽다', url, images: [{ url: image, width: 1200, height: 630 }] },
    twitter: { card: 'summary_large_image', title, description, images: [image] },
  }
}

export default async function WordPage({ params }: Props) {
  const { slug } = await params
  const card = cardBySlug(slug)
  if (!card) notFound()
  const today = todayRoundNo(kstDate(new Date()), ROUNDS)
  const released = releasedCards(ALL_CARDS, ROUNDS, today)
  if (!released.some((c) => c.term === card.term)) notFound() // 오늘·앞으로 나올 문제의 말은 숨긴다
  const { sameWhen, sameKind } = relatedWords(card, released)
  const own = wordSlug(card.term)
  const url = `${SITE}/exam/meme/words/${own}`
  const jsonLd = [
    { '@context': 'https://schema.org', '@type': 'DefinedTerm', name: card.term, description: `${card.meaning} ${card.usage}`, inDefinedTermSet: `${SITE}/exam/meme/words`, url },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: '홈', item: SITE },
        { '@type': 'ListItem', position: 2, name: '밈 능력고사', item: `${SITE}/exam/meme` },
        { '@type': 'ListItem', position: 3, name: '말 모음', item: `${SITE}/exam/meme/words` },
        { '@type': 'ListItem', position: 4, name: card.term, item: url },
      ],
    },
  ]
  return (
    <main className="mx-auto max-w-lg px-[22px] pt-8 pb-10">
      {jsonLd.map((j, i) => <script key={i} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(j).replace(/</g, '\\u003c') }} />)}
      <WordBody card={card} sameWhen={sameWhen} sameKind={sameKind} quiz={quizFor(card, released, own)} />
    </main>
  )
}
