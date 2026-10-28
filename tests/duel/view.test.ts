import { describe, it, expect } from 'vitest';
import { createRng } from '@/lib/duel/rng';
import { makeFighter } from '@/lib/duel/battle';
import { getDuelGeneral } from '@/lib/duel/generals';
import { afterWin, playerTurn, startRun } from '@/lib/duel/run';
import { defaultSave } from '@/lib/duel/save';
import {
  MSG_CHARS,
  battlePreview,
  messageLines,
  nextSwitchIndex,
  pendingRecruit,
  pickView,
  recruitView,
  resolveRecruitPick,
  toBattleView,
  toRewardShow,
  toStartShow,
} from '@/components/duel/view';
import { wrapText } from '@/game/duel/wrap';
import type { RunState } from '@/lib/duel/types';

describe('wrapText', () => {
  it('띄어쓰기에서 끊고, 긴 낱말은 자른다', () => {
    expect(wrapText('관우의 청룡언월도 참!', 18)).toEqual(['관우의 청룡언월도 참!']);
    const out = wrapText('매복한 황건적 졸개의 반격! 12의 피해!', 10);
    expect(out.every((l) => l.length <= 10)).toBe(true);
    expect(out.join(' ')).toBe('매복한 황건적 졸개의 반격! 12의 피해!');
    expect(wrapText('가'.repeat(25), 10)).toEqual(['가'.repeat(10), '가'.repeat(10), '가'.repeat(5)]);
  });
});

describe('messageLines', () => {
  it('줄마다 MSG_CHARS(14)자 이하, 마지막 3줄', () => {
    const lines = messageLines([
      '관우의 일격!',
      '황건적 졸개에게 12의 피해!',
      '매복한 황건적 졸개의 반격! 6의 피해!',
      '황건적 졸개는 불길에 휩싸였다! 3의 피해!',
    ]);
    expect(lines).toHaveLength(3);
    expect(MSG_CHARS).toBe(14);
    expect(lines.every((l) => l.length <= MSG_CHARS)).toBe(true);
    expect(lines[2]).toContain('피해!');
  });
});

describe('toBattleView', () => {
  const run = startRun('guanyu', 7);

  it('체력·최대 체력·남은 횟수·보스 여부', () => {
    const v = toBattleView(run)!;
    const p = run.battle!.party[0];
    expect(v.wave).toBe(1);
    expect(v.turn).toBe(1);
    expect(v.player).toMatchObject({ id: 'guanyu', name: '관우', kind: '맹장', level: 1, hp: p.hp, maxHp: p.maxHp });
    expect(v.player.skills.map((s) => s.id)).toEqual(['strike', 'guanyu_ult', 'guard', 'shout']);
    expect(v.player.skills[0].usesLeft).toBeNull();
    expect(v.player.skills[1].usesLeft).toBe(3);
    expect(v.enemy).toMatchObject({ id: 'mob', isBoss: false, hp: run.battle!.enemy.hp });
    expect(v.party).toEqual([{ id: 'guanyu', name: '관우', hp: p.hp, maxHp: p.maxHp }]);
    expect(v.message.length).toBeGreaterThan(0);
  });

  it('보스면 isBoss, 기술을 쓰면 남은 횟수가 준다, 대사는 이번 턴 사건', () => {
    const r: RunState = structuredClone(run);
    r.wave = 18;
    r.enemy = makeFighter('lvbu', 21);
    r.battle!.enemy = r.enemy;
    const next = playerTurn(r, { type: 'skill', skillId: 'guanyu_ult' }, createRng(1));
    const v = toBattleView(next)!;
    expect(v.enemy.isBoss).toBe(true);
    expect(v.player.skills[1].usesLeft).toBe(2);
    expect(v.message.length).toBeLessThanOrEqual(3);
    expect(v.message.every((l) => l.length <= MSG_CHARS)).toBe(true);
  });

  it('전투가 아니면 null', () => {
    expect(toBattleView({ ...run, battle: null, phase: 'reward' })).toBeNull();
  });
});

describe('nextSwitchIndex', () => {
  it('혼자면 null, 둘 이상이면 다음 살아 있는 장수', () => {
    const run = startRun('guanyu', 7);
    expect(nextSwitchIndex(run)).toBeNull();
    const r = structuredClone(run);
    const a = makeFighter('zhangfei', 1);
    const b = makeFighter('zhaoyun', 1);
    a.hp = 0;
    r.party = [r.party[0], a, b];
    r.battle!.party = r.party;
    expect(nextSwitchIndex(r)).toBe(2);
  });
});

