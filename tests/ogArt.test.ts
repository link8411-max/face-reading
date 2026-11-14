import { existsSync } from 'node:fs'
import { ogImgParam, ogUrl } from '@/lib/ogArt'
import { mbtiOgPath, MBTI_SLUGS } from '@/content/mbtiTypes'
import { zodiacOgPath, ZODIAC_SLUGS } from '@/content/fortune2027Zodiac'
import { MBTI_TYPES } from '@/lib/mbti/compat'

const imgOf = (url: string) => ogImgParam(new URL(url, 'https://unse-ai.com').searchParams.get('img'))

test('?img= 는 우리 그림 경로만, 최대 둘', () => {
  expect(ogImgParam('/images/mbti/isfj-f-og.jpg,/images/mbti/isfj-m-og.jpg')).toHaveLength(2)
  expect(ogImgParam('/images/samguk/관우.jpg')).toEqual(['/images/samguk/관우.jpg'])
  for (const bad of ['https://evil.com/a.jpg', '/images/../secret.jpg', '/images/mbti/isfj.webp', '//evil.com/x.jpg', '/images/samguk/a.jpg', '/api/og']) {
    expect(ogImgParam(bad), bad).toEqual([])
  }
  expect(ogImgParam('/images/mbti/isfj-f-og.jpg,/images/mbti/infp-f-og.jpg,/images/mbti/entj-f-og.jpg')).toHaveLength(2)
  expect(ogImgParam(null)).toEqual([])
})

test('MBTI·띠 미리보기는 그 유형·띠의 남녀 그림 둘이고 파일이 있다', () => {
  for (const t of MBTI_TYPES) {
    const imgs = imgOf(mbtiOgPath(t))
    expect(imgs).toEqual([`/images/mbti/${t.toLowerCase()}-f-og.jpg`, `/images/mbti/${t.toLowerCase()}-m-og.jpg`])
    for (const p of imgs) expect(existsSync(`public${p}`), p).toBe(true)
  }
  expect(MBTI_SLUGS).toHaveLength(16)
  for (const z of ZODIAC_SLUGS) {
    const imgs = imgOf(zodiacOgPath(z))
    expect(imgs).toHaveLength(2)
    for (const p of imgs) expect(existsSync(`public${p}`), p).toBe(true)
  }
})

test('ogUrl: 제목·부제는 encodeURIComponent, 그림은 쉼표로', () => {
  expect(ogUrl('관우 열전', '자 운장', { img: ['/images/samguk/관우.jpg'] })).toBe(`/api/og?title=${encodeURIComponent('관우 열전')}&subtitle=${encodeURIComponent('자 운장')}&img=${encodeURIComponent('/images/samguk/관우.jpg')}`)
})
