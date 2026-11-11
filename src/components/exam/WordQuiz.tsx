'use client'

import { useState } from 'react'
import type { Question } from '@/lib/exam/types'
import QuestionCard from './QuestionCard'

// 낱말 페이지의 '이 말로 한 문제': 타이머·점수 없이 보기를 누르면 맞았는지만 알려 준다.
export default function WordQuiz({ q }: { q: Question }) {
  const [selected, setSelected] = useState<number | null>(null)
  const answered = selected !== null
  return (
    <div>
      <QuestionCard q={q} state={{ selected, answered, answer: q.answer, dim: new Set(), onPick: (i) => setSelected((s) => s ?? i) }} />
      {answered && (
        <p role="status" className="mt-4 text-[15px] font-bold">
          {selected === q.answer ? '맞았어요' : `아쉬워요, 정답은 ${q.options[q.answer]}`}
        </p>
      )}
    </div>
  )
}
