'use client'

import { useEffect, useRef } from 'react'
import type { Question } from '@/lib/exam/types'

// 해설: 카드의 meaning·usage·origin을 그대로 보여 준다. 화면 코드에서 문장을 지어내지 않는다.
export default function Explain({ q, correct, timedOut, rate = null, isLast, onNext }: { q: Question; correct: boolean; timedOut: boolean; rate?: string | null; isLast: boolean; onNext: () => void }) {
  // 해설이 길면 '다음' 버튼이 화면 아래로 밀린다. 해설이 뜨면 버튼이 보이게 내려 준다.
  const nextRef = useRef<HTMLButtonElement>(null)
  useEffect(() => { nextRef.current?.scrollIntoView?.({ block: 'nearest', behavior: 'smooth' }) }, [])
  const rows: [string, string][] = [
    ['이런 말이에요', q.explain.meaning],
    ['이럴 때 써요', q.explain.usage],
    ['어디서 나왔나', q.explain.origin],
  ]
  return (
    <section aria-label="해설" className="ex-rise-lg mt-6 rounded-[22px] border border-line bg-card px-5 py-5">
      <p className="font-serif text-[20px] font-bold">{correct ? '정답' : '아쉬워요'}</p>
      {!correct && timedOut && <p className="mt-0.5 text-sm text-muted">시간이 지났어요</p>}
      <p className="mt-1 text-[15px] break-keep">정답은 <b>{q.options[q.answer]}</b></p>
      <p className="mt-1 text-sm text-muted">{q.term}</p>
      {/* 실제 집계가 표본 기준(MIN_SOLVERS)을 넘은 문제만. 답을 고른 뒤에만 보인다 */}
      {rate && <p className="mt-2 inline-block rounded-full bg-card-2 px-3 py-1 text-xs font-medium text-accent">{rate}</p>}
      <dl className="mt-4 space-y-3">
        {rows.map(([label, text], i) => (
          <div key={label} className="ex-rise" style={{ '--d': `${120 + i * 80}ms` } as React.CSSProperties}>
            <dt className="text-xs font-bold text-accent">{label}</dt>
            <dd className="mt-0.5 text-[15px] leading-relaxed break-keep">{text}</dd>
          </div>
        ))}
      </dl>
      <button ref={nextRef} type="button" onClick={onNext} className="mt-5 flex h-[52px] w-full items-center justify-center rounded-full bg-accent text-base font-medium text-white">
        {isLast ? '성적표 보기' : '다음 문제'}
      </button>
    </section>
  )
}
