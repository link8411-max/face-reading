import { renderToStaticMarkup } from 'react-dom/server'
import ExampleGallery from '@/components/bujeok/ExampleGallery'
import { WISHES } from '@/lib/bujeok/keys'
import { exampleAlt, exampleSrc } from '@/content/bujeok'

test('서버 HTML에 소원 11개의 금박 예시 img(alt·크기·lazy)와 만들기 링크가 있다', () => {
  const html = renderToStaticMarkup(<ExampleGallery />)
  expect((html.match(/<img /g) ?? []).length).toBe(11)
  for (const w of WISHES) {
    expect(html).toContain(`src="${exampleSrc(w, 'gold')}"`)
    expect(html).toContain(`alt="${exampleAlt(w, 'gold')}"`)
    expect(html).toContain(`href="/bujeok?wish=${w}&amp;style=trad&amp;finish=gold"`)
  }
  expect(html).toContain('width="480"')
  expect(html).toContain('height="1016"')
  expect(html).toContain('loading="lazy"')
})

test('/bujeok 서버 페이지가 예시 갤러리를 가이드 글 위에 그린다', async () => {
  const src = (await import('node:fs')).readFileSync('src/app/(ko)/bujeok/page.tsx', 'utf8')
  expect(src.indexOf('<ExampleGallery />')).toBeGreaterThan(src.indexOf('<BujeokClient'))
  expect(src.indexOf('<ExampleGallery />')).toBeLessThan(src.indexOf('<PageGuide'))
})
