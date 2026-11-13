import { existsSync, readdirSync } from 'node:fs'
import { portraitThumb } from '@/lib/portraitThumb'

test('초상화 경로는 작은 판으로 바뀐다', () => {
  expect(portraitThumb('/images/samguk/관우.jpg')).toBe('/images/samguk/thumb/관우.webp')
  expect(portraitThumb(encodeURI('/images/samguk/관우.jpg'))).toBe(encodeURI('/images/samguk/thumb/관우.webp'))
})

test('초상화가 아닌 경로는 그대로', () => {
  expect(portraitThumb('/images/animal/cat.png')).toBe('/images/animal/cat.png')
  expect(portraitThumb('/images/samguk/sprites/a.png')).toBe('/images/samguk/sprites/a.png')
})

test('모든 초상화에 작은 판이 있다', () => {
  const jpgs = readdirSync('public/images/samguk').filter((f) => f.endsWith('.jpg'))
  for (const f of jpgs) expect(existsSync(`public/images/samguk/thumb/${f.replace(/\.jpg$/, '.webp')}`), f).toBe(true)
})
