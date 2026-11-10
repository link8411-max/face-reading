'use client'

import type { Question } from '@/lib/exam/types'
import { optionDelay } from './motion'

export interface OptionState {
  selected: number | null
  answered: boolean
  answer: number
  dim: Set<number> // 힌트로 흐려진 보기
  onPick: (i: number) => void
}

// 보기 버튼 묶음. 문제 카드와 대화 카드가 같이 쓴다.
export function OptionButtons({ q, state, cols }: { q: Question; state: OptionState; cols?: 1 | 2 }) {
  const { selected, answered, answer, dim, onPick } = state
  const options = q.options
  return (
    <ul className={`mt-5 grid gap-2.5 ${cols === 2 ? 'grid-cols-2' : 'grid-cols-1'}`}>
      {options.map((text, i) => {
        const isAnswer = answered && i === answer
        const isWrongPick = answered && selected === i && i !== answer
        const dimmed = !answered && dim.has(i)
        const motion = isAnswer ? (selected === i ? 'ex-correct' : 'ex-reveal') : isWrongPick ? 'ex-wrong' : dimmed ? 'ex-dim' : ''
        const tone = isAnswer
          ? 'border-accent bg-card text-accent font-bold'
          : isWrongPick
            ? 'border-line bg-card-2 text-muted line-through'
            : dimmed || answered
              ? 'border-line bg-card-2 text-muted opacity-50'
              : 'border-line bg-card-2 text-ink active:bg-card'
        return (
          <li key={i} className="ex-rise" style={{ '--d': `${optionDelay(q, i)}ms` } as React.CSSProperties}>
            <button
              type="button"
              disabled={answered || dimmed}
              onClick={() => onPick(i)}
              className={`ex-btn ${motion} flex min-h-[52px] w-full items-center rounded-[22px] border px-4 py-3 text-left text-[15px] leading-snug break-keep ${cols === 2 ? 'justify-center text-center text-lg font-bold' : ''} ${tone}`}
            >
              {text}
            </button>
          </li>
        )
      })}
    </ul>
  )
}

export default function QuestionCard({ q, state }: { q: Question; state: OptionState }) {
  const isOx = q.type === 'ox'
  return (
    <div>
      <h2 style={{ '--d': '40ms' } as React.CSSProperties} className="ex-rise font-serif text-[22px] font-bold leading-[1.45] break-keep">{q.ask}</h2>
      {q.show && (
        <p className="mt-3 rounded-[22px] border border-line bg-card px-5 py-4 text-[17px] leading-relaxed break-keep">
          {isOx ? q.show : `“${q.show}”`}
        </p>
      )}
      <OptionButtons q={q} state={state} cols={isOx ? 2 : 1} />
    </div>
  )
}
