import { existsSync } from 'node:fs'
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
