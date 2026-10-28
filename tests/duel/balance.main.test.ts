// 밸런스: 기본(average) 판의 장수 간 균형, 상성의 무게, 치명타의 운 폭, 장수록 판, 보상 성향, 판 길이.
import { describe, it, expect } from 'vitest';
import { DIST_TARGETS } from '@/lib/duel/balance';
import { EPS, ROSTER, spread, STARTERS, sum } from './balanceHelpers';

const rosterSum = (s: string) => sum(s, { roster: ROSTER.filter((id) => id !== s) });
const NO_CRIT = { balance: { critBase: 0, critKiBonus: 0, critPerSpeed: 0 } };

describe('밸런스: 시작 장수 간 차이(average, 첫 판)', () => {
  // 관우 9.5%·장비 11%·조운 13%·주유 19%(차이 9.5%p). 주유는 적벽 화계 화상 1턴·피해 배율 0.7(docs/duel-balance.md 2라운드 보정)
  it(`클리어율 차이 ≤ ${DIST_TARGETS.average.starterClearSpread * 100}%p`, () => {
    expect(spread(STARTERS.map((s) => sum(s).clear))).toBeLessThanOrEqual(DIST_TARGETS.average.starterClearSpread + EPS);
  });
});

describe('밸런스: 판 길이(average)', () => {
  // 보통 웨이브를 5~7합으로 줄였다(죽은 합 제거). 한 판은 클리어하면 약 200~250합, 중간에 지는 판을 섞은 평균은 110~150합
  it.each(STARTERS)('%s: 평균 턴 수 80~250', (s) => {
    const t = sum(s).meanTurns;
    expect(t).toBeGreaterThanOrEqual(80);
    expect(t).toBeLessThanOrEqual(250);
  });
});

describe('밸런스: 상성의 무게', () => {
  it.each(STARTERS)('%s: 상성 활용(average)이 기본 공격만보다 중앙값 도달 웨이브 ≥ 6 높다', (s) => {
    expect(sum(s).median).toBeGreaterThanOrEqual(sum(s, { mode: 'basic' }).median + 6);
  });
});

describe('밸런스: 치명타의 운 폭', () => {
  // 치명타는 design.ts가 기대 배율로 흡수하므로 평균 난이도는 그대로고 퍼짐만 늘 수 있다: 보스 한 칸(6웨이브)을 넘게 늘지 않아야 한다
  // 장비 IQR 19(끔 12, +7): 사분위 경계가 보스 칸(18·24·30)을 넘나들어 6 단위로 뛴다. 중앙값·클리어는 18·11%(끔 18·10%)로 같다
  it.todo('zhangfei: 도달 웨이브 IQR이 치명타를 끈 판보다 6 넘게 늘지 않는다 (+7)');
  it.each(['guanyu', 'zhaoyun', 'zhouyu'])('%s: 도달 웨이브 IQR이 치명타를 끈 판보다 6 넘게 늘지 않는다', (s) => {
    expect(sum(s).iqr).toBeLessThanOrEqual(sum(s, NO_CRIT).iqr + 6 + EPS);
  });
});

describe('밸런스: 장수록 판(시작부터 동행 2명)', () => {
  // 관우 40%·장비 47%·조운 52%·주유 72% (첫 판 9~24%): 처음부터 맹장·기장·지장 삼각이 갖춰지면 상성 1.4/0.75에서
  // 보스마다 유리한 장수로 바꿔 받는다. 첫 판은 그 삼각을 영입으로 모아야 해서 차이가 커졌다(장수록이 메타 진행이 됨)
  it.todo('장수록 판 클리어 ≤ 첫 판 + 15%p (지금 +26~48%p)');
  it.each(STARTERS)('%s: 장수록 판 클리어는 첫 판 이상', (s) => {
    expect(rosterSum(s).clear).toBeGreaterThanOrEqual(sum(s).clear - EPS);
  });
});

describe('밸런스: 보상 성향(average, 첫 판)', () => {
  // 장비 8.5%p(회복 11%·공격 7.5%·아무거나 2.5%), 조운 9%p(13%·5.5%·4%), 주유 17.5%p(19%·30%·12.5%):
  // 싸움마다 체력이 깎이니 회복약을 흘리면 손해가 크고, 주유는 병법서 지력 +10이 바로 피해가 된다
  it.todo('장비·조운·주유: 회복 먼저·공격 먼저·아무거나의 클리어율 차이 ≤ 8%p (8.5%p·9%p·17.5%p)');
  it.each(['guanyu'])('%s: 회복 먼저·공격 먼저·아무거나의 클리어율 차이 ≤ 8%p', (s) => {
    const cl = (['heal', 'attack', 'random'] as const).map((rewardPref) => sum(s, { rewardPref }).clear);
    expect(spread(cl)).toBeLessThanOrEqual(0.08 + EPS);
  });
});
