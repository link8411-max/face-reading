// 일기토 플레이 데이터: 한 판 요약(서버 기록용)과 GA 퍼널 이벤트 값.
// 개인정보 원칙: 사진·IP·식별 가능한 값은 다루지 않는다. 시작 장수·도달 단계·결과·보상 id·기기 종류만.

import { BALANCE, type Balance } from './balance';
import { BOSS_WAVES, getDuelGeneral, MOB_ID } from './generals';
import { REWARDS } from './rewards';
import { WAVES } from './run';
import { parseRunId } from './feedbackGuard';
import type { RunState } from './types';

export const DURATION_BUCKETS = ['<10m', '10-30m', '30-60m', '60-90m', '>90m'] as const;
export type DurationBucket = (typeof DURATION_BUCKETS)[number];

export interface RunLog {
  runId: string;
  /** BALANCE 수치의 해시 8자(어느 밸런스 버전에서 나온 기록인지) */
  version: string;
  starter: string;
  reachedWave: number;
  cleared: boolean;
  lastEnemy: string;
  turns: number;
  durationBucket: DurationBucket;
  rewards: string[];
  recruits: string[];
  device: 'mobile' | 'desktop';
  resumed: boolean;
}

const MAX_REWARDS = 40;
const MAX_RECRUITS = 10;
const MAX_TURNS = 2000;
const MIN = 60_000;
/** 저장 사이에 한 번에 세는 진행 시간의 상한(자리를 비운 시간을 빼려고) */
const PLAY_GAP_CAP_MS = 5 * MIN;

const REWARD_IDS = new Set(REWARDS.map((r) => r.id));
const isInt = (v: unknown, min: number, max: number): v is number => typeof v === 'number' && Number.isInteger(v) && v >= min && v <= max;

/** BALANCE 수치의 FNV-1a 해시(16진 8자). 같은 수치면 항상 같다 */
export function balanceHash(balance: Balance = BALANCE): string {
  let h = 0x811c9dc5;
  for (const ch of JSON.stringify(balance)) {
    h ^= ch.charCodeAt(0);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h.toString(16).padStart(8, '0');
}

/** 진행 시간(ms)을 구간으로. 서버에는 구간만 보낸다 */
export function durationBucket(ms: number): DurationBucket {
  if (!Number.isFinite(ms) || ms < 10 * MIN) return '<10m';
  if (ms < 30 * MIN) return '10-30m';
  if (ms < 60 * MIN) return '30-60m';
  if (ms < 90 * MIN) return '60-90m';
  return '>90m';
}

/** 저장할 때마다 진행 시간을 더한다. 지난 저장 이후 시간만 세되 한 번에 5분까지(자리를 비운 시간 제외) */
export function advancePlayed(playedMs: number, lastAt: number, now: number): number {
  const gap = now - lastAt;
  if (!(gap > 0)) return playedMs;
  return playedMs + Math.min(gap, PLAY_GAP_CAP_MS);
}

// ── GA 이벤트 값 (isSafeValue: 영문·숫자·밑줄·한글 24자 이내, 숫자 4자리 연속 금지) ──

/** 보스 웨이브 도달 이벤트 값: 'w06' */
export const waveEventId = (wave: number): string => `w${String(wave).padStart(2, '0')}`;

/** 마지막으로 넘은 보스 웨이브(보스를 이긴 가장 큰 보스 웨이브, 없으면 0, 클리어면 마지막 보스) */
export function lastBossPassed(reachedWave: number, cleared: boolean): number {
  if (cleared) return BOSS_WAVES[BOSS_WAVES.length - 1];
  let last = 0;
  for (const b of BOSS_WAVES) if (reachedWave > b) last = b;
  return last;
}

/** 판 끝 이벤트 값: '<시작 장수>_<c|l>_<구간>' 예 'guanyu_l_w18' */
export function endEventId(starter: string, cleared: boolean, reachedWave: number): string {
  return `${starter}_${cleared ? 'c' : 'l'}_${waveEventId(lastBossPassed(reachedWave, cleared))}`;
}

// ── 서버 본문 ──

/** 끝난 판에서 서버로 보낼 요약을 만든다 */
export function buildRunLog(
  run: RunState,
  extra: { runId: string; device: 'mobile' | 'desktop'; resumed: boolean; playedMs: number },
): RunLog {
  const waves = run.record.waves;
  const turns = waves.reduce((n, w) => n + w.turns, 0);
  return {
    runId: extra.runId,
    version: balanceHash(),
    starter: run.record.starter,
    reachedWave: Math.min(WAVES, Math.max(1, run.wave)),
    cleared: run.record.cleared,
    lastEnemy: waves[waves.length - 1]?.enemy ?? MOB_ID,
    turns: Math.min(MAX_TURNS, Math.max(1, turns)),
    durationBucket: durationBucket(extra.playedMs),
    rewards: run.record.rewards.slice(0, MAX_REWARDS),
    recruits: waves.filter((w) => w.recruited === true).map((w) => w.enemy).slice(0, MAX_RECRUITS),
    device: extra.device,
    resumed: extra.resumed,
  };
}

/** 판 요약 본문 검증. 모르는 키는 버리고, 유효하지 않으면 null */
export function validateRunLog(body: unknown): RunLog | null {
  if (typeof body !== 'object' || body === null || Array.isArray(body)) return null;
  const b = body as Record<string, unknown>;

  const runId = parseRunId(b);
  if (runId === null || runId === 'invalid') return null;
  if (typeof b.version !== 'string' || !/^[0-9a-f]{8}$/.test(b.version)) return null;
  const { starter, reachedWave, cleared, lastEnemy, turns, device, resumed } = b;
  if (typeof starter !== 'string' || starter === MOB_ID || !getDuelGeneral(starter)) return null;
  if (!isInt(reachedWave, 1, WAVES)) return null;
  if (typeof cleared !== 'boolean') return null;
  if (typeof lastEnemy !== 'string' || !getDuelGeneral(lastEnemy)) return null;
  if (!isInt(turns, 1, MAX_TURNS)) return null;
  if (!(DURATION_BUCKETS as readonly unknown[]).includes(b.durationBucket)) return null;
  const rewards = b.rewards;
  if (!Array.isArray(rewards) || rewards.length > MAX_REWARDS || !rewards.every((r) => typeof r === 'string' && REWARD_IDS.has(r))) return null;
  const recruits = b.recruits;
  if (
    !Array.isArray(recruits) ||
    recruits.length > MAX_RECRUITS ||
    !recruits.every((r) => typeof r === 'string' && r !== MOB_ID && !!getDuelGeneral(r))
  )
    return null;
  if (device !== 'mobile' && device !== 'desktop') return null;
  if (typeof resumed !== 'boolean') return null;

  return {
    runId,
    version: b.version,
    starter,
    reachedWave,
    cleared,
    lastEnemy,
    turns,
    durationBucket: b.durationBucket as DurationBucket,
    rewards: [...rewards] as string[],
    recruits: [...recruits] as string[],
    device,
    resumed,
  };
}
