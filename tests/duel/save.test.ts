import { describe, it, expect } from 'vitest';
import { loadSave, writeSave, recordRunEnd, SAVE_KEY } from '@/lib/duel/save';
import { STARTER_IDS } from '@/lib/duel/generals';
import { startRun } from '@/lib/duel/run';
import type { RunRecord, SaveData } from '@/lib/duel/types';

function fakeStorage(initial?: string) {
  const m = new Map<string, string>();
  if (initial !== undefined) m.set(SAVE_KEY, initial);
  return {
    getItem: (k: string) => m.get(k) ?? null,
    setItem: (k: string, v: string) => void m.set(k, v),
    removeItem: (k: string) => void m.delete(k),
  };
}

const empty = (): SaveData => ({ version: 1, roster: [...STARTER_IDS], best: { wave: 0, clears: 0 }, history: [], current: null });
const rec = (waves: number, over: Partial<RunRecord> = {}): RunRecord => ({
  starter: 'guanyu',
  waves: Array.from({ length: waves }, (_, i) => ({ wave: i + 1, enemy: 'mob', turns: 3 })),
  rewards: [],
  cleared: false,
  ...over,
});

describe('loadSave', () => {
  it('빈 저장·null storage → 기본값', () => {
    expect(loadSave(fakeStorage())).toEqual(empty());
    expect(loadSave(null)).toEqual(empty());
  });
  it('잘못된 JSON → 기본값, throw 없음', () => {
    expect(loadSave(fakeStorage('{not json'))).toEqual(empty());
    expect(loadSave(fakeStorage('123'))).toEqual(empty());
  });
  it('getItem이 throw해도 기본값', () => {
    const s = { getItem: () => { throw new Error('x'); }, setItem() {}, removeItem() {} };
    expect(loadSave(s)).toEqual(empty());
  });
  it('왕복: 쓰고 읽으면 같다', () => {
    const st = fakeStorage();
    const data = { ...empty(), current: startRun('guanyu', 1), best: { wave: 5, clears: 1 } };
    expect(writeSave(st, data)).toBe(true);
    expect(loadSave(st)).toEqual(data);
  });
  it('version 0 → roster 유지, current null', () => {
    const data = { ...empty(), version: 0, roster: ['guanyu', 'zhangfei', 'zhaoyun', 'lvbu'], current: startRun('guanyu', 1) };
    const out = loadSave(fakeStorage(JSON.stringify(data)));
    expect(out.current).toBeNull();
    expect(out.roster).toContain('lvbu');
    expect(out.version).toBe(1);
  });
  it('알 수 없는 id 든 current → null, 나머지 유지', () => {
    const run = startRun('guanyu', 1);
    run.party[0].id = 'nobody';
    const data = { ...empty(), best: { wave: 7, clears: 2 }, current: run };
    const out = loadSave(fakeStorage(JSON.stringify(data)));
    expect(out.current).toBeNull();
    expect(out.best).toEqual({ wave: 7, clears: 2 });
  });
  it('알 수 없는 enemy id / roster id도 current 버림', () => {
    const run = startRun('guanyu', 1);
    run.enemy!.id = 'ghost';
    expect(loadSave(fakeStorage(JSON.stringify({ ...empty(), current: run }))).current).toBeNull();
    const run2 = startRun('guanyu', 1);
    run2.roster = ['guanyu', 'ghost'];
    expect(loadSave(fakeStorage(JSON.stringify({ ...empty(), current: run2 }))).current).toBeNull();
  });
  it('roster: 모르는 id는 걸러내고 시작 장수는 항상 포함', () => {
    const out = loadSave(fakeStorage(JSON.stringify({ ...empty(), roster: ['lvbu', 'ghost'] })));
    expect(out.roster).toEqual(expect.arrayContaining([...STARTER_IDS, 'lvbu']));
    expect(out.roster).not.toContain('ghost');
  });
});

