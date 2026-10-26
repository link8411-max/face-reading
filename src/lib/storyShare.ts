// 스토리에 올리기: 파일 공유(Web Share)를 지원하면 공유 창을 열고, 아니면 이미지를 저장한 뒤 안내한다.
// 카카오톡 인앱 브라우저·PC처럼 파일 공유가 안 되는 곳에서도 버튼이 아무 일도 안 하는 일이 없게 한다.

export type ShareOutcome = 'shared' | 'saved' | 'cancelled'

export const STORY_SAVED_NOTICE = '이미지를 저장했어요. 인스타그램 스토리에서 불러와 올려 주세요.'

type ShareNav = { canShare?: (data: ShareData) => boolean; share?: (data: ShareData) => Promise<void> }

export async function shareOrSave(file: File, save: (f: File) => void, nav: ShareNav | undefined = globalThis.navigator): Promise<ShareOutcome> {
  if (nav?.share && nav.canShare?.({ files: [file] })) {
    try {
      await nav.share({ files: [file] })
      return 'shared'
    } catch (e) {
      if ((e as Error).name === 'AbortError') return 'cancelled'
    }
  }
  save(file)
  return 'saved'
}

export function downloadFile(file: File) {
  const url = URL.createObjectURL(file)
  const a = document.createElement('a')
  a.href = url
  a.download = file.name
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
