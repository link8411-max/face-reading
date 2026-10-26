// 이미지 저장 방식
// - iOS(사파리 포함): Blob 다운로드가 '파일' 앱으로만 가서 스토리 사진 선택에 안 보인다
// - 인앱 브라우저(카카오톡·인스타그램·네이버·페이스북·라인): 안드로이드에서도 blob 다운로드가 "지원하지 않는 파일 형식"으로 실패한다
// 이 경우 이미지를 화면에 띄워 길게 눌러 저장하게 한다. blob 주소 대신 data 주소를 써서 길게 눌러 저장할 때도 형식 오류가 없게 한다.
export type SaveMethod = 'modal' | 'download'

const IN_APP = /KAKAOTALK|Instagram|NAVER\(inapp|FBAN|FBAV|Line\/|everytimeApp|DaumApps/i

export function isInAppBrowser(userAgent: string): boolean {
  return IN_APP.test(userAgent)
}

export function saveMethod(userAgent: string): SaveMethod {
  return /iPhone|iPad|iPod/i.test(userAgent) || isInAppBrowser(userAgent) ? 'modal' : 'download'
}

// 카카오톡 인앱이면 기본 브라우저(크롬·사파리)로 같은 페이지를 여는 주소. 그 밖의 인앱은 공식 방법이 없어 null
export function externalOpenUrl(userAgent: string, pageUrl: string): string | null {
  return /KAKAOTALK/i.test(userAgent) ? `kakaotalk://web/openExternal?url=${encodeURIComponent(pageUrl)}` : null
}

export function saveImage(blob: Blob, fileName: string): SaveMethod {
  const ua = navigator.userAgent
  const method = saveMethod(ua)
  if (method === 'modal') {
    showSaveModal(blob, ua)
    return method
  }
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = fileName.endsWith('.png') ? fileName : `${fileName}.png`
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
  return method
}

function showSaveModal(blob: Blob, ua: string) {
  document.getElementById('ios-save-modal')?.remove()
  const modal = document.createElement('div')
  modal.id = 'ios-save-modal'
  modal.setAttribute('role', 'dialog')
  modal.setAttribute('aria-label', '이미지 저장')
  modal.style.cssText = 'position:fixed;inset:0;z-index:9999;background:rgba(46,42,39,0.95);display:flex;flex-direction:column;justify-content:center;align-items:center;padding:20px;gap:14px;'
  const msg = document.createElement('p')
  msg.style.cssText = 'color:#FBF6F1;font-size:16px;text-align:center;margin:0;'
  msg.textContent = '이미지를 길게 눌러 저장하세요'
  const img = document.createElement('img')
  img.alt = '결과 이미지'
  img.style.cssText = 'max-width:100%;max-height:62vh;border-radius:12px;'
  const reader = new FileReader()
  reader.onload = () => { img.src = String(reader.result) }
  reader.readAsDataURL(blob)
  const row = document.createElement('div')
  row.style.cssText = 'display:flex;gap:8px;'
  const btn = (label: string, primary: boolean) => {
    const b = document.createElement('button')
    b.type = 'button'
    b.textContent = label
    b.style.cssText = `padding:12px 22px;border-radius:999px;font-size:15px;font-weight:bold;border:1px solid #FBF6F1;${primary ? 'background:#FBF6F1;color:#2E2A27;' : 'background:transparent;color:#FBF6F1;'}`
    return b
  }
  const external = externalOpenUrl(ua, location.href)
  if (external) {
    const open = btn('다른 브라우저로 열기', false)
    open.addEventListener('click', () => { location.href = external })
    row.appendChild(open)
  }
  const close = btn('닫기', true)
  close.id = 'ios-modal-close'
  close.addEventListener('click', () => modal.remove())
  row.appendChild(close)
  modal.append(msg, img, row)
  document.body.appendChild(modal)
}
