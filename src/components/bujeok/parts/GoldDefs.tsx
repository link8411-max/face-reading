// 금박·홀로그램의 금색 선 그라데이션. 선이 가로·세로 한 줄이어도 보이도록 userSpaceOnUse로 그림 전체에 건다.
import { FOIL, goldId } from '@/lib/bujeok/palette'
import type { Finish } from '@/lib/bujeok/keys'

const AT = [0, 0.3, 0.55, 0.8, 1]

export default function GoldDefs({ finish }: { finish: Finish }) {
  return (
    <linearGradient id={goldId(finish)} gradientUnits="userSpaceOnUse" x1="24" y1="6" x2="276" y2="514">
      {FOIL.stops.map((c, i) => (
        <stop key={i} offset={AT[i]} stopColor={c} />
      ))}
    </linearGradient>
  )
}
