import { renderToStaticMarkup } from 'react-dom/server'
import GuansangResultView from '@/components/face/GuansangResultView'
import { BALANCED_CHIP, DISCLAIMER, FOREHEAD_NOTE, GUANSANG_TYPES, LABEL_COPY, SHAPE_COPY, ZONE_COPY } from '@/content/guansang'
import type { GuansangResult } from '@/lib/face/guansang'

const base: GuansangResult = {
  type: 'earth-mid', shape: 'earth', zone: 'mid', balanced: false, foreheadUncertain: false,
  palaces: [
    { key: 'money', label: 'strong', z: 1 }, { key: 'work', label: 'even', z: 0 }, { key: 'love', label: 'even', z: 0 },
    { key: 'people', label: 'grow', z: -1 }, { key: 'base', label: 'even', z: 0 },
  ],
}
const render = (r: GuansangResult) => renderToStaticMarkup(<GuansangResultView result={r} />)

test('별명·칩 2개·자리 5줄·안내문', () => {
  const html = render(base)
  expect(html).toContain(GUANSANG_TYPES['earth-mid'].nickname)
  expect(html).toContain(SHAPE_COPY.earth.easy)
  expect(html).toContain(ZONE_COPY.mid.easy)
  expect(html).not.toContain(BALANCED_CHIP)
  expect(html.match(/rounded-full px-3 py-1\.5/g)).toHaveLength(2)
  expect(html.match(/<span class="font-bold text-accent">/g)).toHaveLength(5)
  expect(html).toContain(LABEL_COPY.grow)
  expect(html).toContain(DISCLAIMER)
  expect(html).not.toContain(FOREHEAD_NOTE)
})

test('조심할 점 블록은 no-screenshot', () => {
  const html = render(base)
  expect(html).toMatch(/<section class="no-screenshot[^"]*"[^>]*><h3[^>]*>조심할 점/)
})

test('이마가 불확실하면 안내, balanced면 칩 3개', () => {
  expect(render({ ...base, foreheadUncertain: true })).toContain(FOREHEAD_NOTE)
  const html = render({ ...base, balanced: true })
  expect(html).toContain(BALANCED_CHIP)
  expect(html.match(/rounded-full px-3 py-1\.5/g)).toHaveLength(3)
})
