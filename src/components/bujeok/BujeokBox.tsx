'use client'
// 내 부적함(/bujeok/box): 이 기기 브라우저에 모아 둔 부적 링크를 종류별로 보여 준다. 서버 저장 없음.
import { useState } from 'react'
import Link from 'next/link'
import { useBackOrHome } from '@/hooks/useBackOrHome'
import TestHeader from '@/components/test/TestHeader'
import BujeokSvg from './BujeokSvg'
import { useBox } from './useBox'
import { boxItemHref, madeAtLabel, removeFromBox, type BoxItem, type BoxKind } from '@/lib/bujeok/box'
import { giftHeadline, mineHeadline, parseBujeokCode } from '@/lib/bujeok/link'

const GROUPS: { kind: BoxKind; title: string }[] = [
  { kind: 'mine', title: '내 부적' },
  { kind: 'received', title: '받은 부적' },
  { kind: 'sent', title: '보낸 부적' },
]

function titleOf(i: BoxItem): string {
  if (i.kind === 'mine') return mineHeadline(i.to)
  if (i.kind === 'received') return giftHeadline(i.to)
  return i.to ? `${i.to}님께 보낸 부적` : '보낸 부적'
}

const dateOf = (t: number) => {
  const d = new Date(t)
  return `${d.getFullYear()}.${d.getMonth() + 1}.${d.getDate()}`
}
const keyOf = (i: BoxItem) => `${i.kind}|${i.code}|${i.to ?? ''}|${i.from ?? ''}`

const NOTICE = '이 폰에만 저장돼요. 폰을 바꾸거나 기록을 지우면 사라지니, 아끼는 부적은 링크를 따로 보내 두세요.'
const HOME_TIP = '홈 화면에 추가해 두면 앱처럼 바로 열 수 있어요.'

export default function BujeokBox() {
  const goBack = useBackOrHome()
  const items = useBox()
  const [confirming, setConfirming] = useState<string | null>(null)
  const pill = 'h-10 px-4 rounded-full bg-white text-ink border border-line text-sm font-medium'

  return (
    <div className="min-h-screen bg-paper text-ink">
      <main className="mx-auto px-[22px] max-w-lg pb-10">
        <TestHeader title="내 부적함" onBack={goBack} backLabel="돌아가기" />

        {items === undefined ? null : items === null ? (
          <p className="mt-10 text-center text-sm text-muted break-keep">이 브라우저에서는 부적함을 쓸 수 없어요</p>
        ) : items.length === 0 ? (
          <div className="mt-10 text-center">
            <p className="text-[15px] text-ink">아직 모은 부적이 없어요</p>
            <p className="mt-2 text-sm text-muted break-keep">부적을 만들거나 선물을 주고받으면 여기에 모여요.</p>
            <Link href="/bujeok" className="mt-6 inline-flex h-[52px] px-8 rounded-full items-center justify-center bg-accent text-white text-[15px] font-medium">
              부적 만들기
            </Link>
          </div>
        ) : (
          <div className="mt-2 space-y-8">
            {/* 실제 이 기기에 저장된 장수만 센다(만든 것 + 받은 것, 보낸 것은 따로) */}
            <p data-testid="bujeok-box-count" className="font-serif font-bold text-[22px]">
              내 부적 {items.filter((i) => i.kind !== 'sent').length}장
              {items.some((i) => i.kind === 'sent') && <span className="ml-2 text-sm font-normal text-muted">보낸 부적 {items.filter((i) => i.kind === 'sent').length}장</span>}
            </p>
            {GROUPS.map(({ kind, title }) => {
              const list = items.filter((i) => i.kind === kind)
              if (list.length === 0) return null
              return (
                <section key={kind}>
                  <h2 className="font-serif font-bold text-lg">{title}</h2>
                  <ul className="mt-3 grid grid-cols-2 gap-3">
                    {list.map((i) => {
                      const spec = parseBujeokCode(i.code)
                      if (!spec) return null
                      const k = keyOf(i)
                      return (
                        <li key={k} className="rounded-[22px] bg-card border border-line p-3">
                          <Link href={boxItemHref(i)} className="block">
                            <div className="mx-auto w-[64%] max-w-[120px]">
                              <BujeokSvg spec={spec} name={i.to} lite className="block w-full h-auto" />
                            </div>
                            <p className="mt-2 text-[13px] font-medium text-ink break-keep">{titleOf(i)}</p>
                            {i.kind === 'received' && i.from && <p className="text-xs text-muted break-keep">{i.from}님이 보냈어요</p>}
                            <p className="text-xs text-muted">{madeAtLabel(i.madeAt) ? `${madeAtLabel(i.madeAt)} 새김` : dateOf(i.savedAt)}</p>
                          </Link>
                          {confirming === k ? (
                            <div className="mt-2">
                              <p className="text-xs text-ink">이 부적을 지울까요?</p>
                              <div className="mt-1.5 flex gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => {
                                    removeFromBox(i)
                                    setConfirming(null)
                                  }}
                                  className="h-9 px-3 rounded-full bg-accent text-white text-xs font-medium"
                                >
                                  네, 지울게요
                                </button>
                                <button type="button" onClick={() => setConfirming(null)} className="h-9 px-3 rounded-full bg-white text-ink border border-line text-xs font-medium">
                                  취소
                                </button>
                              </div>
                            </div>
                          ) : (
                            <button type="button" onClick={() => setConfirming(k)} className="mt-2 text-xs text-muted underline underline-offset-2">
                              지우기
                            </button>
                          )}
                        </li>
                      )
                    })}
                  </ul>
                </section>
              )
            })}
            <Link href="/bujeok" className={`${pill} inline-flex items-center`}>
              부적 만들기
            </Link>
          </div>
        )}

        {items !== undefined && items !== null && (
          <div className="mt-8 text-xs text-muted leading-relaxed break-keep">
            <p>{NOTICE}</p>
            <p className="mt-1">{HOME_TIP}</p>
          </div>
        )}
      </main>
    </div>
  )
}
