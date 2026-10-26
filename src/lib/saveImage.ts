// 이미지 저장: iOS(사파리·카카오톡 등 인앱)는 Blob 다운로드가 안 되거나 '파일'로만 가서, 길게 눌러 사진에 저장하는 화면을 띄운다.
export type SaveMethod = 'modal' | 'download'

export function saveMethod(userAgent: string): SaveMethod {
  return /iPhone|iPad|iPod/i.test(userAgent) ? 'modal' : 'download'
}

export function saveImage(blob: Blob, fileName: string): SaveMethod {
  const method = saveMethod(navigator.userAgent)
  const url = URL.createObjectURL(blob)
  if (method === 'modal') {
    const modal = document.createElement('div')
    modal.id = 'ios-save-modal'
    modal.style.cssText = 'position:fixed;inset:0;z-index:9999;background:rgba(46,42,39,0.95);display:flex;flex-direction:column;justify-content:center;align-items:center;padding:20px;'
    modal.innerHTML = `
      <p style="color:#FBF6F1;margin-bottom:15px;font-size:16px;">이미지를 길게 눌러 사진에 저장하세요</p>
      <img src="${url}" alt="" style="max-width:100%;max-height:70vh;border-radius:12px;" />
      <button id="ios-modal-close" style="margin-top:20px;padding:12px 30px;background:#FBF6F1;color:#2E2A27;border:none;border-radius:999px;font-size:16px;font-weight:bold;">닫기</button>
    `
    document.body.appendChild(modal)
    document.getElementById('ios-modal-close')?.addEventListener('click', () => {
      URL.revokeObjectURL(url)
      modal.remove()
    })
    return method
  }
  const a = document.createElement('a')
  a.href = url
  a.download = fileName.endsWith('.png') ? fileName : `${fileName}.png`
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
  return method
}