describe('loadSave 손상 내성', () => {
  const load = (v: unknown) => loadSave(fakeStorage(JSON.stringify(v)));
  it('battle.party가 객체/숫자/true여도 throw 없음', () => {
    for (const bad of [{}, 5, true]) {
      const run = startRun('guanyu', 1);
      (run.battle as unknown as { party: unknown }).party = bad;
      expect(() => load({ ...empty(), current: run })).not.toThrow();
    }
  });
  it('current가 42/문자열/배열이면 null', () => {
    for (const bad of [42, 'x', [], true]) expect(load({ ...empty(), current: bad }).current).toBeNull();
  });
  it('battle.party / battle.enemy의 알 수 없는 id → current null', () => {
    const a = startRun('guanyu', 1);
    a.battle!.party[0].id = 'ghost';
    expect(load({ ...empty(), current: a }).current).toBeNull();
    const b = startRun('guanyu', 1);
    b.battle!.enemy.id = 'ghost';
    expect(load({ ...empty(), current: b }).current).toBeNull();
  });
  it('best: 음수·NaN(null)·문자열 → 0', () => {
    expect(load({ ...empty(), best: { wave: -3, clears: 'x' } }).best).toEqual({ wave: 0, clears: 0 });
    expect(load({ ...empty(), best: { wave: null, clears: NaN } }).best).toEqual({ wave: 0, clears: 0 });
    expect(load({ ...empty(), best: 7 }).best).toEqual({ wave: 0, clears: 0 });
  });
  it('최상위 null·배열·원시값 → 기본값', () => {
    expect(load(null)).toEqual(empty());
    expect(load([1, 2])).toEqual(empty());
    expect(load('str')).toEqual(empty());
  });
  it('history: 비객체·waves 불량 항목 제거, 21개 이상이면 20개', () => {
    const good = rec(1);
    const out = load({ ...empty(), history: [null, 3, 'x', { waves: 'no' }, { waves: [1] }, good] });
    expect(out.history).toEqual([good]);
    expect(load({ ...empty(), history: Array.from({ length: 25 }, () => good) }).history).toHaveLength(20);
    expect(load({ ...empty(), history: {} }).history).toEqual([]);
  });
  it('roster가 배열이 아니면 시작 장수만', () => {
    expect(load({ ...empty(), roster: 'lvbu' }).roster).toEqual([...STARTER_IDS]);
    expect(load({ ...empty(), roster: { a: 1 } }).roster).toEqual([...STARTER_IDS]);
  });
});

describe('writeSave', () => {
  it('setItem이 throw → false', () => {
    const s = { getItem: () => null, setItem: () => { throw new Error('quota'); }, removeItem() {} };
    expect(writeSave(s, empty())).toBe(false);
  });
  it('null storage → false', () => {
    expect(writeSave(null, empty())).toBe(false);
  });
});

describe('recordRunEnd', () => {
  it('history 21개 → 20개, 최신이 앞', () => {
    let d = empty();
    for (let i = 1; i <= 21; i++) d = recordRunEnd(d, rec(i));
    expect(d.history).toHaveLength(20);
    expect(d.history[0].waves).toHaveLength(21);
  });
  it('best.wave는 최대값, cleared면 clears+1, current null', () => {
    let d = { ...empty(), current: startRun('guanyu', 1) };
    d = recordRunEnd(d, rec(10));
    d = recordRunEnd(d, rec(4));
    expect(d.best.wave).toBe(10);
    expect(d.best.clears).toBe(0);
    d = recordRunEnd(d, rec(18, { cleared: true }));
    expect(d.best).toEqual({ wave: 18, clears: 1 });
    expect(d.current).toBeNull();
  });
  it('영입 장수가 roster에 합쳐진다 (중복 없음)', () => {
    const r = rec(2);
    r.waves[0] = { wave: 1, enemy: 'lvbu', turns: 2, recruited: true };
    r.waves[1] = { wave: 2, enemy: 'mob', turns: 2 };
    const d = recordRunEnd(recordRunEnd(empty(), r), r);
    expect(d.roster).toContain('lvbu');
    expect(d.roster).not.toContain('mob');
    expect(new Set(d.roster).size).toBe(d.roster.length);
  });
});
