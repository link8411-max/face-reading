// 결과 이미지 캡처에서 뺄 요소: 광고 iframe, no-screenshot 표시(생년월일처럼 공유 이미지에 남기지 않을 정보 포함)
export function captureFilter(node: Node): boolean {
  if (node.nodeName === 'IFRAME') return false
  return !(node as Element).classList?.contains('no-screenshot')
}

// 결과 카드는 공개 움직임(원이 열리고 캐릭터가 튀어나옴)이 끝난 모습이어야 한다.
// 캡처하는 동안 문서에 no-motion을 붙여 움직임을 끄고, 두 프레임 기다린 뒤 캡처한다. 실패해도 반드시 뗀다.
export async function withNoMotion<T>(run: () => Promise<T>): Promise<T> {
  const root = document.documentElement
  root.classList.add('no-motion')
  try {
    await new Promise<void>((r) => requestAnimationFrame(() => requestAnimationFrame(() => r())))
    return await run()
  } finally {
    root.classList.remove('no-motion')
  }
}
