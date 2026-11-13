'use client'
// 선물 착지 화면: 닫힌 상태("○○님께 부적이 도착했어요") + 도장 찍기(BujeokRite) → 찍으면 카드가 돌며 나타난다.
// 이름은 링크 해시(#to=…)에서 마운트 뒤에 읽는다(서버·GA로 가지 않는다). me=1(mine)이면 "열어 보기" 없이 바로 카드가 나온다.
import { useEffect, useRef, useState, type ReactNode } from 'react'
import Link from 'next/link'
import { Icon } from '@/components/icons'
import BujeokCard from './BujeokCard'
import BujeokRite from './BujeokRite'
import { useWallpaperSave } from './useWallpaperSave'
import { useNameHash } from './useNameHash'
import { track } from '@/lib/analytics'
import { addToBox } from '@/lib/bujeok/box'
import { useBox } from './useBox'
import { kstDate } from '@/lib/kst'
import { bujeokCode, giftHeadline, mineHeadline, parseNameHash } from '@/lib/bujeok/link'
import type { BujeokSpec } from '@/lib/bujeok/keys'
import { WISH_TEXT } from '@/content/bujeok'

const big = 'h-[52px] rounded-full flex items-center justify-center gap-2 text-[15px] font-medium disabled:opacity-50'
const linkBtn = 'inline-flex items-center min-h-11 px-2 underline underline-offset-[3px]'

export default function GiftLanding({ spec, mine = false, ad }: { spec: BujeokSpec; mine?: boolean; ad?: ReactNode }) {
  const { to, from } = useNameHash()
  const [opened, setOpened] = useState(mine)
  const headline = mine ? mineHeadline(to) : giftHeadline(to)
  const panel = useRef<HTMLDivElement>(null)
  const { saving, saveNotice, save } = useWallpaperSave(spec, () => panel.current?.querySelector('[data-bujeok-art] svg') ?? null)
  const text = WISH_TEXT[spec.wish]
  // 새긴 날: 받은 선물은 도장을 찍은 날, 내 부적 링크는 이 기기 부적함에 남은 날짜(없으면 줄을 뺀다)
  const [stampedAt, setMadeAt] = useState<string | null>(null)
  const box = useBox()
  const madeAt = stampedAt ?? (mine ? (box?.find((i) => i.kind === 'mine' && i.code === bujeokCode(spec) && i.to === to)?.madeAt ?? null) : null)

  // 도장을 찍는 순간이 "내 것이 되는 순간": 그날을 이 기기 부적함에 새긴 날로 남긴다(링크·서버로는 보내지 않는다)
  const onStamped = () => {
    const today = kstDate(new Date())
    setMadeAt(today)
    setOpened(true)
    const n = parseNameHash(window.location.hash)
    addToBox({ code: bujeokCode(spec), to: n.to, from: n.from, kind: 'received', madeAt: today })
  }

  useEffect(() => {
    track('shared_landing', { test_name: 'bujeok', result_id: `${spec.style}_${spec.wish}` })
  }, [spec.style, spec.wish])

  // 받은 선물은 부적함에 남긴다(이름은 이 기기 안에만). 내 부적 링크(me=1)는 남의 것일 수 있어 저장하지 않는다
  useEffect(() => {
    if (mine) return
    const n = parseNameHash(window.location.hash)
    addToBox({ code: bujeokCode(spec), to: n.to, from: n.from, kind: 'received' })
  }, [mine, spec])

  return (
    <main className="mx-auto px-[22px] max-w-lg pt-8 pb-10 min-h-screen text-ink">
      {opened ? (
        <div>
          <h1 className="font-serif font-bold text-[24px] leading-[1.4] text-center break-keep">{headline}</h1>
          {!mine && from && <p className="mt-1 text-sm text-center text-muted">{from}님이 보냈어요</p>}
          <div ref={panel} className="mx-auto mt-4 max-w-[420px]">
            <BujeokCard spec={spec} name={to} from={mine ? null : from} madeAt={madeAt} enter />
          </div>
          <div className="mt-5 text-center">
            {spec.style === 'trad' && (
              <p className="text-sm text-ink break-keep">
                <span className="font-serif font-bold tracking-wider mr-1.5">{text.hanja}</span>
                <span className="text-muted">{text.hanjaMeaning}</span>
              </p>
            )}
            <p className="mt-1.5 text-sm text-muted break-keep">{text.sub}</p>
          </div>
          {ad}
          <div className="no-screenshot flex flex-col mt-5">
            <button type="button" onClick={() => void save()} disabled={saving} className={`${big} bg-ink text-paper`}>
              <Icon name="download" size={18} />
              {saving ? '이미지 만드는 중…' : '잠금화면으로 간직하기'}
            </button>
            {saveNotice && <p role="status" className="mt-2 text-xs text-center text-muted">{saveNotice}</p>}
            <Link href={`/bujeok?mode=gift&style=${spec.style}&finish=${spec.finish}`} className={`mt-2 ${big} bg-card text-ink border border-line`}>
              <Icon name="heart" size={18} />
              {mine ? '친구에게도 하나 선물하기' : '나도 하나 보내기'}
            </Link>
            <div className="bj-linkrow">
              {!mine && (
                <>
                  <Link href={`/bujeok?wish=${spec.wish}&style=${spec.style}&finish=${spec.finish}`} className={linkBtn}>내 부적 만들기</Link>
                  <span aria-hidden className="opacity-50">·</span>
                </>
              )}
              <Link href="/bujeok/box" className={linkBtn}>내 부적함</Link>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center pt-4">
          <p className="text-sm text-muted">운명을 읽다</p>
          <h1 className="mt-3 font-serif font-bold text-[27px] leading-[1.4] break-keep">{headline}</h1>
          {from && <p className="mt-2 text-sm text-muted">{from}님이 보냈어요</p>}
          <p className="mt-3 mb-5 text-sm text-muted break-keep">도장을 찍으면 열려요. 열면 손으로 돌려 볼 수 있고, 잠금화면에 저장해 둘 수도 있어요.</p>
          <div className="mx-auto max-w-[420px]">
            <BujeokRite spec={spec} name={to} steps="seal" onDone={onStamped} />
          </div>
        </div>
      )}
    </main>
  )
}
