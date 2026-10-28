// 실제 플레이 기록(duel_runs)으로 만드는 분포표. scripts/duel-balance.ts의 봇 표와 같은 모양으로 비교한다. 순수 함수만.

import { BOSS_WAVES } from './generals';
import { DURATION_BUCKETS, type DurationBucket } from './runLog';

/** DB 열 이름 그대로의 행(필요한 열만) */
export interface RunRow {
  version: string;
  starter: string;
  reached_wave: number;
  cleared: boolean;
  last_enemy: string;
  turns: number;
  duration_bucket: string;
}

export const SURVIVE_WAVES = [12, 18, 24] as const;

export interface RealSummary {
  n: number;
  /** 웨이브 w까지 이긴(넘긴) 판 비율: 12·18·24 */
  survive: Record<number, number>;
  clear: number;
  /** 보스 웨이브마다 전체 패배 중 그 보스에게 진 비율 */
  deathShare: { wave: number; share: number }[];
  meanTurns: number;
  /** 시간 구간별 판 비율 */
  duration: Record<DurationBucket, number>;
}

export function summarizeReal(rows: RunRow[]): RealSummary {
  const n = rows.length;
  const frac = (k: number) => (n ? k / n : 0);
  const lost = rows.filter((r) => !r.cleared);
  return {
    n,
    survive: Object.fromEntries(SURVIVE_WAVES.map((w) => [w, frac(rows.filter((r) => r.cleared || r.reached_wave > w).length)])),
    clear: frac(rows.filter((r) => r.cleared).length),
    deathShare: BOSS_WAVES.map((wave) => ({
      wave,
      share: lost.length ? lost.filter((r) => r.reached_wave === wave).length / lost.length : 0,
    })),
    meanTurns: n ? rows.reduce((a, r) => a + r.turns, 0) / n : 0,
    duration: Object.fromEntries(DURATION_BUCKETS.map((b) => [b, frac(rows.filter((r) => r.duration_bucket === b).length)])) as Record<DurationBucket, number>,
  };
}

/** 버전 -> 시작 장수 -> 요약. 시작 장수 '전체'는 '*' */
export function groupReal(rows: RunRow[]): Map<string, Map<string, RealSummary>> {
  const byVersion = new Map<string, RunRow[]>();
  for (const r of rows) byVersion.set(r.version, [...(byVersion.get(r.version) ?? []), r]);
  const out = new Map<string, Map<string, RealSummary>>();
  for (const [version, vr] of byVersion) {
    const starters = [...new Set(vr.map((r) => r.starter))].sort();
    const m = new Map<string, RealSummary>();
    for (const s of starters) m.set(s, summarizeReal(vr.filter((r) => r.starter === s)));
    m.set('*', summarizeReal(vr));
    out.set(version, m);
  }
  return out;
}

const pct = (x: number) => `${Math.round(x * 100)}%`.padStart(4);

/** 표 한 줄: 장수 | 판수 | 12·18·24 생존 | 클리어 | 보스별 패배 비율 | 평균 턴 | 시간 구간 */
export function formatRealRow(starter: string, s: RealSummary): string {
  return [
    (starter === '*' ? '전체' : starter).padEnd(9),
    String(s.n).padStart(5),
    SURVIVE_WAVES.map((w) => pct(s.survive[w])).join(' '),
    pct(s.clear),
    s.deathShare.map((d) => pct(d.share).trim()).join('/'),
    s.meanTurns.toFixed(0).padStart(4),
    DURATION_BUCKETS.map((b) => pct(s.duration[b]).trim()).join('/'),
  ].join(' | ');
}
