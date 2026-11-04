import Link from 'next/link'
import { cupBoardFor } from '@/lib/cup/boards'

/** 이 장수를 넣고 월드컵을 시작하는 링크. 월드컵 후보가 아닌 인물(초상화 대기)이면 아무것도 그리지 않는다 */
export default function CupWithLink({ id, label, wrapClassName = '' }: { id: string; label: string; wrapClassName?: string }) {
  const board = cupBoardFor(id)
  if (!board) return null
  return (
    <div className={`flex justify-center ${wrapClassName}`}>
      <Link
        href={`/samguk/cup/${board}?with=${id}`}
        className="inline-flex min-h-[44px] items-center justify-center rounded-full border border-line bg-card px-5 text-sm font-bold text-ink transition hover:border-accent/50"
      >
        {label}
      </Link>
    </div>
  )
}
