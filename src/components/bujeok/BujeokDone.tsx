'use client'
// 완성 화면 아래쪽: 문구 + 큰 버튼 둘 + 작은 글자 링크 한 줄. 내 부적: 큰 버튼 잠금화면으로 간직하기 · 친구에게도 하나 선물하기 / 작은 줄 내 부적 링크 보내기 · 다시 만들기 · 내 부적함.
// 선물: 큰 버튼 카카오톡으로 보내기(주) · 링크로 보내기 / 작은 줄 그림 저장 · 다시 만들기 · 내 부적함
import { useState, type ReactNode } from 'react'
import Link from 'next/link'
import { Icon } from '@/components/icons'
import { useResultShare } from '@/hooks/useResultShare'
import { shareResult, SHARE_NOTICE, type ShareOutcome } from '@/lib/share'
import { shareKakaoFeed } from '@/lib/kakao'
import { saveImage } from '@/lib/saveImage'
import { track } from '@/lib/analytics'
import { giftKakaoFeed, type KakaoImage } from '@/lib/bujeok/giftShare'
import { useWallpaperSave } from './useWallpaperSave'
import { useGiftImage } from './useGiftImage'
import { addToBox } from '@/lib/bujeok/box'
import { bujeokCode, bujeokGiftUrl, bujeokMineUrl, bujeokOgUrl, giftHeadline } from '@/lib/bujeok/link'
import type { BujeokSpec } from '@/lib/bujeok/keys'
import { EL_TEXT, WISH_TEXT } from '@/content/bujeok'

const SHARE_TITLE = '운명을 읽다 · 나만의 부적'
const MINE_LINK_TEXT = '언제든 다시 열어 볼 수 있어요'

export interface GiftInfo { to: string; from: string | null }

