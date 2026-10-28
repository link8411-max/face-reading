import { describe, it, expect } from 'vitest';
import {
  advancePlayed,
  balanceHash,
  buildRunLog,
  durationBucket,
  endEventId,
  lastBossPassed,
  validateRunLog,
  waveEventId,
} from '@/lib/duel/runLog';
import { BALANCE } from '@/lib/duel/balance';
import { isSafeValue } from '@/lib/analytics';
import { BOSS_WAVES, DUEL_GENERALS } from '@/lib/duel/generals';
import { REWARDS } from '@/lib/duel/rewards';
import { startRun } from '@/lib/duel/run';

const ok = {
  runId: 'abc123',
  version: 'a1b2c3d4',
  starter: 'guanyu',
  reachedWave: 12,
  cleared: false,
  lastEnemy: 'xiaohoudun',
  turns: 80,
  durationBucket: '10-30m',
  rewards: ['sword', 'potion'],
  recruits: ['machao'],
  device: 'mobile',
  resumed: false,
};

describe('validateRunLog', () => {
  it('정상 본문 통과', () => {
    expect(validateRunLog(ok)).toEqual(ok);
  });
  it('모르는 키(ip 등)는 버린다', () => {
    const r = validateRunLog({ ...ok, ip: '1.2.3.4', note: 'x' });
    expect(r).toEqual(ok);
    expect(r && 'ip' in r).toBe(false);
  });
  it.each([
    ['runId 없음', { runId: undefined }],
    ['runId 특수문자', { runId: 'a-b' }],
    ['version 길이', { version: 'abc' }],
    ['version 대문자·비16진', { version: 'ZZZZZZZZ' }],
    ['starter 모름', { starter: 'caocao' }],
    ['starter mob', { starter: 'mob' }],
    ['reachedWave 0', { reachedWave: 0 }],
    ['reachedWave 37', { reachedWave: 37 }],
    ['reachedWave 소수', { reachedWave: 3.5 }],
    ['cleared 문자열', { cleared: 'true' }],
    ['lastEnemy 모름', { lastEnemy: 'nobody' }],
    ['turns 0', { turns: 0 }],
    ['turns 2001', { turns: 2001 }],
    ['구간 모름', { durationBucket: '5m' }],
    ['rewards 배열 아님', { rewards: 'sword' }],
    ['rewards 41개', { rewards: Array(41).fill('sword') }],
    ['rewards 모르는 id', { rewards: ['hack'] }],
    ['recruits 11개', { recruits: Array(11).fill('machao') }],
    ['recruits 모르는 id', { recruits: ['nobody'] }],
    ['device tv', { device: 'tv' }],
    ['resumed 숫자', { resumed: 1 }],
  ])('%s는 null', (_n, patch) => {
    expect(validateRunLog({ ...ok, ...patch })).toBeNull();
  });
  it('객체가 아니면 null', () => {
    expect(validateRunLog(null)).toBeNull();
    expect(validateRunLog([])).toBeNull();
    expect(validateRunLog('x')).toBeNull();
  });
  it('경계값 통과: 36웨이브·2000턴·rewards 40개·recruits 10개', () => {
    expect(
      validateRunLog({ ...ok, reachedWave: 36, cleared: true, turns: 2000, rewards: Array(40).fill('sword'), recruits: Array(10).fill('machao') }),
    ).not.toBeNull();
  });
});

describe('balanceHash', () => {
  it('같은 수치는 같은 해시, 16진 8자', () => {
    expect(balanceHash()).toBe(balanceHash());
    expect(balanceHash()).toMatch(/^[0-9a-f]{8}$/);
  });
  it('수치가 바뀌면 해시가 바뀐다', () => {
    expect(balanceHash({ ...BALANCE, critBase: BALANCE.critBase + 0.01 })).not.toBe(balanceHash(BALANCE));
  });
});

describe('durationBucket', () => {
  const m = 60_000;
  it.each([
    [0, '<10m'],
    [9 * m + 59_000, '<10m'],
    [10 * m, '10-30m'],
    [30 * m, '30-60m'],
    [60 * m, '60-90m'],
    [90 * m, '>90m'],
    [500 * m, '>90m'],
  ])('%i ms -> %s', (ms, b) => expect(durationBucket(ms)).toBe(b));
  it('이상한 값(NaN·음수)은 <10m', () => {
    expect(durationBucket(NaN)).toBe('<10m');
    expect(durationBucket(-5)).toBe('<10m');
  });
});

describe('advancePlayed (진행 시간 누적)', () => {
  it('지난 저장 이후 시간만큼 더한다', () => {
    expect(advancePlayed(1000, 5000, 8000)).toBe(4000);
  });
  it('한 번에 5분까지만 센다(자리를 비운 시간 제외)', () => {
    expect(advancePlayed(0, 0, 3_600_000)).toBe(300_000);
  });
  it('시계가 거꾸로 가면 더하지 않는다', () => {
    expect(advancePlayed(1000, 9000, 5000)).toBe(1000);
  });
});

describe('GA 이벤트 값', () => {
  it('waveEventId: w06, w36', () => {
    expect(waveEventId(6)).toBe('w06');
    expect(waveEventId(36)).toBe('w36');
  });
  it('lastBossPassed: 마지막으로 넘은 보스 웨이브(없으면 0, 클리어면 36)', () => {
    expect(lastBossPassed(1, false)).toBe(0);
    expect(lastBossPassed(6, false)).toBe(0); // 장각에게 졌다
    expect(lastBossPassed(7, false)).toBe(6);
    expect(lastBossPassed(18, false)).toBe(12);
    expect(lastBossPassed(36, false)).toBe(30);
    expect(lastBossPassed(36, true)).toBe(36);
  });
  it('endEventId 예시와 모든 조합이 isSafeValue 통과', () => {
    expect(endEventId('guanyu', false, 19)).toBe('guanyu_l_w18');
    expect(endEventId('zhangfei', true, 36)).toBe('zhangfei_c_w36');
    expect(endEventId('guanyu', false, 3)).toBe('guanyu_l_w00');
    for (const g of DUEL_GENERALS.filter((x) => x.role !== 'mob')) {
      for (const cleared of [true, false]) {
        for (let w = 1; w <= 36; w++) expect(isSafeValue(endEventId(g.id, cleared, w))).toBe(true);
      }
    }
    for (const w of BOSS_WAVES) expect(isSafeValue(waveEventId(w))).toBe(true);
  });
});

describe('buildRunLog', () => {
  it('끝난 판에서 서버 본문을 만들고 validateRunLog를 통과한다', () => {
    let run = startRun('guanyu', 7);
    run = {
      ...run,
      phase: 'lost',
      wave: 3,
      record: {
        starter: 'guanyu',
        cleared: false,
        rewards: [REWARDS[0].id, REWARDS[1].id],
        waves: [
          { wave: 1, enemy: 'mob', turns: 4 },
          { wave: 2, enemy: 'machao', turns: 5, recruited: true },
          { wave: 3, enemy: 'mob', turns: 6 },
        ],
      },
    };
    const log = buildRunLog(run, { runId: 'r1', device: 'desktop', resumed: true, playedMs: 12 * 60_000 });
    expect(log).toMatchObject({
      runId: 'r1',
      starter: 'guanyu',
      reachedWave: 3,
      cleared: false,
      lastEnemy: 'mob',
      turns: 15,
      durationBucket: '10-30m',
      device: 'desktop',
      resumed: true,
      recruits: ['machao'],
    });
    expect(log.version).toBe(balanceHash());
    expect(validateRunLog(log)).toEqual(log);
  });
});
