import { describe, it, expect } from 'vitest';
import { createRng } from '@/lib/duel/rng';
import { makeFighter, resolveTurn } from '@/lib/duel/battle';
import type { BattleState, Fighter } from '@/lib/duel/types';

/** 난수 고정 1.0 (피해 계수 최대, 치명타·혼란 실패 없음) */
const ONE = () => 0.999999;

function state(party: Fighter[], enemy: Fighter): BattleState {
  return { party, active: 0, enemy, turn: 1 };
}

const texts = (r: { log: { text: string }[] }) => r.log.map((e) => e.text);

describe('전투 문구 조사 (받침 있는 이름·없는 이름)', () => {
  it('은/는: 혼란 문구', () => {
    const a = resolveTurn(state([makeFighter('zhouyu', 10)], makeFighter('guanyu', 10)), { type: 'skill', skillId: 'confuse' }, ONE);
    expect(texts(a)).toContain('관우는 혼란에 빠졌다!');
    const b = resolveTurn(state([makeFighter('zhouyu', 10)], makeFighter('zhaoyun', 10)), { type: 'skill', skillId: 'confuse' }, ONE);
    expect(texts(b)).toContain('조운은 혼란에 빠졌다!');
  });

  it('이/가: 쓰러짐 문구', () => {
    const foe1 = makeFighter('zhaoyun', 10);
    foe1.hp = 1;
    expect(texts(resolveTurn(state([makeFighter('guanyu', 10)], foe1), { type: 'skill', skillId: 'strike' }, ONE))).toContain('조운이 쓰러졌다!');
    const foe2 = makeFighter('guanyu', 10);
    foe2.hp = 1;
    expect(texts(resolveTurn(state([makeFighter('zhaoyun', 10)], foe2), { type: 'skill', skillId: 'thrust' }, ONE))).toContain('관우가 쓰러졌다!');
  });

  it('을/를: 기술이 바닥난 문구', () => {
    const me = makeFighter('guanyu', 10);
    me.uses = { ...me.uses, shout: 0, guanyu_ult: 0 };
    const r1 = resolveTurn(state([me], makeFighter('zhouyu', 10)), { type: 'skill', skillId: 'shout' }, ONE);
    expect(texts(r1).some((t) => t.startsWith('일갈을 쓸 힘이 남지 않았다!'))).toBe(true);
    const r2 = resolveTurn(state([me], makeFighter('zhouyu', 10)), { type: 'skill', skillId: 'guanyu_ult' }, ONE);
    expect(texts(r2).some((t) => t.startsWith('청룡언월도 참을 쓸 힘이 남지 않았다!'))).toBe(true);
  });

  it('체력이 가득할 때 숨 고르기: "0 회복" 대신 기력이 넘친다(숫자 없음)', () => {
    // 조운(속도 +10)이 먼저 움직여 체력이 가득한 채로 숨을 고른다
    const r = resolveTurn(state([makeFighter('zhaoyun', 10)], makeFighter('guanyu', 10)), { type: 'skill', skillId: 'breathe' }, ONE);
    const ev = r.log.find((e) => e.text.includes('숨을 골랐다'))!;
    expect(ev.text).toBe('조운은 숨을 골랐다. 이미 기력이 넘친다!');
    expect(ev.amount).toBeUndefined();
    expect(texts(r).some((t) => t.includes('0 회복'))).toBe(false);
  });

  it('다친 뒤 숨 고르기는 회복량을 알린다', () => {
    const me = makeFighter('zhaoyun', 10);
    me.hp = Math.floor(me.maxHp / 2);
    const r = resolveTurn(state([me], makeFighter('guanyu', 10)), { type: 'skill', skillId: 'breathe' }, ONE);
    expect(texts(r).some((t) => /^조운은 숨을 골랐다\. 체력 \d+ 회복!$/.test(t))).toBe(true);
  });

  it('여러 턴 문구에 (은)·(는)·(가)·(를)·(으) 같은 괄호 조사가 없다', () => {
    const rng = createRng(7);
    const me = makeFighter('zhouyu', 20);
    me.maxHp = me.hp = 5000;
    const boss = { ...makeFighter('dongzhuo', 20), boss: true };
    boss.maxHp = boss.hp = 5000;
    let cur = state([me, makeFighter('guanyu', 20)], boss);
    for (let t = 0; t < 30 && cur.enemy.hp > 0 && cur.party[cur.active].hp > 0; t++) {
      const pick = ['scheme', 'confuse', 'breathe', 'zhouyu_ult'][t % 4];
      const r = resolveTurn(cur, { type: 'skill', skillId: pick }, rng);
      for (const x of texts(r)) expect(x).not.toMatch(/\((은|는|이|가|을|를|으)\)/);
      cur = r.state;
    }
  });
});

