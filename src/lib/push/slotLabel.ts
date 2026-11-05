// 알림 시각 표시 문구. 클라이언트에서 쓰므로 서버 전용 모듈(send.ts)을 가져오지 않는다.
export function formatSlot(hhmm: string): string {
  const [h, m] = hhmm.split(':').map(Number)
  const part = h < 11 ? '아침' : h < 14 ? '낮' : h < 18 ? '오후' : h < 21 ? '저녁' : '밤'
  const h12 = h > 12 ? h - 12 : h
  return `${part} ${h12}시${m === 30 ? ' 30분' : ''}`
}

function kstHHMM(now: Date): string {
  return new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Seoul', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(now)
}

export function nextDeliveryWord(hhmm: string, now: Date): '오늘' | '내일' {
  return kstHHMM(now) < hhmm ? '오늘' : '내일'
}
