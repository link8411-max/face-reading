// 소원별 부적 예시(서버 컴포넌트): 금박 예시 그림 11장을 4열로 보여 주고, 누르면 그 소원이 골라진 만들기 화면으로 간다.
// 그림은 scripts/bujeok-examples.ts가 실제 BujeokSvg에서 뽑아 둔 정지 그림이라 검색엔진도 HTML 소스에서 읽는다.
import Link from 'next/link'
import { WISH_ORDER } from '@/lib/bujeok/keys'
import { EXAMPLE_H, EXAMPLE_W, WISH_TEXT, exampleAlt, exampleSrc } from '@/content/bujeok'

export default function ExampleGallery() {
  return (
    <section aria-labelledby="bujeok-examples-title" className="max-w-lg mx-auto px-4 pt-10 pb-8" data-testid="bujeok-examples">
      <h2 id="bujeok-examples-title" className="font-serif font-bold text-[22px] text-center text-[#F3D88C]">소원별 부적</h2>
      <p className="text-center text-sm text-muted mt-1 mb-5 break-keep">마음에 드는 소원을 누르면 그 부적으로 만들 수 있어요</p>
      <ul className="bj-tiles list-none p-0 m-0">
        {WISH_ORDER.map((w) => (
          <li key={w}>
            <Link href={`/bujeok?wish=${w}&style=trad&finish=gold`} className="bj-tile block" scroll>
              {/* 이미 webp로 줄여 둔 정지 그림이라 next/image 대신 img(크기 고정) */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={exampleSrc(w, 'gold')} alt={exampleAlt(w, 'gold')} width={EXAMPLE_W} height={EXAMPLE_H} loading="lazy" decoding="async" className="block w-full h-auto rounded" />
              <b>{WISH_TEXT[w].label}</b>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  )
}
