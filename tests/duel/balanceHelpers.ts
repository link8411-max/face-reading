// 밸런스 테스트 공용: 시드 수와 요약 캐시. 평소(npm test)는 시드 1~200의 빠른 판, DUEL_BALANCE_FULL=1일 때만 500시드 전체 판. 시드는 항상 1부터 순서대로라 결과가 고정이다.
// 시간이 오래 걸리는 표라 파일 셋(balance.skill / balance.main / balance.combo)으로 나눠 vitest가 나란히 돌린다.
import { vi } from 'vitest';
import { simulateRun, summarizeRuns, type RunSummary, type SimOptions } from '@/lib/duel/autoplay';

export const FULL = process.env.DUEL_BALANCE_FULL === '1';
/** 시뮬레이션 테스트의 시간 제한: 기본 5초는 느린 기계·병렬 실행에서 모자란다. 빠른 판 60초, 전체 판 10분 */
export const SIM_TIMEOUT = FULL ? 600_000 : 60_000;
vi.setConfig({ testTimeout: SIM_TIMEOUT });
export const SEEDS = FULL ? 500 : 200;
/** 조합·영입 표는 설정이 많아 평소엔 시드를 줄인다 */
export const COMBO_SEEDS = FULL ? 500 : 100;
export const STARTERS = ['guanyu', 'zhangfei', 'zhaoyun', 'zhouyu'] as const;
export const RECRUITS = ['machao', 'huangzhong', 'xuchu', 'xiaohoudun', 'zhouyu', 'jiangwei'];
export const ROSTER = ['zhaoyun', 'machao', 'zhouyu'];
export const EPS = 1e-9;

const cache = new Map<string, RunSummary>();
export function sum(starter: string, opts: SimOptions = {}, seeds = SEEDS): RunSummary {
  const key = `${starter}|${JSON.stringify(opts)}|${seeds}`;
  let s = cache.get(key);
  if (!s) {
    s = summarizeRuns(Array.from({ length: seeds }, (_, i) => simulateRun(starter, i + 1, opts)));
    cache.set(key, s);
  }
  return s;
}
export const bossPass = (s: RunSummary, wave: number) => s.boss.find((b) => b.wave === wave)!.pass;
export const spread = (xs: number[]) => Math.max(...xs) - Math.min(...xs);
