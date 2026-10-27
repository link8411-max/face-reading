// 한국 시간(Asia/Seoul) 날짜 YYYY-MM-DD — 시즌 카드·오늘의 MBTI 운세 공용
export const kstDate = (now: Date) =>
  new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Seoul', year: 'numeric', month: '2-digit', day: '2-digit' }).format(now)
