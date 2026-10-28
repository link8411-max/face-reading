// 일기토 장수 명단. stats는 samgukDB에서 모듈 로드 시 복사한다(손으로 옮기지 않음).
import { getCharacterById } from '@/lib/samgukDB';
import { BALANCE, onBalanceChange } from './balance';
import type { DuelGeneral, GeneralKind } from './types';

export const STARTER_IDS = ['guanyu', 'zhangfei', 'zhaoyun'] as const;
/**
 * 보스 웨이브(6·12·18·24·30·36) 순서대로의 보스. 장각·동탁·여포는 role 'boss'(영입 불가),
 * 하후돈·허저·마초는 role 'recruit'를 유지한 채 자기 보스 웨이브에만 보스로 나온다(run.ts nextEnemyId).
 */
export const BOSS_IDS = ['zhangjiao', 'xiaohoudun', 'dongzhuo', 'xuchu', 'machao', 'lvbu'] as const;
export const MOB_ID = 'mob';

// 유형별 기본 속도: 기장 70 / 맹장 55 / 지장 45
const BASE_SPEED: Record<GeneralKind, number> = { 기장: 70, 맹장: 55, 지장: 45 };

interface Def {
  id: string;
  kind: GeneralKind;
  role: DuelGeneral['role'];
  /** 장수별 속도 보정 (BALANCE.speedAdj에 있으면 그 값) */
  speedAdj: number;
  /** 기본 공격 id 다음 순서: 필살기 id, 공용 기술 2개 */
  skills: [string, string, string, string];
}

const DEFS: Def[] = [
  // 시작 장수
  { id: 'guanyu', kind: '맹장', role: 'starter', speedAdj: 0, skills: ['strike', 'guanyu_ult', 'guard', 'shout'] },
  { id: 'zhangfei', kind: '맹장', role: 'starter', speedAdj: 0, skills: ['strike', 'zhangfei_ult', 'guard', 'shout'] },
  // 조운: 신출귀몰한 기동 +10
  { id: 'zhaoyun', kind: '기장', role: 'starter', speedAdj: 10, skills: ['thrust', 'zhaoyun_ult', 'ambush', 'breathe'] },
  // 영입 장수
  // 마초: 서량 기병의 돌진 +10
  { id: 'machao', kind: '기장', role: 'recruit', speedAdj: 10, skills: ['thrust', 'machao_ult', 'ambush', 'breathe'] },
  { id: 'huangzhong', kind: '기장', role: 'recruit', speedAdj: 0, skills: ['thrust', 'huangzhong_ult', 'ambush', 'breathe'] },
  { id: 'xuchu', kind: '맹장', role: 'recruit', speedAdj: 0, skills: ['strike', 'xuchu_ult', 'guard', 'shout'] },
  { id: 'xiaohoudun', kind: '맹장', role: 'recruit', speedAdj: 0, skills: ['strike', 'xiaohoudun_ult', 'guard', 'shout'] },
  { id: 'zhouyu', kind: '지장', role: 'recruit', speedAdj: 0, skills: ['scheme', 'zhouyu_ult', 'confuse', 'breathe'] },
  { id: 'jiangwei', kind: '지장', role: 'recruit', speedAdj: 0, skills: ['scheme', 'jiangwei_ult', 'fire', 'breathe'] },
  // 보스
  { id: 'zhangjiao', kind: '지장', role: 'boss', speedAdj: 0, skills: ['scheme', 'zhangjiao_ult', 'fire', 'breathe'] },
  // 동탁: 비대한 몸집 -10
  { id: 'dongzhuo', kind: '지장', role: 'boss', speedAdj: -10, skills: ['scheme', 'dongzhuo_ult', 'taunt', 'breathe'] },
  // 여포: 적토마 +10
  { id: 'lvbu', kind: '맹장', role: 'boss', speedAdj: 10, skills: ['strike', 'lvbu_ult', 'guard', 'shout'] },
];

function build(def: Def): DuelGeneral {
  const c = getCharacterById(def.id);
  if (!c) throw new Error(`samgukDB에 없는 장수: ${def.id}`);
  return {
    id: def.id,
    name: c.name,
    kind: def.kind,
    speed: BASE_SPEED[def.kind] + (BALANCE.speedAdj[def.id] ?? def.speedAdj),
    skills: def.skills,
    role: def.role,
    sprite: `${def.id}.png`,
    stats: { 통솔: c.stats.통솔, 무력: c.stats.무력, 지력: c.stats.지력, 매력: c.stats.매력 },
  };
}

// 황건적 졸개: samgukDB에 없어 stats를 직접 둔다. 허술한 몸놀림 -15
const MOB: DuelGeneral = {
  id: MOB_ID,
  name: '황건적 졸개',
  kind: '맹장',
  speed: BASE_SPEED['맹장'] - 15,
  skills: ['strike', 'guard', 'shout', 'taunt'],
  role: 'mob',
  sprite: 'mob.png',
  stats: { 통솔: 40, 무력: 45, 지력: 20, 매력: 10 },
};

export const DUEL_GENERALS: DuelGeneral[] = [...DEFS.map(build), MOB];

// BALANCE.speedAdj가 바뀌면(튜너) 속도만 다시 계산한다
onBalanceChange(() => {
  for (const def of DEFS) {
    const g = DUEL_GENERALS.find((x) => x.id === def.id)!;
    g.speed = BASE_SPEED[def.kind] + (BALANCE.speedAdj[def.id] ?? def.speedAdj);
  }
});

export function getDuelGeneral(id: string): DuelGeneral | undefined {
  return DUEL_GENERALS.find((g) => g.id === id);
}