describe('toStartShow / toRewardShow', () => {
  it('장수록: 시작·영입 장수 9명, 잠김 표시, 기록 5개까지', () => {
    const save = defaultSave();
    const s = toStartShow({ ...save, roster: [...save.roster, 'machao'] }, 'guanyu');
    expect(s.roster).toHaveLength(9);
    expect(s.roster.find((g) => g.id === 'machao')!.locked).toBe(false);
    expect(s.roster.find((g) => g.id === 'zhouyu')!.locked).toBe(false); // 시작 장수
    expect(s.roster.find((g) => g.id === 'jiangwei')!.locked).toBe(true);
    expect(s.roster.some((g) => g.id === 'lvbu' || g.id === 'mob')).toBe(false);
    expect(s.selected).toBe('guanyu');
  });

  it('보상 화면: 카드 3장·동행 이름·다음 싸움', () => {
    const rng = createRng(3);
    let run = startRun('guanyu', 3);
    // 1전은 졸개라 관우 일격 한 번에 이긴다(시드 3)
    while (run.phase === 'battle') run = playerTurn(run, { type: 'skill', skillId: 'strike' }, rng);
    expect(run.phase).toBe('reward');
    const r = toRewardShow(run);
    expect(r.cards).toHaveLength(3);
    expect(r.cards[0]).toHaveProperty('rarity');
    expect(r.party).toContain('관우');
    expect(r.next).toContain('제2전');
  });
});

describe('항복 창 상태(pendingRecruit · resolveRecruitPick)', () => {
  /** 4전 마초가 항복한 직후(보상 단계). extra: 이미 동행 중인 장수 */
  function surrendered(extra: string[] = []): RunState {
    const r = structuredClone(startRun('guanyu', 1));
    r.party.push(...extra.map((id) => makeFighter(id, 1)));
    r.wave = 4;
    r.enemy = makeFighter('machao', 4);
    r.battle = { party: r.party, active: 0, enemy: { ...r.enemy, hp: 0 }, turn: 1 };
    r.record.waves = [{ wave: 4, enemy: 'machao', turns: 2 }];
    r.enemy.hp = 0;
    return afterWin(r, () => 0); // 난수 0 → 항복 성공
  }

  it('자리가 있으면 합류(full=false), "함께 간다" 한 줄', () => {
    const run = surrendered();
    expect(run.party.map((f) => f.id)).toEqual(['guanyu', 'machao']);
    const p = pendingRecruit(run)!;
    expect(p).toEqual({ id: 'machao', full: false });
    const pick = { kind: 'recruit' as const, recruitId: p.id, full: p.full };
    expect(pickView(run, pick)!.options.map((o) => o.label)).toEqual(['함께 간다']);
    expect(recruitView(run, pick)).toMatchObject({ title: '마초가 항복했다!', slots: 3, full: false });
    const next = resolveRecruitPick(run, pick, 0, createRng(1));
    expect(next.party).toEqual(run.party);
    expect(pendingRecruit(next)).toBeNull();
  });

  it('가득 차면 full=true, 보내기 n줄 + 데려가지 않는다; 교체하면 자리가 바뀌고 처리됨', () => {
    const run = surrendered(['zhangfei', 'zhaoyun']);
    const p = pendingRecruit(run)!;
    expect(p).toEqual({ id: 'machao', full: true });
    const pick = { kind: 'recruit' as const, recruitId: p.id, full: p.full };
    expect(pickView(run, pick)!.options.map((o) => o.label)).toEqual(['관우 보내기', '장비 보내기', '조운 보내기', '데려가지 않는다']);
    const swapped = resolveRecruitPick(run, pick, 1, createRng(1));
    expect(swapped.party.map((f) => f.id)).toEqual(['guanyu', 'machao', 'zhaoyun']);
    expect(swapped.record.waves.at(-1)!.recruitHandled).toBe(true);
    expect(pendingRecruit(swapped)).toBeNull();
    // 입력은 그대로
    expect(run.record.waves.at(-1)!.recruitHandled).toBeUndefined();
  });

  it('데려가지 않으면 동행 그대로, 처리됨 → 저장했다 이어하기(같은 값) 해도 창이 다시 뜨지 않는다', () => {
    const run = surrendered(['zhangfei', 'zhaoyun']);
    const pick = { kind: 'recruit' as const, recruitId: 'machao', full: true };
    const declined = resolveRecruitPick(run, pick, 3, createRng(1));
    expect(declined.party.map((f) => f.id)).toEqual(['guanyu', 'zhangfei', 'zhaoyun']);
    const resumed = JSON.parse(JSON.stringify(declined)) as RunState;
    expect(pendingRecruit(resumed)).toBeNull();
    // 처리 전 저장이면 이어하기 때 다시 묻는다
    expect(pendingRecruit(JSON.parse(JSON.stringify(run)) as RunState)).toEqual({ id: 'machao', full: true });
  });

  it('항복이 없거나 전투 중이면 null', () => {
    expect(pendingRecruit(startRun('guanyu', 1))).toBeNull();
  });
});

