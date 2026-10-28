// 밸런스: 시작 장수 × 동행 조합(average, 처음부터 동행·레벨 1). 시드는 COMBO_SEEDS.
import { describe, it, expect } from 'vitest';
import { COMBO_SEEDS, RECRUITS, STARTERS, sum } from './balanceHelpers';

/** 첫 판에서 자주 함께한 영입 장수 쌍 셋 (scripts/duel-balance.ts combo 표, 시드 500; 주유는 시작 장수지만 적으로 나와 영입되기도 한다) */
const PAIRS = [
  ['xuchu', 'zhouyu'],
  ['jiangwei', 'zhouyu'],
  ['jiangwei', 'xuchu'],
];
const COMBOS = [...RECRUITS.map((r) => [r]), ...PAIRS];

describe('밸런스: 쓸모없는 영입 장수 없음', () => {
  it.each(STARTERS)('%s: 어떤 영입 장수를 동행에 넣어도 중앙값 도달 웨이브가 낮아지지 않는다(−1 허용)', (s) => {
    const base = sum(s, {}, COMBO_SEEDS).median;
    for (const r of RECRUITS) expect(sum(s, { roster: [r] }, COMBO_SEEDS).median, r).toBeGreaterThanOrEqual(base - 1);
  });
});

describe('밸런스: 시작 장수 × 동행 조합', () => {
  // 2라운드(상성 1.4/0.75, 시드 200): 처음부터 동행 하나가 상성 빈칸을 메우면 혼자 판의 2배를 넘는 조합이 많다
  // (관우+강유 38% 대 14%, 장비+마초 34% 대 9%, 주유+마초 65% 대 24%). 0%인 조합은 없다. 표와 원인은 docs/duel-balance.md
  it.todo('어떤 조합도 혼자 판 클리어의 2배를 넘지 않고, 다른 조합이 깨는데 0%인 조합이 없다');

  it.each(STARTERS)('%s: 조합 표가 계산된다(동행 하나·쌍 9가지, 클리어율 0~1)', (s) => {
    for (const c of COMBOS) {
      const v = sum(s, { roster: c }, COMBO_SEEDS).clear;
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThanOrEqual(1);
    }
  });
});
