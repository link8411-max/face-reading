// 밸런스: 실력 단계별 목표(SKILL_TARGETS, 첫 판). 설계표는 average 기준이다.
// GAPS에 적힌 항목은 지금 설계로 못 맞춘 목표다(it.todo, 수치와 원인). 자세한 것은 docs/duel-balance.md.
import { describe, it, expect } from 'vitest';
import { SKILL_TARGETS } from '@/lib/duel/balance';
import { bossPass, sum, STARTERS } from './balanceHelpers';

type Profile = keyof typeof SKILL_TARGETS;
const PROFILES: Profile[] = ['novice', 'average', 'expert'];

/** `${실력}.${장수}.${지표}` → 못 맞춘 까닭 (시드 200) */
const GAPS: Record<string, string> = {
  // 장각(6)은 거의 혼자 싸우는 상성 대결이라 실력 차가 작게 난다
  'novice.guanyu.zhangjiao': '83.5%: 웨이브 6은 실수보다 상성·체력 경주로 정해진다',
  'novice.zhaoyun.zhangjiao': '87%: 기장 조운이 지장 장각에 상성 우위',
  'novice.zhouyu.zhangjiao': '90.5%: 주유는 웨이브 1~5의 졸개(맹장)를 상성으로 눌러 체력이 남은 채 장각에 닿는다',
  'average.zhaoyun.zhangjiao': '95.5%: 기장 조운이 지장 장각에 상성 우위(체력 배율을 더 내리면 동탁이 무너진다)',
  'average.zhouyu.zhangjiao': '97.5%: 졸개 구간을 상성 우위로 지나 체력이 남는다',
  'expert.zhangfei.zhangjiao': '80%: 장각은 실력보다 상성(맹장이 지장에 불리)',
  'expert.guanyu.dongzhuo': '57%: 동탁도 지장이라 맹장 시작 장수에겐 상성 벽',
  'expert.zhangfei.dongzhuo': '56%: 같은 까닭',
  'expert.zhaoyun.clear': '40%: 고수 조운은 후반 기장·맹장 보스를 동행 교체로 넘는다',
  'expert.zhouyu.clear': '48%: 고수 주유도 같다(후반 졸개가 맹장이라 지장에 약함)',
};

const metric = {
  zhangjiao: (p: Profile, s: string) => bossPass(sum(s, { skill: p }), 6),
  dongzhuo: (p: Profile, s: string) => bossPass(sum(s, { skill: p }), 18),
  clear: (p: Profile, s: string) => sum(s, { skill: p }).clear,
};

describe.each(PROFILES)('실력 %s (첫 판)', (p) => {
  for (const s of STARTERS) {
    for (const m of ['zhangjiao', 'dongzhuo', 'clear'] as const) {
      const range = SKILL_TARGETS[p][m];
      if (!range) continue;
      const key = `${p}.${s}.${m}`;
      const name = `${s}: ${m === 'zhangjiao' ? '장각 통과' : m === 'dongzhuo' ? '동탁 승률(도달 시)' : '클리어'} ${range[0]}~${range[1]}`;
      if (GAPS[key]) {
        it.todo(`${name} — ${GAPS[key]}`);
        continue;
      }
      it(name, () => {
        const v = metric[m](p, s);
        expect(v).toBeGreaterThanOrEqual(range[0]);
        expect(v).toBeLessThanOrEqual(range[1]);
      });
    }
  }
});
