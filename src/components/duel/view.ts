// RunState·SaveData → 장면이 그리는 값(순수 함수, Phaser 없음)
import { skillsOf } from '@/lib/duel/battle';
import { DUEL_GENERALS, getDuelGeneral, MOB_ID } from '@/lib/duel/generals';
import { getReward } from '@/lib/duel/rewards';
import { SKILLS } from '@/lib/duel/skills';
import { narrate } from '@/lib/duel/narrative';
import { wrapText } from '@/game/duel/wrap';
import { MSG_CHARS } from '@/game/duel/layout';
import { josa } from '@/lib/shareLinks';
import { WAVES, bossIdFor, isBossWave, markRecruitHandled, swapInRecruit } from '@/lib/duel/run';
import type { Rng } from '@/lib/duel/rng';
import type { Fighter, RunRecord, RunState, SaveData } from '@/lib/duel/types';
import type { BattleView, FighterView, PickView, RecruitView, ResultShow, RewardShow, StartShow } from '@/game/duel/bridge';

export { MSG_CHARS };
const MSG_KEEP = 3;

const nameOf = (id: string) => getDuelGeneral(id)?.name ?? id;

/** 사건 글을 MSG_CHARS(14)자 이하 줄로 나누고 마지막 3줄만 */
export function messageLines(texts: string[], max = MSG_CHARS, keep = MSG_KEEP): string[] {
  return texts.flatMap((t) => wrapText(t, max)).slice(-keep);
}

function fighterView(f: Fighter): FighterView {
  const g = getDuelGeneral(f.id)!;
  return {
    id: f.id,
    name: g.name,
    kind: g.kind,
    level: f.level,
    hp: Math.max(0, f.hp),
    maxHp: f.maxHp,
    stats: { 무력: g.stats.무력, 통솔: g.stats.통솔 },
    skills: skillsOf(f).map((id) => ({
      id,
      name: SKILLS[id]?.name ?? id,
      kind: SKILLS[id]?.kind ?? g.kind,
      usesLeft: f.uses[id] ?? null,
    })),
  };
}

/** 전투 화면 값. 전투 중이 아니면 null */
export function toBattleView(run: RunState): BattleView | null {
  const b = run.battle;
  if (!b) return null;
  const player = fighterView(b.party[b.active]);
  const enemy = fighterView(b.enemy);
  const events = run.lastEvents ?? [];
  const message = events.length
    ? messageLines(events.map((e) => e.text))
    : messageLines([`제${run.wave}전, ${enemy.name} 등장!`, `${player.name}, 무엇을 할까?`]);
  return {
    wave: run.wave,
    turn: b.turn,
    player,
    enemy: { ...enemy, isBoss: isBossWave(run.wave) },
    party: b.party.map((f) => ({ id: f.id, name: nameOf(f.id), hp: Math.max(0, f.hp), maxHp: f.maxHp })),
    message,
  };
}

/** 교체 버튼이 보낼 자리: 지금 장수 다음의 살아 있는 장수, 없으면 null */
export function nextSwitchIndex(run: RunState): number | null {
  const b = run.battle;
  if (!b) return null;
  const n = b.party.length;
  for (let k = 1; k < n; k++) {
    const i = (b.active + k) % n;
    if (b.party[i].hp > 0) return i;
  }
  return null;
}

/** 시작 화면: 시작·영입 장수 명단(잠김 표시), 최고 기록, 행군 기록 5개 */
export function toStartShow(save: SaveData, selected: string): StartShow {
  return {
    roster: DUEL_GENERALS.filter((g) => g.role === 'starter' || g.role === 'recruit').map((g) => ({
      id: g.id,
      name: g.name,
      kind: g.kind,
      locked: !save.roster.includes(g.id),
    })),
    best: save.best.wave,
    clears: save.best.clears,
    history: save.history.slice(0, 5).map(historyLine),
    selected,
    ...(save.current && (save.current.phase === 'battle' || save.current.phase === 'reward')
      ? { resume: { starter: save.current.record.starter, name: nameOf(save.current.record.starter), wave: save.current.wave } }
      : {}),
  };
}

function historyLine(r: RunRecord): string {
  const w = r.waves.length;
  return `${narrate(r).title} 제${w}전${r.cleared ? ' 완주' : ''}`;
}

/** 다음 싸움 한 줄: 보스는 이름, 졸개 구간은 졸개, 나머지는 모른다 */
function nextLine(run: RunState): string {
  const n = run.wave + 1;
  const boss = bossIdFor(run, n);
  if (boss) {
    return `제${n}전 — ${nameOf(boss)} (보스)  이기면 전원 회복`;
  }
  if (n <= 3) return `제${n}전 — ${nameOf(MOB_ID)}`;
  return `제${n}전 — 누가 막아설지 모른다`;
}

