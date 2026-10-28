// RunState·SaveData → 장면이 그리는 값(순수 함수, Phaser 없음)
import { damageRange, effOf, enemyIntent, makeFighter, plannedSkill, skillsOf, speedOf } from '@/lib/duel/battle';
import { DUEL_GENERALS, getDuelGeneral, MOB_ID } from '@/lib/duel/generals';
import { getReward, rewardEffect } from '@/lib/duel/rewards';
import { SKILLS, skillDesc } from '@/lib/duel/skills';
import { narrate } from '@/lib/duel/narrative';
import { wrapText } from '@/game/duel/wrap';
import { MSG_CHARS } from '@/game/duel/layout';
import { euro, josa } from '@/lib/josa';
import { WAVES, bossIdFor, isBossWave, markRecruitHandled, swapInRecruit } from '@/lib/duel/run';
import type { Rng } from '@/lib/duel/rng';
import type { UiAction } from '@/game/duel/bridge';
import type { Fighter, RunRecord, RunState, SaveData } from '@/lib/duel/types';
import { EFF_WORD } from '@/game/duel/bridge';
import type { BattleFocusId, BattleView, FighterView, IntentView, PickView, RecruitView, ResultShow, RewardShow, StartShow } from '@/game/duel/bridge';

export { MSG_CHARS };
const MSG_KEEP = 3;

const nameOf = (id: string) => getDuelGeneral(id)?.name ?? id;

/** 사건 글을 MSG_CHARS(14)자 이하 줄로 나누고 마지막 3줄만 */
export function messageLines(texts: string[], max = MSG_CHARS, keep = MSG_KEEP): string[] {
  return texts.flatMap((t) => wrapText(t, max)).slice(-keep);
}

/** 상태 이름 표시 순서(최대 2개) */
const STATUS_LABELS: [keyof Fighter['status'], string][] = [
  ['taunt', '도발'],
  ['confuse', '혼란'],
  ['burn', '화상'],
  ['shouted', '위축'],
  ['ambush', '매복'],
];

/** 능력치 한 줄: 무력·지력은 보너스 합산, 속도는 speedOf */
export function statsLine(f: Fighter): string {
  const g = getDuelGeneral(f.id)!;
  return `무${g.stats.무력 + f.bonus.atk} 지${g.stats.지력 + f.bonus.int} 통${g.stats.통솔} 속${speedOf(f)}`;
}

/** foe: 상대 선두(기술의 유불리·피해 범위를 이 상대 기준으로 채운다) */
function fighterView(f: Fighter, foe: Fighter): FighterView {
  const g = getDuelGeneral(f.id)!;
  const foeKind = getDuelGeneral(foe.id)!.kind;
  return {
    id: f.id,
    name: g.name,
    kind: g.kind,
    level: f.level,
    hp: Math.max(0, f.hp),
    maxHp: f.maxHp,
    stats: { 무력: g.stats.무력 + f.bonus.atk, 지력: g.stats.지력 + f.bonus.int, 통솔: g.stats.통솔, 속도: speedOf(f) },
    // 옛 저장에 status가 없을 수 있다
    status: STATUS_LABELS.filter(([k]) => f.status?.[k]).map(([, label]) => label).slice(0, 2),
    skills: skillsOf(f).map((id) => {
      const sk = SKILLS[id];
      const attack = !!sk && sk.power > 0;
      return {
        id,
        name: sk?.name ?? id,
        kind: sk?.kind ?? g.kind,
        usesLeft: f.uses[id] ?? null,
        eff: attack ? effOf(sk.kind, foeKind) : null,
        dmg: attack ? damageRange(f, foe, sk) : null,
        desc: skillDesc(id),
      };
    }),
  };
}

const isUlt = (id: string) => id.endsWith('_ult');

/** 적의 이번 턴 의도 값 */
function intentView(enemy: Fighter, lead: Fighter, intent: { skillId: string; sure: boolean }): IntentView {
  const sk = SKILLS[intent.skillId];
  return {
    skillId: intent.skillId,
    name: sk.name,
    eff: effOf(sk.kind, getDuelGeneral(lead.id)!.kind),
    dmg: sk.power > 0 ? damageRange(enemy, lead, sk) : null,
    sure: intent.sure,
    ult: isUlt(intent.skillId),
  };
}

/** 전투 화면 값. 전투 중이 아니면 null */
export function toBattleView(run: RunState): BattleView | null {
  const b = run.battle;
  if (!b) return null;
  const lead = b.party[b.active];
  const player = fighterView(lead, b.enemy);
  const enemyBase = fighterView(b.enemy, lead);
  const intent = intentView(b.enemy, lead, enemyIntent(b));
  const events = run.lastEvents ?? [];
  const message = events.length
    ? messageLines(events.map((e) => e.text))
    : messageLines([
        `제${run.wave}전, ${enemyBase.name} 등장!`,
        `${enemyBase.name} 다음 ${intent.name}`,
        run.wave === 1 && b.turn === 1 ? '상성 맹>기>지>맹' : `${player.name}, 무엇을 할까?`,
      ]);
  const enemyKind = enemyBase.kind;
  const to = nextSwitchIndex(run);
  const incoming = to === null ? null : b.party[to];
  return {
    wave: run.wave,
    turn: b.turn,
    player,
    matchup: effOf(player.kind, enemyKind),
    enemy: { ...enemyBase, isBoss: isBossWave(run.wave), ...(b.enemy.status.charging ? { charging: true } : {}), intent },
    party: b.party.map((f) => ({ id: f.id, name: nameOf(f.id), hp: Math.max(0, f.hp), maxHp: f.maxHp })),
    switchTo: incoming
      ? {
          index: to!,
          name: nameOf(incoming.id),
          eff: effOf(getDuelGeneral(incoming.id)!.kind, enemyKind),
          hurt: incoming.hp < incoming.maxHp / 2,
        }
      : null,
    message,
  };
}

