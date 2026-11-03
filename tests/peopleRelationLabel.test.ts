import { relationLabel } from '@/lib/people/relationLabel'
import { PEOPLE_IDS } from '@/content/samgukPeople'
import { characterById } from '@/lib/people/characters'
import { relationsOf } from '@/lib/people/relations'

describe('relationLabel', () => {
  test('남자끼리 부자·형제는 그대로', () => {
    expect(relationLabel('부자', 'caocao', 'caopi')).toBe('부자')
    expect(relationLabel('형제', 'guanping', 'guanxing')).toBe('형제')
  })
  test('여자가 낀 형제는 남매·자매', () => {
    expect(relationLabel('형제', 'daqiao', 'xiaoqiao')).toBe('자매')
    expect(relationLabel('형제', 'caojie', 'caopi')).toBe('남매')
  })
  test('여자끼리 부모·자식은 모녀', () => {
    expect(relationLabel('부자', 'bujianying', 'sunluban')).toBe('모녀')
  })
  test('남녀 부모·자식은 방향을 알 때만 모자, 모르면 부모·자식', () => {
    expect(relationLabel('부자', 'zhangchunhua', 'simazhao')).toBe('모자')
    expect(relationLabel('부자', 'simazhao', 'zhangchunhua')).toBe('모자')
    expect(relationLabel('부자', 'sunquan', 'sunluban')).toBe('부모·자식')
  })
  test('이름만 있는 상대(성별을 모름)는 중립 표기', () => {
    expect(relationLabel('부자', 'sunluban', null)).toBe('부모·자식')
    expect(relationLabel('형제', 'sunluban', null)).toBe('형제·자매')
  })
  test('그 밖의 종류는 그대로', () => {
    expect(relationLabel('부부', 'sunquan', 'bujianying')).toBe('부부')
    expect(relationLabel('군신', 'guanyu', 'liubei')).toBe('군신')
  })
  test('relationsOf가 label을 담고, type은 데이터 그대로', () => {
    const r = relationsOf('sunluban')
    expect(r.every((x) => x.label.length > 0)).toBe(true)
    const mom = r.find((x) => x.otherId === 'bujianying')!
    expect(mom.type).toBe('부자')
    expect(mom.label).toBe('모녀')
  })
  test('여성이 낀 관계에 "부자"가 화면 라벨로 남지 않는다', () => {
    for (const id of PEOPLE_IDS) {
      for (const r of relationsOf(id)) {
        if (r.label === '부자') {
          expect(characterById(id)?.gender).toBe('남')
          if (r.otherId) expect(characterById(r.otherId)?.gender).toBe('남')
        }
        if (r.label === '형제') {
          expect(characterById(id)?.gender).toBe('남')
          if (r.otherId) expect(characterById(r.otherId)?.gender).toBe('남')
        }
      }
    }
  })
})
