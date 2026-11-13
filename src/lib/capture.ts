// 결과 이미지 캡처에서 뺄 요소: 광고 iframe, no-screenshot 표시(생년월일처럼 공유 이미지에 남기지 않을 정보 포함)
export function captureFilter(node: Node): boolean {
  if (node.nodeName === 'IFRAME') return false
  return !(node as Element).classList?.contains('no-screenshot')
}

// 결과 카드는 공개 움직임(원이 열리고 캐릭터가 튀어나옴)이 끝난 모습이어야 한다.
// 캡처 요소 안의 한 번짜리 움직임이 끝나길 기다린 뒤(최대 maxMs) 그 요소에 motion-settled를 붙여 둔다.
// 문서 전체에 붙였다 떼면 끝난 움직임이 처음부터 다시 재생되므로(결과가 사라졌다 다시 나타남) 떼지 않는다.
// 움직임이 끝난 뒤 animation을 없애면 평소 스타일(=끝 모습)이 그대로라 화면은 바뀌지 않는다.
export async function settleMotion(el: Element, maxMs = 2500): Promise<void> {
  const anims = (el.getAnimations?.({ subtree: true }) ?? []).filter((a) => (a.effect?.getTiming().iterations ?? 1) !== Infinity)
  await Promise.race([
    Promise.all(anims.map((a) => a.finished.catch(() => undefined))),
    new Promise((r) => setTimeout(r, maxMs)),
  ])
  el.classList.add('motion-settled')
  await waitForImages(el)
  await new Promise<void>((r) => requestAnimationFrame(() => requestAnimationFrame(() => r())))
}

// 카드 안 그림이 모두 불러와질 때까지 기다린다(최대 maxMs). 큰 그림이 덜 불러와진 채 찍으면 빈 칸이 된다. 실패해도 캡처는 진행한다.
export async function waitForImages(el: Element, maxMs = 3000): Promise<void> {
  const imgs = [...el.querySelectorAll('img')] as HTMLImageElement[]
  const pending = imgs.filter((i) => !(i.complete && i.naturalWidth > 0))
  if (pending.length === 0) return
  await Promise.race([
    Promise.all(pending.map((i) => new Promise<void>((r) => { i.addEventListener('load', () => r(), { once: true }); i.addEventListener('error', () => r(), { once: true }) }))),
    new Promise((r) => setTimeout(r, maxMs)),
  ])
}
