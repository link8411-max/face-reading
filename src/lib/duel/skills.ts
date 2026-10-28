// 일기토 기술 데이터: 공용 기술 + 장수별 필살기
import { BALANCE, onBalanceChange } from './balance';
import type { Skill } from './types';

/** 효과 규칙 상수: 화상 턴 수, 혼란 실패율, 도발 지속, 일갈·매복 배율, 적 AI의 방어 판단 */
export const SKILL_RULES = {
  burnTurns: 3,
  confuseActions: 1,
  confuseFail: 0.5,
  tauntActions: 2,
  shoutRate: 0.8,
  ambushRate: 0.5,
  lowHp: 0.3,
  defendChance: 0.3,
} as const;

const list: Skill[] = [
  // 기본 공격 (위력 40, 무제한)
  { id: 'strike', name: '일격', kind: '맹장', power: 40, uses: null },
  { id: 'thrust', name: '찌르기', kind: '기장', power: 40, uses: null },
  { id: 'scheme', name: '책략', kind: '지장', power: 40, uses: null },

  // 공용 기술
  { id: 'guard', name: '방어 태세', kind: '맹장', power: 0, uses: null, effect: 'guard' },
  { id: 'shout', name: '일갈', kind: '맹장', power: 0, uses: 5, effect: 'shout' },
  { id: 'breathe', name: '숨 고르기', kind: '기장', power: 0, uses: null, effect: 'heal' },
  { id: 'fire', name: '화공', kind: '지장', power: 35, uses: 5, effect: 'burn' },
  { id: 'confuse', name: '교란', kind: '지장', power: 30, uses: 5, effect: 'confuse' },
  { id: 'ambush', name: '매복', kind: '기장', power: 0, uses: 5, effect: 'ambush' },
  { id: 'taunt', name: '도발', kind: '지장', power: 0, uses: 5, effect: 'taunt' },

  // 장수별 필살기 (기본 위력 40의 1.6~2.0배, 보스가 상단)
  { id: 'guanyu_ult', name: '청룡언월도 참', kind: '맹장', power: 72, uses: 3 },
  { id: 'zhangfei_ult', name: '장판교 호통', kind: '맹장', power: 64, uses: 3, effect: 'shout' },
  { id: 'zhaoyun_ult', name: '칠진칠출', kind: '기장', power: 70, uses: 3 },
  { id: 'machao_ult', name: '서량철기', kind: '기장', power: 68, uses: 3 },
  { id: 'huangzhong_ult', name: '백발백중', kind: '기장', power: 72, uses: 3 },
  { id: 'xuchu_ult', name: '호치돌격', kind: '맹장', power: 70, uses: 3 },
  { id: 'xiaohoudun_ult', name: '척안맹공', kind: '맹장', power: 68, uses: 3 },
  { id: 'zhouyu_ult', name: '적벽 화계', kind: '지장', power: 66, uses: 3, effect: 'burn' },
  { id: 'jiangwei_ult', name: '구벌중원', kind: '지장', power: 70, uses: 3 },
  { id: 'zhangjiao_ult', name: '태평요술', kind: '지장', power: 76, uses: 3, effect: 'confuse' },
  { id: 'dongzhuo_ult', name: '폭정', kind: '지장', power: 78, uses: 3, effect: 'taunt' },
  { id: 'lvbu_ult', name: '방천화극 난무', kind: '맹장', power: 80, uses: 3 },
];

/** 아래 표의 값은 기준값이고, 실제 위력·횟수는 BALANCE.skills가 덮어쓴다 */
export const SKILLS: Record<string, Skill> = Object.fromEntries(list.map((s) => [s.id, { ...s }]));

function applySkillBalance(): void {
  for (const base of list) {
    const o = BALANCE.skills[base.id];
    const s = SKILLS[base.id];
    s.power = o?.power ?? base.power;
    s.uses = o && o.uses !== undefined ? o.uses : base.uses;
    if (o?.burnTurns !== undefined) s.burnTurns = o.burnTurns;
    else delete s.burnTurns;
  }
}
applySkillBalance();
onBalanceChange(applySkillBalance);
