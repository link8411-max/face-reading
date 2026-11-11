// 부적 한 장. 같은 spec·이름이면 언제나 같은 그림이다. 마감(종이·금박·홀로그램)은 palette.themeFor의 색으로 정해진다.
// 홀로그램의 무지갯빛과 움직이는 빛줄기는 그림이 아니라 카드(BujeokCard) 위의 겹침 층이다.
import type { BujeokSpec } from '@/lib/bujeok/keys'
import { CARD_BOX } from '@/lib/bujeok/palette'
import { WISH_TEXT } from '@/content/bujeok'
import CuteBujeok from './parts/cute'
import TradBujeok from './parts/trad'

export default function BujeokSvg({ spec, name, className, lite, crop }: { spec: BujeokSpec; name: string | null; className?: string; lite?: boolean; crop?: boolean }) {
  const Kit = spec.style === 'trad' ? TradBujeok : CuteBujeok
  const b = CARD_BOX[spec.style]
  return (
    <svg viewBox={crop ? `${b.x} ${b.y} ${b.w} ${b.h}` : '0 0 300 520'} role="img" aria-label={`${WISH_TEXT[spec.wish].label} 부적`} className={className} xmlns="http://www.w3.org/2000/svg">
      <Kit spec={spec} name={name} lite={lite} />
    </svg>
  )
}