export default function BujeokDone({ spec, getSvg, onRetry, gift, ad, mineName = null }: { spec: BujeokSpec; getSvg: () => SVGSVGElement | null; onRetry: () => void; gift?: GiftInfo; ad?: ReactNode; mineName?: string | null }) {
  const text = WISH_TEXT[spec.wish]
  const { saving, saveNotice, save } = useWallpaperSave(spec, getSvg)
  // 선물: 이름 도장이 찍힌 앞면 그림(1080×1350)을 완성 화면이 뜨면 미리 만들어 두고 공유에 같이 보낸다(카카오톡은 카드 이미지로 올린다)
  const giftImage = useGiftImage(spec, getSvg, !!gift, gift?.to ?? null)

  // 내 부적 링크: 카톡 "나와의 채팅" 등에 보관해 두고 언제든 같은 카드를 다시 연다. 이름은 # 뒤
  const mineLink = useResultShare(
    gift ? null : { testName: 'bujeok', title: SHARE_TITLE, text: MINE_LINK_TEXT, url: bujeokMineUrl(spec, mineName), imageUrl: bujeokOgUrl(spec) },
  )
  // 선물: 받는 사람 이름이 든 선물 링크(bujeokGiftUrl)를 카카오 카드(주)·링크 공유·그림 저장으로 보낸다.
  // 그림 파일은 공유창에 싣지 않는다(카카오톡 등이 그림만 남기고 글·링크를 버린다). 카드 이미지는 올려 둔 그림, 실패·3초 초과면 이름 없는 미리보기 이미지.
  const giftUrl = gift ? bujeokGiftUrl(spec, { to: gift.to, from: gift.from ?? undefined }) : ''
  const [giftBusy, setGiftBusy] = useState<'kakao' | 'link' | 'save' | null>(null)
  const [giftNotice, setGiftNotice] = useState<string | null>(null)
  // 선물은 공유가 실제로 끝났거나 카드가 열렸거나 링크가 복사됐을 때만 "보낸 부적"으로 남긴다(취소·실패는 남기지 않음)
  const remember = () => gift && addToBox({ code: bujeokCode(spec), to: gift.to, from: gift.from, kind: 'sent' })
  const shareLink = async (): Promise<ShareOutcome> => {
    track('share_click', { test_name: 'bujeok', method: 'link' })
    const out = await shareResult({ file: null, title: SHARE_TITLE, text: giftHeadline(gift!.to), url: giftUrl })
    if (out === 'copied') setGiftNotice(SHARE_NOTICE.copied)
    if (out === 'failed') setGiftNotice(SHARE_NOTICE.failed)
    if (out !== 'cancelled' && out !== 'failed') remember()
    return out
  }
  const sendLink = async () => {
    if (giftBusy) return
    setGiftBusy('link')
    setGiftNotice(null)
    try {
      await shareLink()
    } finally {
      setGiftBusy(null)
    }
  }
  const sendKakao = async () => {
    if (giftBusy || !gift) return
    setGiftBusy('kakao')
    setGiftNotice(null)
    try {
      const og: KakaoImage = { url: bujeokOgUrl(spec), width: 1200, height: 630 }
      const image = await giftImage.getKakaoImage(og)
      if (await shareKakaoFeed(giftKakaoFeed({ to: gift.to, wishLabel: text.label, url: giftUrl, image }))) {
        track('share_click', { test_name: 'bujeok', method: 'kakao' })
        remember()
        return
      }
      // 카카오 SDK를 못 쓰면 링크 공유로 이어서 보내고 짧게 알린다
      const out = await shareLink()
      setGiftNotice(out === 'copied' ? '카카오톡을 열지 못해 링크를 복사했어요. 원하는 곳에 붙여 넣어 주세요.' : out === 'failed' ? SHARE_NOTICE.failed : '카카오톡을 열지 못해 링크 공유창으로 보냈어요.')
    } finally {
      setGiftBusy(null)
    }
  }
  const saveGift = async () => {
    if (giftBusy) return
    setGiftBusy('save')
    setGiftNotice(null)
    try {
      const f = await giftImage.getFile()
      if (!f) {
        setGiftNotice('이미지를 만들다 문제가 생겼어요. 잠시 뒤에 다시 해 주세요.')
        return
      }
      saveImage(f, f.name)
      track('share_click', { test_name: 'bujeok', method: 'save_image' })
    } finally {
      setGiftBusy(null)
    }
  }

  const big = 'h-[52px] rounded-full flex items-center justify-center gap-2 text-[15px] font-medium disabled:opacity-50'
  const bigMain = `${big} bg-accent text-white`
  const bigSub = `${big} bg-white text-ink border border-line`
  const linkBtn = 'inline-flex items-center min-h-11 px-2 underline underline-offset-[3px] disabled:opacity-50'
  const dot = <span aria-hidden className="opacity-50">·</span>
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

      <div className="no-screenshot flex flex-col mt-5">
        {gift ? (
          <>
            <button type="button" onClick={() => void sendKakao()} disabled={!!giftBusy} className={bigMain}>
              <Icon name="heart" size={18} />
              카카오톡으로 보내기
            </button>
            <button type="button" onClick={() => void sendLink()} disabled={!!giftBusy} className={`mt-2 ${bigSub}`}>
              <Icon name="share" size={18} />
              링크로 보내기
            </button>
            {giftBusy === 'kakao' && <p className="mt-2 text-xs text-center text-muted">카카오톡 보낼 준비 중…</p>}
            {giftNotice && <p role="status" className="mt-2 text-xs text-center text-muted">{giftNotice}</p>}
            <div className="bj-linkrow">
              <button type="button" onClick={() => void saveGift()} disabled={!!giftBusy} className={linkBtn}>그림 저장</button>
              {dot}
              <button type="button" onClick={onRetry} className={linkBtn}>다시 만들기</button>
              {dot}
              <Link href="/bujeok/box" className={linkBtn}>내 부적함</Link>
            </div>
          </>
        ) : (
          <>
            <button type="button" onClick={() => void save()} disabled={saving} className={bigMain}>
              <Icon name="download" size={18} />
              {saving ? '이미지 만드는 중…' : '잠금화면으로 간직하기'}
            </button>
            {saveNotice && <p role="status" className="mt-2 text-xs text-center text-muted">{saveNotice}</p>}
            <Link href={`/bujeok?mode=gift&style=${spec.style}&finish=${spec.finish}`} className={`mt-2 ${bigSub}`}>
              <Icon name="heart" size={18} />
              친구에게도 하나 선물하기
            </Link>
            <div className="bj-linkrow">
              <button type="button" onClick={() => void mineLink.share()} disabled={mineLink.busy} className={linkBtn}>
                {mineLink.busy ? '링크 만드는 중…' : '내 부적 링크 보내기'}
              </button>
              {dot}
              <button type="button" onClick={onRetry} className={linkBtn}>다시 만들기</button>
              {dot}
              <Link href="/bujeok/box" className={linkBtn}>내 부적함</Link>
            </div>
            {mineLink.notice && <p role="status" className="mt-1 text-xs text-center text-muted">{mineLink.notice}</p>}
          </>
        )}
      </div>

      {/* 광고는 버튼 아래: 보내기·저장이 광고에 밀려 내려가지 않게 */}
      {ad}
    </div>
  )
}
