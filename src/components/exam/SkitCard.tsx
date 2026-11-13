'use client'

import { useEffect, useState } from 'react'
import type { Question } from '@/lib/exam/types'
import { BUBBLE_MS, useReducedMotion } from './motion'
import { OptionButtons, type OptionState } from './QuestionCard'

// 대화 문제. blank·reply는 말풍선(상대 왼쪽, 나 오른쪽), card(상황 밈)는 글 카드.
export default function SkitCard({ q, state, timedOut }: { q: Question; state: OptionState; timedOut: boolean }) {
  const skit = q.skit!
  const reduced = useReducedMotion()
  // 상대 반응은 점 세 개가 0.6초 깜빡인 뒤에 말풍선으로 뜬다(움직임 줄이기면 바로)
  const [typed, setTyped] = useState(false)
  const answeredNow = state.answered
  useEffect(() => {
    if (!answeredNow || reduced) return
    const t = setTimeout(() => setTyped(true), 600)
    return () => clearTimeout(t)
  }, [answeredNow, reduced])
  const { selected, answered, answer } = state
  const chosen = selected !== null ? q.options[selected] : null
  const other = skit.lines[0]?.who ?? ''

  if (skit.form === 'card') {
    const [card, ask] = skit.lines
    return (
      <div>
        <p className="rounded-[22px] border border-line bg-card px-5 py-6 text-center font-serif text-[20px] leading-relaxed break-keep">{card.text}</p>
        <h2 className="mt-4 font-serif text-[20px] font-bold leading-[1.45] break-keep">{ask.text}</h2>
        <OptionButtons q={q} state={state} />
      </div>
    )
  }

  const reaction = !answered ? null : timedOut ? skit.timeout : selected === answer ? skit.right : skit.wrong
  return (
    <div>
      <p className="mb-3 text-sm text-muted">대화를 읽고 알맞은 말을 골라 보세요</p>
      <div className="flex flex-col gap-2.5">
        {skit.lines.map((l, i) => {
          const mine = l.who === '나'
          const parts = l.text.split('____')
          return (
            <div key={i} className={`ex-rise flex flex-col ${mine ? 'items-end' : 'items-start'}`} style={{ '--d': `${i * BUBBLE_MS}ms` } as React.CSSProperties}>
              {!mine && <span className="mb-1 text-xs text-muted">{l.who}</span>}
              <p className={`max-w-[85%] rounded-[22px] px-4 py-3 text-[15px] leading-snug break-keep ${mine ? 'bg-ink text-paper' : 'bg-card border border-line text-ink'}`}>
                {parts.length === 1
                  ? l.text
                  : parts.map((p, k) => (
                      <span key={k}>
                        {p}
                        {k < parts.length - 1 && (chosen ? <b key={chosen} className="ex-pop inline-block underline underline-offset-4">{chosen}</b> : <span className="inline-block min-w-[3.5em] border-b-2 border-current align-baseline">&nbsp;</span>)}
                      </span>
                    ))}
              </p>
            </div>
          )
        })}
        {reaction && (
          <div className="ex-pop flex flex-col items-start">
            <span className="mb-1 text-xs text-muted">{other}</span>
            {reduced || typed ? (
              <p className="max-w-[85%] rounded-[22px] bg-card border border-line px-4 py-3 text-[15px] leading-snug break-keep">{reaction}</p>
            ) : (
              <p className="ex-dots flex gap-1 rounded-[22px] bg-card border border-line px-4 py-3 text-[15px]" aria-label="입력 중"><span>.</span><span>.</span><span>.</span></p>
            )}
          </div>
        )}
      </div>
      <OptionButtons q={q} state={state} />
    </div>
  )
}
