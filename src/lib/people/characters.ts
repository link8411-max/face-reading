// 열전 코드 전용 인물 조회. 초상화 대기 인물도 포함한다(samgukDB의 getCharacterById는 대기 인물이 빠진다).
import { allSamgukCharacters, type SamgukCharacter } from '@/lib/samgukDB'

const BY_ID = new Map<string, SamgukCharacter>(allSamgukCharacters.map((c) => [c.id, c]))

export function characterById(id: string): SamgukCharacter | undefined {
  return BY_ID.get(id)
}
