// 결과 카드 DOM → PNG (modern-screenshot). 배경색은 주지 않는다(카드가 자기 배경을 가진다). 광고 iframe은 뺀다.
export async function captureBlob(el: HTMLElement): Promise<Blob | null> {
  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)
  const { domToBlob } = await import('modern-screenshot')
  return domToBlob(el, { scale: isMobile ? 2 : 2.5, filter: (node) => !(node instanceof HTMLIFrameElement) })
}
