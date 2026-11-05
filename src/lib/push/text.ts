import type { DailyFortune } from '@/lib/dailyEngine'

export interface PushPayload { title: string; body: string; url: string; tag: 'daily-fortune' }

export function buildPayload(f: DailyFortune): PushPayload {
  const gz = f.나.년주표기 ?? ''
  const stars = '★'.repeat(f.별점) + '☆'.repeat(5 - f.별점)
  return {
    title: `${f.나.띠이모지} ${gz}년 ${f.나.띠}띠 오늘 운세 ${stars}`,
    body: `${f.한마디}\n행운 시간 ${f.행운.시간}`,
    url: `/fortune/daily?gz=${encodeURIComponent(gz)}&utm_source=push&utm_medium=web_push&utm_campaign=daily`,
    tag: 'daily-fortune',
  }
}
