// 한국 시간(Asia/Seoul) 날짜 YYYY-MM-DD — 시즌 카드·오늘의 MBTI 운세 공용
export const kstDate = (now: Date) =>
  new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Seoul', year: 'numeric', month: '2-digit', day: '2-digit' }).format(now)

// 열어 둔 탭이 자정을 넘긴 뒤 다시 보이면(탭 전환·뒤로 가기 복원) 오늘 날짜로 다시 맞춘다. 정리 함수를 돌려준다
export function onDayMaybeChanged(update: () => void): () => void {
  const onVisible = () => { if (document.visibilityState !== 'hidden') update() }
  document.addEventListener('visibilitychange', onVisible)
  window.addEventListener('pageshow', update)
  window.addEventListener('focus', update)
  return () => {
    document.removeEventListener('visibilitychange', onVisible)
    window.removeEventListener('pageshow', update)
    window.removeEventListener('focus', update)
  }
}