/** 보상 화면 값. recruit가 있으면 항복 창을, pick만 있으면 고르기 창을 카드 위에 띄운다 */
export function toRewardShow(run: RunState, pick?: PickView, recruit?: RecruitView): RewardShow {
  const w = run.record.waves[run.record.waves.length - 1];
  const foe = w ? nameOf(w.enemy) : '';
  const joined = !!w?.recruited && run.party.some((f) => f.id === w.enemy);
  const headline = !w
    ? '보상 하나를 고르시오'
    : w.recruited
      ? `제${run.wave}전 승리 — ${josa(foe, '이', '가')} 항복${joined ? '하여 합류하였다' : '하였다'}.`
      : `제${run.wave}전 승리 — ${josa(foe, '을', '를')} 꺾었다.`;
  return {
    headline,
    cards: run.rewardsOffered.map((id) => {
      const r = getReward(id);
      return { id: r.id, name: r.name, desc: r.desc, rarity: r.rarity };
    }),
    party: run.party.map((f) => nameOf(f.id)),
    next: run.wave >= WAVES ? '' : nextLine(run),
    ...(pick ? { pick } : {}),
    ...(recruit ? { recruit } : {}),
  };
}

/** 결과 화면 값(열전) */
export function toResultShow(record: RunRecord, save: SaveData): ResultShow {
  const { title, headline, lines } = narrate(record);
  return { starter: record.starter, title, headline, lines, best: save.best.wave, clears: save.best.clears };
}

// ── 보상 단계의 고르기 창(항복·대상) ──

/** 고르기 창 상태: 항복한 장수와 바꿀 자리, 또는 보상 대상 */
export type PendingPick = { kind: 'recruit'; recruitId: string; full: boolean } | { kind: 'target'; rewardId: string; targets: number[] };

/** 이번 싸움에서 항복한 장수(합류했으면 full=false, 자리가 없어 못 들어왔으면 full=true) */
export function pendingRecruit(run: RunState): { id: string; full: boolean } | null {
  const w = run.record.waves[run.record.waves.length - 1];
  // 이미 처리한 항복(이어하기로 다시 들어온 경우 포함)은 다시 띄우지 않는다
  if (run.phase !== 'reward' || !w?.recruited || w.recruitHandled) return null;
  return { id: w.enemy, full: !run.party.some((f) => f.id === w.enemy) };
}

/** 항복 창 값 */
export function recruitView(run: RunState, pick: PendingPick | null): RecruitView | undefined {
  if (pick?.kind !== 'recruit') return undefined;
  const g = getDuelGeneral(pick.recruitId)!;
  const level = run.enemy?.id === pick.recruitId ? run.enemy.level : run.wave;
  return {
    title: `${josa(g.name, '이', '가')} 항복했다!`,
    note: pick.full ? '동행이 가득 찼다. 누구를 보낼까?' : `${josa(g.name, '이', '가')} 동행에 합류했다.`,
    id: g.id,
    name: g.name,
    kind: g.kind,
    level,
    party: run.party.map((f) => ({ id: f.id, name: nameOf(f.id) })),
    slots: run.partyMax,
    full: pick.full,
  };
}

export function pickView(run: RunState, pick: PendingPick | null): PickView | undefined {
  if (!pick) return undefined;
  const hpSub = (i: number) => {
    const f = run.party[i];
    return f.hp <= 0 ? '전사' : `${f.hp}/${f.maxHp}`;
  };
  if (pick.kind === 'recruit') {
    if (!pick.full) return { title: '', options: [{ label: '함께 간다' }] };
    return {
      title: '',
      options: [
        ...run.party.map((f, i) => ({ label: `${nameOf(f.id)} 보내기`, sub: `Lv${f.level} ${hpSub(i)}` })),
        { label: '데려가지 않는다' },
      ],
    };
  }
  return {
    title: `${getReward(pick.rewardId).name}: 누구에게 줄까?`,
    options: [
      ...pick.targets.map((i) => ({ label: nameOf(run.party[i].id), sub: `Lv${run.party[i].level} ${hpSub(i)}` })),
      { label: '다른 보상 고르기' },
    ],
  };
}

/**
 * 항복 창에서 index번 줄을 골랐을 때의 다음 상태. 처리했다는 표시를 남긴다.
 * 합류(full=false): 줄은 "함께 간다" 하나. 가득(full=true): 0..n-1은 그 자리와 교체, n은 데려가지 않음
 */
export function resolveRecruitPick(run: RunState, pick: Extract<PendingPick, { kind: 'recruit' }>, index: number, rng: Rng): RunState {
  const next = pick.full && index < run.party.length ? swapInRecruit(run, pick.recruitId, index, rng) : run;
  return markRecruitHandled(next);
}
