// 삼국지 초상화 작은 판 경로. 작은 자리(가로 200px 이하)에서 쓴다. 판은 scripts/make-portrait-thumbs.mjs가 만든다.
const PORTRAIT = /^\/images\/samguk\/([^/]+)\.jpg$/

/** `/images/samguk/<이름>.jpg` → `/images/samguk/thumb/<이름>.webp`. 그 밖의 경로는 그대로. 받은 형태(인코딩 여부)를 유지한다. */
export function portraitThumb(src: string): string {
  let decoded: string
  try { decoded = decodeURI(src) } catch { return src }
  const m = PORTRAIT.exec(decoded)
  if (!m) return src
  const out = `/images/samguk/thumb/${m[1]}.webp`
  return decoded === src ? out : encodeURI(out)
}
