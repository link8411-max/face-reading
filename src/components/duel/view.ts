// RunState·SaveData → 장면이 그리는 값(순수 함수, Phaser 없음)
import { skillsOf } from '@/lib/duel/battle';
import { BOSS_WAVES, WAVES } from '@/lib/duel/run';
import { BOSS_IDS, DUEL_GENERALS, getDuelGeneral, MOB_ID } from '@/lib/duel/generals';
import { getReward } from '@/lib/duel/rewards';
import { SKILLS } from '@/lib/duel/skills';
import { narrate } from '@/lib/duel/narrative';
import { wrapText } from '@/game/duel/wrap';
import type { Fighter, RunRecord, RunState, SaveData } from '@/lib/duel/types';
import type { BattleView, FighterView, PickView, ResultShow, RewardShow, StartShow } from '@/game/duel/bridge';

/** 대사창 한 줄 글자 수(9px 글씨로 창 너비에 맞는 값) */
export const MSG_CHARS = 18;
const MSG_KEEP = 3;

const nameOf = (id: string) => getDuelGeneral(id)?.name ?? id;

/** 사건 글을 18자 이하 줄로 나누고 마지막 3줄만 */
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
    enemy: { ...enemy, isBoss: getDuelGeneral(b.enemy.id)?.role === 'boss' },
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
  };
}

function historyLine(r: RunRecord): string {
  const w = r.waves.length;
  return `${narrate(r).title} 제${w}전${r.cleared ? ' 완주' : ''}`;
}

/** 다음 싸움 한 줄: 보스는 이름, 졸개 구간은 졸개, 나머지는 모른다 */
function nextLine(wave: number): string {
  const n = wave + 1;
  const b = (BOSS_WAVES as readonly number[]).indexOf(n);
  if (b >= 0) {
    return `제${n}전 — ${nameOf(BOSS_IDS[b])} (보스)  이기면 전원 회복`;
  }
  if (n <= 3) return `제${n}전 — ${nameOf(MOB_ID)}`;
  return `제${n}전 — 누가 막아설지 모른다`;
}

/** 보상 화면 값. pick이 있으면 그 고르기 창을 카드 위에 띄운다 */
export function toRewardShow(run: RunState, pick?: PickView): RewardShow {
  const w = run.record.waves[run.record.waves.length - 1];
  const foe = w ? nameOf(w.enemy) : '';
  const joined = !!w?.recruited && run.party.some((f) => f.id === w.enemy);
  const headline = !w
    ? '보상 하나를 고르시오'
    : w.recruited
      ? `제${run.wave}전 승리 — ${foe}이(가) 항복${joined ? '하여 합류하였다' : '하였다'}.`
      : `제${run.wave}전 승리 — ${foe}을(를) 꺾었다.`;
  return {
    headline,
    cards: run.rewardsOffered.map((id) => {
      const r = getReward(id);
      return { id: r.id, name: r.name, desc: r.desc, rarity: r.rarity };
    }),
    party: run.party.map((f) => nameOf(f.id)),
    next: run.wave >= WAVES ? '' : nextLine(run.wave),
    ...(pick ? { pick } : {}),
  };
}

/** 결과 화면 값(열전) */
export function toResultShow(record: RunRecord, save: SaveData): ResultShow {
  const { title, headline, lines } = narrate(record);
  return { starter: record.starter, title, headline, lines, best: save.best.wave, clears: save.best.clears };
}
