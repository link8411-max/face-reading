import type { Metadata } from 'next'

const SITE = 'https://unse-ai.com'
const TITLE = '밈 능력고사 | 신조어·밈·레트로 유행어 테스트, 매일 5문제 – 운명을 읽다'
const DESCRIPTION = '매일 5문제, 신조어와 밈과 레트로 유행어를 얼마나 아는지 풀어 보는 능력고사예요. 문제마다 뜻과 쓰임, 유래를 알려 주고 성적통지표를 친구와 겨뤄 볼 수 있어요.'
const IMAGE = `/api/og?title=${encodeURIComponent('밈 능력고사')}&subtitle=${encodeURIComponent('매일 5문제, 내 등급은?')}&cast=dokkaebi`

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: `${SITE}/exam/meme` },
  openGraph: { title: TITLE, description: DESCRIPTION, type: 'website', locale: 'ko_KR', siteName: '운명을 읽다', url: `${SITE}/exam/meme`, images: [{ url: IMAGE, width: 1200, height: 630 }] },
  twitter: { card: 'summary_large_image', title: TITLE, description: DESCRIPTION, images: [IMAGE] },
}

export default function ExamMemeLayout({ children }: { children: React.ReactNode }) {
  return children
}
