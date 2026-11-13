import Link from 'next/link'
import { badge } from '@/lib/exam/rounds'
import type { Card, Question } from '@/lib/exam/types'
import { KIND_LABEL, wordSlug } from '@/lib/exam/words'
import WordQuiz from './WordQuiz'

function WordList({ title, cards }: { title: string; cards: Card[] }) {
  if (!cards.length) return null
  return (
    <section className="mt-8">
      <h2 className="font-serif text-lg font-bold">{title}</h2>
      <ul className="mt-3 space-y-2">
        {cards.map((c) => (
          <li key={c.term}>
            <Link href={`/exam/meme/words/${wordSlug(c.term)}`} className="block rounded-[22px] border border-line bg-card-2 px-4 py-3">
              <span className="font-bold">{c.term}</span>
              <span className="mt-0.5 block text-sm text-muted break-keep">{c.gloss}</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  )
}

// 낱말 페이지 본문. 전부 서버에서 그린 글이다(카드 문장 그대로, 지어내지 않는다).
export default function WordBody({ card, sameWhen, sameKind, quiz }: { card: Card; sameWhen: Card[]; sameKind: Card[]; quiz: Question | null }) {
  const rows: [string, string][] = [
    ['이런 말이에요', card.meaning],
    ['이럴 때 써요', card.usage],
    ['어디서 나왔나', card.origin],
  ]
  return (
    <>
      <nav aria-label="현재 위치" className="text-xs text-muted">
        <Link href="/">홈</Link> › <Link href="/exam/meme">밈 능력고사</Link> › <Link href="/exam/meme/words">말 모음</Link>
      </nav>
      <h1 className="mt-3 font-serif text-[27px] font-bold leading-[1.3] break-keep">{card.term} 뜻</h1>
      <p className="mt-2 flex flex-wrap items-center gap-2 text-sm text-muted">
        <span className="rounded-full bg-card border border-line px-3 py-1 text-xs">{badge(card.when)}</span>
        <span>{KIND_LABEL[card.kind]}</span>
      </p>
      {card.expansion && <p className="mt-3 text-[17px] font-bold break-keep">{card.term} = {card.expansion}</p>}
      <dl className="mt-5 space-y-4">
        {rows.map(([label, text]) => (
          <div key={label} className="rounded-[22px] border border-line bg-card px-5 py-4">
            <dt className="text-xs font-bold text-accent-ink">{label}</dt>
            <dd className="mt-1 text-[15px] leading-relaxed break-keep">{text}</dd>
          </div>
        ))}
      </dl>
      <WordList title="같은 때 유행한 말" cards={sameWhen} />
      <WordList title="비슷한 갈래의 말" cards={sameKind} />
      {quiz && (
        <section className="mt-8" aria-label="이 말로 한 문제">
          <h2 className="font-serif text-lg font-bold">이 말로 한 문제</h2>
          <div className="mt-3 rounded-[22px] border border-line bg-card px-5 py-5">
            <WordQuiz q={quiz} />
          </div>
        </section>
      )}
      <Link href="/exam/meme" className="mt-8 flex h-[52px] items-center justify-center rounded-full bg-accent text-base font-medium text-white">
        오늘의 5문제 풀기
      </Link>
    </>
  )
}
