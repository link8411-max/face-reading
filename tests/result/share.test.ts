import { shareResult, SHARE_NOTICE } from '@/lib/share'

const file = new File([new Uint8Array([1])], '결과.png', { type: 'image/png' })
const meta = { title: '나의 동물상', text: '나는 여우상이래요', url: 'https://unse-ai.com/animal' }

test('이미지 공유가 되면 이미지와 문구·주소를 함께 보낸다', async () => {
  const sent: ShareData[] = []
  const out = await shareResult({ file, ...meta }, { canShare: () => true, share: async (d) => { sent.push(d) } }, async () => {})
  expect(out).toBe('shared_image')
  expect(sent).toHaveLength(1)
  expect(sent[0].files![0].type).toBe('image/png')
  expect(sent[0].text).toContain('https://unse-ai.com/animal')
})

test('이미지 공유는 안 되고 공유창은 있으면 링크와 문구만 공유한다', async () => {
  const sent: ShareData[] = []
  const out = await shareResult({ file, ...meta }, { canShare: () => false, share: async (d) => { sent.push(d) } }, async () => {})
  expect(out).toBe('shared_link')
  expect(sent).toEqual([{ title: meta.title, text: meta.text, url: meta.url }])
})

test('공유창이 없으면 문구와 주소를 복사한다', async () => {
  const copied: string[] = []
  const out = await shareResult({ file, ...meta }, {}, async (t) => { copied.push(t) })
  expect(out).toBe('copied')
  expect(copied).toEqual([`${meta.text} ${meta.url}`])
  expect(SHARE_NOTICE.copied).toContain('복사')
})

test('사용자가 취소하면 다른 방법을 시도하지 않는다', async () => {
  const copied: string[] = []
  let calls = 0
  const abort = Object.assign(new Error('x'), { name: 'AbortError' })
  const out = await shareResult({ file, ...meta }, { canShare: () => true, share: async () => { calls++; throw abort } }, async (t) => { copied.push(t) })
  expect(out).toBe('cancelled')
  expect(calls).toBe(1)
  expect(copied).toEqual([])
})

test('이미지 공유가 거절되면(NotAllowed 등) 링크 공유로 넘어간다', async () => {
  const sent: ShareData[] = []
  const out = await shareResult({ file, ...meta }, {
    canShare: () => true,
    share: async (d) => { if (d.files) throw Object.assign(new Error('x'), { name: 'NotAllowedError' }); sent.push(d) },
  }, async () => {})
  expect(out).toBe('shared_link')
  expect(sent[0].url).toBe(meta.url)
})

test('이미지가 없어도(캡처 실패) 링크 공유는 된다', async () => {
  const sent: ShareData[] = []
  expect(await shareResult({ file: null, ...meta }, { canShare: () => true, share: async (d) => { sent.push(d) } }, async () => {})).toBe('shared_link')
})

test('복사도 실패하면 failed', async () => {
  expect(await shareResult({ file, ...meta }, {}, async () => { throw new Error('denied') })).toBe('failed')
  expect(SHARE_NOTICE.failed).toContain('이미지 저장')
})
