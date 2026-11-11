'use client'
// 완성 화면 아래쪽: 문구 + 버튼. 내 부적: 잠금화면용 저장 · 공유하기 · 선물하기 · 다시 만들기 / 선물: 선물 보내기(주) · 잠금화면용 저장 · 다시 만들기
import type { ReactNode } from 'react'
import Link from 'next/link'
import { Icon } from '@/components/icons'
import { useResultShare } from '@/hooks/useResultShare'
import { useWallpaperSave } from './useWallpaperSave'
import { bujeokGiftUrl, bujeokOgUrl, giftHeadline } from '@/lib/bujeok/link'
import { SITE, UTM } from '@/lib/shareBase'
import type { BujeokSpec } from '@/lib/bujeok/keys'
import { EL_TEXT, WISH_TEXT } from '@/content/bujeok'

const SHARE_TITLE = '운명을 읽다 · 나만의 부적'
const SHARE_TEXT = '소원 하나 골라서 붓으로 그린 부적을 받아 봤어요. 잠금화면으로 저장해 뒀어요.'
const SHARE_IMAGE = `${SITE}/api/og?title=${encodeURIComponent('나만의 부적')}&subtitle=${encodeURIComponent('소원을 붓으로 그려 드려요')}`

export interface GiftInfo { to: string; from: string | null }

export default function BujeokDone({ spec, getSvg, onRetry, gift, ad }: { spec: BujeokSpec; getSvg: () => SVGSVGElement | null; onRetry: () => void; gift?: GiftInfo; ad?: ReactNode }) {
  const text = WISH_TEXT[spec.wish]
  const { saving, saveNotice, save } = useWallpaperSave(spec, getSvg)
  // 내 부적: 공유 링크는 시작 화면(/bujeok)이다. 이름·생년월일·소원은 싣지 않는다.
  // 선물: 받는 사람 이름이 든 선물 링크(bujeokGiftUrl). 카카오톡 카드 이미지는 이름 없는 미리보기 이미지.
  const { busy, notice, share } = useResultShare(
    gift
      ? { testName: 'bujeok', title: SHARE_TITLE, text: giftHeadline(gift.to), url: bujeokGiftUrl(spec, { to: gift.to, from: gift.from ?? undefined }), imageUrl: bujeokOgUrl(spec) }
      : { testName: 'bujeok', title: SHARE_TITLE, text: SHARE_TEXT, url: `${SITE}/bujeok?${UTM('bujeok')}`, imageUrl: SHARE_IMAGE },
  )

  const pill = 'h-12 rounded-full bg-white text-ink border border-line text-sm font-medium flex items-center justify-center gap-1.5 disabled:opacity-50'
  return (
    <div>
      <div className="mt-5 text-center">
        {spec.style === 'trad' && (
          <p className="text-sm text-ink break-keep">
            <span className="font-serif font-bold tracking-wider mr-1.5">{text.hanja}</span>
            <span className="text-muted">{text.hanjaMeaning}</span>
          </p>
        )}
        {!gift && <p className="mt-1.5 text-sm text-ink break-keep">{EL_TEXT[spec.el].line}</p>}
        <p className="mt-1.5 text-sm text-muted break-keep">{text.sub}</p>
      </div>

      {ad}

      <div className="no-screenshot flex flex-col mt-5">
        {gift ? (
          <>
            <button type="button" onClick={() => void share()} disabled={busy} className="h-[52px] rounded-full flex items-center justify-center gap-2 bg-ink text-paper text-[15px] font-medium disabled:opacity-50">
              <Icon name="heart" size={18} />
              {busy ? '보낼 준비 중…' : '선물 보내기'}
            </button>
            {notice && <p role="status" className="mt-2 text-xs text-center text-muted">{notice}</p>}
            <button type="button" onClick={() => void save()} disabled={saving} className={`mt-2 ${pill} h-[52px] text-[15px]`}>
              <Icon name="download" size={18} />
              {saving ? '이미지 만드는 중…' : '잠금화면용 저장'}
            </button>
            {saveNotice && <p role="status" className="mt-2 text-xs text-center text-muted">{saveNotice}</p>}
            <button type="button" onClick={onRetry} className={`mt-2 ${pill}`}>
              <Icon name="refresh" size={16} />
              다시 만들기
            </button>
          </>
        ) : (
          <>
            <button type="button" onClick={() => void save()} disabled={saving} className="h-[52px] rounded-full flex items-center justify-center gap-2 bg-ink text-paper text-[15px] font-medium disabled:opacity-50">
              <Icon name="download" size={18} />
              {saving ? '이미지 만드는 중…' : '잠금화면용 저장'}
            </button>
            {saveNotice && <p role="status" className="mt-2 text-xs text-center text-muted">{saveNotice}</p>}
            <button type="button" onClick={() => void share()} disabled={busy} className={`mt-2 ${pill} h-[52px] text-[15px]`}>
              <Icon name="share" size={18} />
              {busy ? '공유 준비 중…' : '공유하기'}
            </button>
            {notice && <p role="status" className="mt-2 text-xs text-center text-muted">{notice}</p>}
            <div className="grid grid-cols-2 gap-2 mt-2">
              <Link href={`/bujeok?mode=gift&style=${spec.style}`} className={pill}>
                <Icon name="heart" size={16} />
                선물하기
              </Link>
              <button type="button" onClick={onRetry} className={pill}>
                <Icon name="refresh" size={16} />
                다시 만들기
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
