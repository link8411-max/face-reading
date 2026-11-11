// 개발 전용: 부적 그림 승인용 화면(production 404). 화풍 × 마감별 소원 5장 + 돌려 보는 카드 하나 + 전체 600 조합.
import { notFound } from 'next/navigation'
import BujeokCard from '@/components/bujeok/BujeokCard'
import BujeokSvg from '@/components/bujeok/BujeokSvg'
import { EL_KEYS, FINISHES, FINISH_LABEL, STYLES, VARIANTS, WISHES, WISH_DEFAULT_EL } from '@/lib/bujeok/keys'
import { WISH_TEXT } from '@/content/bujeok'

export default function BujeokLab() {
  if (process.env.NODE_ENV === 'production') notFound()
  const names = ['민지', '서준', null, '김하늘', '할머니']
  return (
    <main className="mx-auto max-w-[1100px] px-4 py-8">
      <h1 className="font-serif text-2xl font-bold">부적 그림 확인</h1>
      {STYLES.map((style) => (
        <section key={style} className="mt-8">
          <h2 className="font-serif text-lg font-bold">{style === 'trad' ? '전통' : '귀여운'}</h2>
          {FINISHES.map((finish) => (
            <div key={finish} className="mt-4">
              <h3 className="text-sm font-medium text-muted">{FINISH_LABEL[finish]}</h3>
              <div className="mt-2 grid grid-cols-5 gap-3" data-testid={`lab-${style}-${finish}`}>
                {WISHES.map((wish, i) => (
                  <figure key={wish} className="rounded-[22px] bg-[#1c1512] p-3">
                    <BujeokSvg spec={{ style, wish, el: WISH_DEFAULT_EL[wish], variant: i % VARIANTS, finish }} name={names[i]} />
                    <figcaption className="mt-2 text-center text-xs text-[#d8cbb8]">{WISH_TEXT[wish].label}</figcaption>
                  </figure>
                ))}
              </div>
            </div>
          ))}
        </section>
      ))}
      <section className="mt-10">
        <h2 className="font-serif text-lg font-bold">돌려 보는 카드 (빠른 확인)</h2>
        <div className="mx-auto mt-3 max-w-[420px]" data-testid="lab-card">
          <BujeokCard spec={{ style: 'trad', wish: 'money', el: 'metal', variant: 0, finish: 'holo' }} name="민지" from="철수" enter />
        </div>
      </section>
      <section className="mt-10">
        <h2 className="font-serif text-lg font-bold">전체 조합</h2>
        <div className="mt-3 grid grid-cols-10 gap-1">
          {STYLES.flatMap((style) =>
            WISHES.flatMap((wish) =>
              EL_KEYS.flatMap((el) =>
                Array.from({ length: VARIANTS }, (_, variant) =>
                  FINISHES.map((finish) => <BujeokSvg key={`${style}-${wish}-${el}-${variant}-${finish}`} spec={{ style, wish, el, variant, finish }} name="민지" lite />),
                ),
              ),
            ),
          )}
        </div>
      </section>
    </main>
  )
}