describe('화면 값: 상성·의도·미리보기·능력치 줄', () => {
  it('toBattleView: 상성·의도·기술 유불리·설명', () => {
    const run = startRun('guanyu', 7); // 적 졸개(맹장)
    const v = toBattleView(run)!;
    expect(v.matchup).toBe('even');
    expect(v.enemy.intent).toMatchObject({ skillId: 'strike', name: '일격', eff: 'even', sure: true, ult: false });
    expect(v.enemy.intent.dmg!.min).toBeGreaterThan(0);
    expect(v.player.skills[0]).toMatchObject({ eff: 'even', desc: { long: '기본 공격' } });
    expect(v.player.skills[2]).toMatchObject({ eff: null, dmg: null, desc: { long: '이번 턴 피해 절반' } });
    expect(v.player.stats.무력).toBe(getDuelGeneral('guanyu')!.stats.무력);
    expect(v.message).toContain('상성 맹>기>지>맹');
    expect(v.message.every((l) => l.length <= MSG_CHARS)).toBe(true);
  });

  it('toBattleView: 지장 상대면 불리, 적 의도는 나에게 win', () => {
    const run = structuredClone(startRun('guanyu', 7));
    run.battle!.enemy = makeFighter('zhouyu', 1);
    run.enemy = run.battle!.enemy;
    const v = toBattleView(run)!;
    expect(v.matchup).toBe('lose');
    expect(v.enemy.intent).toMatchObject({ skillId: 'zhouyu_ult', eff: 'win', ult: true });
    expect(v.player.skills[0].eff).toBe('lose');
  });

  it('toBattleView: 교체 줄과 상태 표', () => {
    const run = structuredClone(startRun('guanyu', 7));
    run.battle!.party.push(makeFighter('zhouyu', 1));
    run.party = run.battle!.party;
    run.battle!.enemy = makeFighter('zhaoyun', 1);
    run.enemy = run.battle!.enemy;
    run.battle!.party[0].status = { taunt: 2, burn: 1 };
    const v = toBattleView(run)!;
    expect(v.switchTo).toMatchObject({ index: 1, name: '주유', eff: 'lose', hurt: false });
    expect(v.player.status).toEqual(['도발', '화상']);
  });

  it('toBattleView: eff·status 없는 옛 사건도 그린다', () => {
    const run = structuredClone(startRun('guanyu', 7));
    run.lastEvents = [{ who: 'player', kind: 'hit', amount: 3, text: '졸개에게 3의 피해!' }];
    expect(() => toBattleView(run)).not.toThrow();
    const old = structuredClone(startRun('guanyu', 7));
    expect(toBattleView(old)!.player.status).toEqual([]);
  });

  it('battlePreview', () => {
    const run = startRun('guanyu', 7);
    const p = battlePreview(run, 'skill0', true);
    expect(p[0]).toBe('▶일격');
    expect(p[1]).toMatch(/^비등 예상 \d+~\d+$/);
    expect(p[2]).toBe('한 번 더 누르면 결정');
    expect(battlePreview(run, 'skill0', false)).toHaveLength(2);
    expect(battlePreview(run, 'skill2', true)[1]).toMatch(/^피해 절반 ~\d+$/);
    expect(battlePreview(run, 'switch', true)).toEqual([]);
    const r2 = structuredClone(run);
    r2.battle!.party[0].uses.guanyu_ult = 0;
    expect(battlePreview(r2, 'skill1', true)).toEqual([]);
    const r3 = structuredClone(run);
    r3.battle!.party[0].status.taunt = 1;
    expect(battlePreview(r3, 'skill1', false)).toEqual(['▶일격', expect.stringMatching(/^도발 중 비등 \d+~\d+$/)]);
    for (const id of ['skill0', 'skill1', 'skill2', 'skill3'] as const) {
      for (const l of battlePreview(run, id, true)) expect(l.length).toBeLessThanOrEqual(MSG_CHARS);
    }
    expect(battlePreview(run, 'skill0', true)[0].length).toBeLessThanOrEqual(9);
  });

  it('battlePreview: 교체는 들어올 장수 입장의 유불리', () => {
    const run = structuredClone(startRun('guanyu', 7));
    run.battle!.party.push(makeFighter('zhouyu', 1));
    run.party = run.battle!.party;
    run.battle!.enemy = makeFighter('zhaoyun', 1);
    run.enemy = run.battle!.enemy;
    const p = battlePreview(run, 'switch', true);
    expect(p[0]).toBe('▶교체 주유');
    expect(p).toHaveLength(3);
    expect(p[1]).toMatch(/에 (유리|불리|비등)$/);
    expect(p[1].length).toBeLessThanOrEqual(MSG_CHARS);
  });

  it('능력치 줄: 시작 화면·항복 창·보상 대상', () => {
    expect(toStartShow(defaultSave(), 'guanyu').leadStats).toMatch(/^관우 무\d+ 지\d+ 통\d+ 속\d+$/);
    const run = startRun('guanyu', 7);
    const rv = recruitView(run, { kind: 'recruit', recruitId: 'machao', full: false })!;
    expect(rv.stats).toMatch(/^무\d+ 지\d+ 통\d+$/);
    const pv = pickView(run, { kind: 'target', rewardId: 'sword', targets: [0] })!;
    expect(pv.options[0].sub).toMatch(/^Lv1 \d+\/\d+ 무\d+\+8$/);
    const book = pickView(run, { kind: 'target', rewardId: 'book', targets: [0] })!;
    expect(book.options[0].sub).toMatch(/^Lv1 \d+\/\d+ 지\d+\+10$/);
  });
});
