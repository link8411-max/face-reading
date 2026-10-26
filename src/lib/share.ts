// 공유하기: 휴대폰 기본 공유창으로 결과 이미지·문구·주소를 보낸다.
// 이미지 공유가 안 되면 링크·문구만, 공유창이 없으면(PC·일부 인앱) 링크를 복사한다. 버튼이 아무 일도 안 하는 경우가 없게 한다.

export type ShareOutcome = 'shared_image' | 'shared_link' | 'copied' | 'cancelled' | 'failed'

export const SHARE_NOTICE = {
  copied: '링크를 복사했어요. 원하는 곳에 붙여 넣어 공유해 주세요.',
  failed: '공유하지 못했어요. 이미지 저장을 눌러 주세요.',
} as const

type ShareNav = { canShare?: (data: ShareData) => boolean; share?: (data: ShareData) => Promise<void> }
type Copy = (text: string) => Promise<void>

const isAbort = (e: unknown) => (e as Error)?.name === 'AbortError'

export async function shareResult(
  { file, title, text, url }: { file: File | null; title: string; text: string; url: string },
  nav: ShareNav | undefined = globalThis.navigator,
  copy: Copy = (t) => navigator.clipboard.writeText(t),
): Promise<ShareOutcome> {
  if (file && nav?.share && nav.canShare?.({ files: [file] })) {
    try {
      // 파일과 함께 보내면 url이 빠지는 앱이 있어 주소를 문구에 붙인다
      await nav.share({ files: [file], title, text: `${text} ${url}` })
      return 'shared_image'
    } catch (e) {
      if (isAbort(e)) return 'cancelled'
    }
  }
  if (nav?.share) {
    try {
      await nav.share({ title, text, url })
      return 'shared_link'
    } catch (e) {
      if (isAbort(e)) return 'cancelled'
    }
  }
  try {
    await copy(`${text} ${url}`)
    return 'copied'
  } catch {
    return 'failed'
  }
}