/**
 * 고른 줄의 미리보기 0~3줄(각 줄 MSG_CHARS 이하). 실행할 수 없는 줄은 [].
 * 도발 중이면 실제로 나갈 기술(기본 공격)로 계산한다. hint: 셋째 줄 "한 번 더 누르면 결정"
 */
export function battlePreview(run: RunState, id: BattleFocusId, hint: boolean): string[] {
  const b = run.battle;
  if (!b) return [];
  const lead = b.party[b.active];
  const intent = enemyIntent(b);
  const enemySkill = SKILLS[intent.skillId];
  const tail = hint ? ['한 번 더 누르면 결정'] : [];
  if (id === 'switch') {
    const to = nextSwitchIndex(run);
    if (to === null) return [];
    const incoming = b.party[to];
    // 적 기술이 들어올 장수에게 유리하면 그 장수에겐 불리
    const word = EFF_WORD[({ win: 'lose', lose: 'win', even: 'even' } as const)[effOf(enemySkill.kind, getDuelGeneral(incoming.id)!.kind)]];
    const line = `${enemySkill.name}에 ${word}`;
    return [`▶교체 ${nameOf(incoming.id)}`, wrapText(line, MSG_CHARS)[0], ...tail];
  }
  const chosen = skillsOf(lead)[Number(id.slice(5))];
  if (!chosen) return [];
  // 횟수가 다 떨어진 줄은 실행할 수 없다(DuelClient.rowInfo와 같다)
  if (lead.uses[chosen] === 0) return [];
  const planned = plannedSkill(lead, chosen);
  const sk = SKILLS[planned];
  const head = `▶${sk.name}`;
  if (sk.power > 0) {
    const r = damageRange(lead, b.enemy, sk);
    const word = EFF_WORD[effOf(sk.kind, getDuelGeneral(b.enemy.id)!.kind)];
    const body = planned !== chosen ? `도발 중 ${word} ${r.min}~${r.max}` : `${word} 예상 ${r.min}~${r.max}`;
    return [head, body, ...tail];
  }
  if (sk.effect === 'guard') {
    const dmg = SKILLS[intent.skillId].power > 0 ? damageRange(b.enemy, lead, SKILLS[intent.skillId]) : null;
    return [head, dmg ? `피해 절반 ~${Math.max(1, Math.round(dmg.max * 0.5))}` : skillDesc(planned).long, ...tail];
  }
  return [head, skillDesc(planned).long, ...tail];
}

/** 전투 메뉴 한 줄의 이름(aria-label 바탕)과 실행할 행동. 실행할 수 없으면 action null */
export function battleRowInfo(run: RunState, id: BattleFocusId): { label: string; action: UiAction | null } {
  if (!run.battle) return { label: '', action: null };
  const view = toBattleView(run);
  if (id === 'switch') {
    const to = nextSwitchIndex(run);
    const sw = view?.switchTo;
    return to === null || !sw
      ? { label: '교체할 장수 없음', action: null }
      : { label: `${euro(sw.name)} 교체 ${EFF_WORD[sw.eff]}`, action: { type: 'switch', toIndex: to } };
  }
  const sk = view?.player.skills[Number(id.slice(5))];
  if (!sk) return { label: '', action: null };
  const uses = sk.usesLeft === null ? '무제한' : `남은 ${sk.usesLeft}회`;
  const body = sk.eff ? `${sk.name} ${EFF_WORD[sk.eff]}` : `${sk.name} ${sk.desc.long}`;
  return { label: `${body} ${uses}`, action: sk.usesLeft === 0 ? null : { type: 'skill', skillId: sk.id } };
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
    leadStats: `${nameOf(selected)} ${statsLine(makeFighter(selected, 1))}`,
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
    stats: `무${g.stats.무력} 지${g.stats.지력} 통${g.stats.통솔}`,
    full: pick.full,
  };
}

/** 보상 대상 줄 보조글: 능력치 보상이면 오를 능력치의 현재값과 폭을 함께 */
function targetSub(f: Fighter, hp: string, eff: ReturnType<typeof rewardEffect>): string {
  const base = `Lv${f.level} ${hp}`;
  if (!eff) return base;
  const g = getDuelGeneral(f.id)!;
  const [prefix, cur] =
    eff.stat === 'atk' ? ['무', g.stats.무력 + f.bonus.atk] : eff.stat === 'int' ? ['지', g.stats.지력 + f.bonus.int] : ['속', speedOf(f)];
  return `${base} ${prefix}${cur}+${eff.amount}`;
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
  const eff = rewardEffect(pick.rewardId);
  return {
    title: `${getReward(pick.rewardId).name}: 누구에게 줄까?`,
    options: [
      ...pick.targets.map((i) => ({ label: nameOf(run.party[i].id), sub: targetSub(run.party[i], hpSub(i), eff) })),
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
