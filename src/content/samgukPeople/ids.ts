// 열전이 있는 인물 id 목록. 클라이언트 번들(닮은꼴 결과)에서 열전 본문 없이 존재 여부만 확인하려고 따로 둔다.
// 이 파일은 인물 파일을 import하지 않는다. index.ts에 인물을 등록하면 여기에도 같은 id를 추가할 것
// (tests/peopleLinks.test.ts가 두 목록이 같은지 검사한다).
export const PEOPLE_ID_LIST: readonly string[] = ['caocao', 'guanyu']

const ID_SET: ReadonlySet<string> = new Set(PEOPLE_ID_LIST)

export function hasPerson(id: string): boolean {
  return ID_SET.has(id)
}
