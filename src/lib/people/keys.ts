// 열전 응원·투표의 순수 도우미. 열전 데이터를 가져오지 않아 클라이언트 번들에 안전하다.

/** 두 id를 정렬해 `${x}__${y}` */
export function pairKey(a: string, b: string): string {
  return a <= b ? `${a}__${b}` : `${b}__${a}`
}

/** 한국 날짜 'YYYY-MM-DD' */
export function kstDay(now: Date): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now)
}
