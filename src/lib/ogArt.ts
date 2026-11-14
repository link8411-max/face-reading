// 미리보기 이미지(/api/og)의 ?img= : 우리 그림 경로만 받는다(남의 주소·다른 폴더 금지). 엣지에서도 쓰므로 데이터 import 없이 가볍게.
// 허용: MBTI·띠 미리보기 jpg(<키>-<f|m>-og.jpg), 삼국지 초상화(/images/samguk/<한글 이름>.jpg). 쉼표로 최대 둘.
const ALLOWED = [
  /^\/images\/(mbti|zodiac)\/[a-z]{2,10}-[fm]-og\.jpg$/,
  /^\/images\/samguk\/[가-힣]{1,6}\.jpg$/,
]

export function ogImgParam(v: string | null): string[] {
  if (!v) return []
  return v
    .split(',')
    .slice(0, 2)
    .map((s) => s.trim())
    .filter((s) => ALLOWED.some((re) => re.test(s)))
}

// 페이지 metadata용 주소 만들기. title·subtitle은 한 줄로 짧게(그림 아래 가운데에 크게 들어간다)
export function ogUrl(title: string, subtitle: string, opts: { img?: string[]; cast?: string } = {}): string {
  const e = encodeURIComponent
  let q = `title=${e(title)}&subtitle=${e(subtitle)}`
  if (opts.img?.length) q += `&img=${e(opts.img.slice(0, 2).join(','))}`
  if (opts.cast) q += `&cast=${e(opts.cast)}`
  return `/api/og?${q}`
}