describe('보스 예고 중 도발·혼란 (charging이 남지 않고 필살기도 두 번 나가지 않는다)', () => {
  const telegraphed = () => {
    const e = { ...makeFighter('dongzhuo', 10), boss: true };
    const t1 = resolveTurn(state([makeFighter('zhouyu', 10)], e), { type: 'skill', skillId: 'scheme' }, ONE).state;
    expect(t1.enemy.status.charging).toBe('dongzhuo_ult');
    return t1;
  };
  const ultCount = (log: { who: string; kind: string; skillId?: string }[]) =>
    log.filter((x) => x.who === 'enemy' && x.kind === 'skill' && x.skillId === 'dongzhuo_ult').length;

  it('예고 중 도발에 걸리면: 그 턴은 기본 공격, charging은 사라지고 도발 중엔 다시 예고하지 않는다', () => {
    const t1 = telegraphed();
    t1.enemy.status.taunt = 2;
    const r = resolveTurn(t1, { type: 'skill', skillId: 'scheme' }, ONE);
    expect(ultCount(r.log)).toBe(0);
    expect(r.state.enemy.status.charging).toBeUndefined();
    expect(r.state.enemy.uses.dongzhuo_ult).toBe(3);
    // 도발이 남은 다음 턴에도 필살기는 없다. 그 턴에 도발이 풀리면 턴 끝에 다시 예고하고, 그다음 턴에 딱 한 번
    expect(r.state.enemy.status.taunt).toBe(1);
    const r2 = resolveTurn(r.state, { type: 'skill', skillId: 'scheme' }, ONE);
    expect(ultCount(r2.log)).toBe(0);
    expect(r2.state.enemy.status.taunt).toBeUndefined();
    expect(r2.state.enemy.status.charging).toBe('dongzhuo_ult');
    const r3 = resolveTurn(r2.state, { type: 'skill', skillId: 'scheme' }, ONE);
    expect(ultCount(r3.log)).toBe(1);
    expect(r3.state.enemy.status.charging).toBeUndefined();
  });

  it('예고 중 혼란으로 허둥대면: 필살기는 나가지 않고 횟수도 그대로, charging은 사라진다', () => {
    const t1 = telegraphed();
    t1.enemy.status.confuse = 1;
    // 0.01: 혼란 실패 확률(50%)에 걸린다
    const r = resolveTurn(t1, { type: 'skill', skillId: 'scheme' }, () => 0.01);
    expect(r.log.some((x) => x.who === 'enemy' && x.kind === 'miss')).toBe(true);
    expect(ultCount(r.log)).toBe(0);
    expect(r.state.enemy.status.charging).toBeUndefined();
    expect(r.state.enemy.uses.dongzhuo_ult).toBe(3);
    // 이후 세 턴: 다시 예고 → 다음 턴에 딱 한 번 → 그 턴엔 다시 예고하지 않는다
    let cur = r.state;
    const perTurn: number[] = [];
    for (let i = 0; i < 3; i++) {
      const x = resolveTurn(cur, { type: 'skill', skillId: 'scheme' }, ONE);
      perTurn.push(ultCount(x.log));
      cur = x.state;
    }
    expect(perTurn).toEqual([0, 1, 0]);
  });
});

describe('상성 문구 (1단계)', () => {
  it('상성 문구: 좋다/나쁘다, 치명타 뒤에 온다', () => {
    const win = resolveTurn(state([makeFighter('guanyu', 10)], makeFighter('zhaoyun', 10)), { type: 'skill', skillId: 'strike' }, ONE);
    expect(win.log.find((e) => e.kind === 'hit' && e.who === 'player')).toMatchObject({ eff: 'win' });
    expect(texts(win).some((t) => /^상성이 좋다! 조운에게 \d+의 피해!$/.test(t))).toBe(true);
    const lose = resolveTurn(state([makeFighter('guanyu', 10)], makeFighter('zhouyu', 10)), { type: 'skill', skillId: 'strike' }, ONE);
    expect(texts(lose).some((t) => /^상성이 나쁘다… 주유에게 \d+의 피해!$/.test(t))).toBe(true);
  });
});
