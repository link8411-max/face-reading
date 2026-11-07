import { getTenGod } from 'manseryeok'
import type { Branch, RelationKind, RelationStrength, Stem, TenGod } from './keys'

// 2027 세운(未) 전용: 일지와 未의 관계
const TO_MI: Partial<Record<Branch, { kind: RelationKind; strength: RelationStrength }>> = {
  축: { kind: '충', strength: 'strong' },
  오: { kind: '합', strength: 'strong' },
  묘: { kind: '반합', strength: 'weak' },
  해: { kind: '반합', strength: 'weak' },
  술: { kind: '파', strength: 'weak' },
  자: { kind: '해', strength: 'weak' },
  미: { kind: '같음', strength: 'weak' },
}

export function branchRelationToMi(dayBranch: Branch): { kind: RelationKind; strength: RelationStrength } {
  return TO_MI[dayBranch] ?? { kind: '없음', strength: 'none' }
}

export function stemTenGod(dayMaster: Stem, target: Stem): TenGod {
  return getTenGod(dayMaster, target)
}
