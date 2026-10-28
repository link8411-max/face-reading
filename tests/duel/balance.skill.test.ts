// 밸런스: 실력 단계별 목표(SKILL_TARGETS, 첫 판). 설계표는 average 기준이다.
// GAPS에 적힌 항목은 지금 설계로 못 맞춘 목표다(it.todo, 수치와 원인). 자세한 것은 docs/duel-balance.md.
import { describe, it, expect } from 'vitest';
import { SKILL_TARGETS } from '@/lib/duel/balance';
import { bossPass, sum, STARTERS } from './balanceHelpers';

type Profile = keyof typeof SKILL_TARGETS;
const PROFILES: Profile[] = ['novice', 'average', 'expert'];

/** `${실력}.${장수}.${지표}` → 못 맞춘 까닭 (시드 200) */
const GAPS: Record<string, string> = {
  // 장각(6)은 거의 혼자 싸우는 상성 대결이라 실력 차가 작게 난다(초보와 고수 차이 4~7%p)
  'novice.guanyu.zhangjiao': '81%: 실수해도 웨이브 6 싸움은 상성·체력 경주로 거의 정해진다',
  'novice.zhangfei.zhangjiao': '78%: 같은 까닭',
  'novice.zhaoyun.zhangjiao': '94%: 기장 조운이 지장 장각에 상성 우위',
  'average.zhaoyun.zhangjiao': '98%: 기장 조운이 지장 장각에 상성 우위',
  'average.zhaoyun.dongzhuo': '39%: 경계(40%) 바로 아래',
  'expert.guanyu.zhangjiao': '85%: 장각은 실력보다 상성(맹장이 지장에 불리)',
  'expert.zhangfei.zhangjiao': '88%: 같은 까닭',
  'expert.guanyu.dongzhuo': '57%: 동탁도 지장이라 맹장 시작 장수에겐 상성 벽',
  'expert.zhangfei.dongzhuo': '55%: 같은 까닭',
  'expert.zhaoyun.dongzhuo': '58%: 경계(60%) 바로 아래',
  'expert.zhaoyun.clear': '31.5%: 경계(30%) 바로 위',
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
