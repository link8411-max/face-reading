// 결과 이미지 캡처에서 뺄 요소: 광고 iframe, no-screenshot 표시(생년월일처럼 공유 이미지에 남기지 않을 정보 포함)
export function captureFilter(node: Node): boolean {
  if (node.nodeName === 'IFRAME') return false
  return !(node as Element).classList?.contains('no-screenshot')
}
