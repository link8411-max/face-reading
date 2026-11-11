// 부적 한 장. 같은 spec·이름이면 언제나 같은 그림이다. 그리는 연출은 BujeokReveal이 data-a 순서를 읽어 맡는다.
import type { BujeokSpec } from '@/lib/bujeok/keys'
import { WISH_TEXT } from '@/content/bujeok'
import CuteBujeok from './parts/cute'
import TradBujeok from './parts/trad'

export default function BujeokSvg({ spec, name, className, lite }: { spec: BujeokSpec; name: string | null; className?: string; lite?: boolean }) {
  const Kit = spec.style === 'trad' ? TradBujeok : CuteBujeok
  return (
    <svg viewBox="0 0 300 520" role="img" aria-label={`${WISH_TEXT[spec.wish].label} 부적`} className={className} xmlns="http://www.w3.org/2000/svg">
      <Kit spec={spec} name={name} lite={lite} />
    </svg>
  )
}
