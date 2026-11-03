// 관계 종류의 화면 표기. 데이터의 type('부자'·'형제')은 그대로 두고, 두 사람의 성별로 보이는 말만 바꾼다.
import { getPerson } from '@/content/samgukPeople'
import type { RelationType } from '@/content/samgukPeople/types'
import { characterById } from './characters'

type Gender = '남' | '여'

const genderOf = (id: string | null | undefined): Gender | null => (id ? (characterById(id)?.gender ?? null) : null)

// 부모·자식 방향은 데이터에 없다. 두 사람의 출생 연도가 12년 이상 벌어질 때만 나이 많은 쪽을 부모로 본다.
function olderId(a: string, b: string): string | null {
  const ya = getPerson(a)?.born ?? null
  const yb = getPerson(b)?.born ?? null
  if (ya === null || yb === null || Math.abs(ya - yb) < 12) return null
  return ya < yb ? a : b
}

/** type을 두 사람(aId, bId)의 성별에 맞춘 말로. 성별·방향을 알 수 없으면 중립 표기('부모·자식', '형제·자매') */
export function relationLabel(type: RelationType, aId: string, bId: string | null): string {
  if (type !== '부자' && type !== '형제') return type
  const ga = genderOf(aId)
  const gb = genderOf(bId)
  if (type === '형제') {
    if (!ga || !gb) return '형제·자매'
    if (ga === '남' && gb === '남') return '형제'
    return ga === '여' && gb === '여' ? '자매' : '남매'
  }
  if (!ga || !gb) return '부모·자식'
  if (ga === '남' && gb === '남') return '부자'
  if (ga === '여' && gb === '여') return '모녀'
  if (!bId) return '부모·자식'
  const older = olderId(aId, bId)
  if (older === null) return '부모·자식'
  const parentGender = older === aId ? ga : gb
  const childGender = older === aId ? gb : ga
  if (parentGender === '남') return childGender === '여' ? '부녀' : '부자'
  return childGender === '남' ? '모자' : '모녀'
}
