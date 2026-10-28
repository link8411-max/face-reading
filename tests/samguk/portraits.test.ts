import { existsSync, readFileSync } from 'node:fs'
import { samgukCharacters, PENDING_PORTRAIT_IDS, allSamgukCharacters } from '@/lib/samgukDB'

test('결과에 나오는 장수는 모두 초상화가 있다', () => {
  for (const c of samgukCharacters) expect(existsSync(`public/images/samguk/${c.name}.jpg`), c.name).toBe(true)
})

test('초상화를 기다리는 장수는 결과에 나오지 않고, 그림이 들어오면 숨김을 푼다', () => {
  for (const id of PENDING_PORTRAIT_IDS) {
    const c = allSamgukCharacters.find((x) => x.id === id)!
    expect(c, id).toBeDefined()
    expect(samgukCharacters.some((x) => x.id === id), id).toBe(false)
    expect(existsSync(`public/images/samguk/${c.name}.jpg`), `${c.name} 그림이 들어왔으면 PENDING_PORTRAIT_IDS에서 지우기`).toBe(false)
  }
})

// JPEG SOF 마커에서 가로·세로를 읽는다
function jpegSize(buf: Buffer): [number, number] {
  let i = 2
  while (i < buf.length) {
    const marker = buf[i + 1]
    const len = buf.readUInt16BE(i + 2)
    if (marker >= 0xc0 && marker <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(marker)) return [buf.readUInt16BE(i + 7), buf.readUInt16BE(i + 5)]
    i += 2 + len
  }
  return [0, 0]
}

test('초상화는 1024 안팎 거의 정사각형(기존 그림 일부는 960~1024)이고 결과 화면이 느려지지 않게 400KB 이하다', () => {
  for (const c of samgukCharacters) {
    const buf = readFileSync(`public/images/samguk/${c.name}.jpg`)
    const [w, h] = jpegSize(buf)
    expect(Math.max(w, h), c.name).toBe(1024)
    expect(Math.min(w, h), c.name).toBeGreaterThanOrEqual(960)
    expect(buf.length / 1024, c.name).toBeLessThanOrEqual(410)
  }
})
