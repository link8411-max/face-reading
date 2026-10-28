// 일기토 전투 한 턴: 상성·피해·교체·효과. 순수 함수만 두고 입력 상태는 바꾸지 않는다.
import { josa } from '@/lib/josa';
import { BALANCE } from './balance';
import { getDuelGeneral } from './generals';
import { SKILLS, SKILL_RULES } from './skills';
import type { Rng } from './rng';
import type { Action, BattleState, DuelGeneral, Fighter, GeneralKind, Skill, TurnEvent } from './types';

type Side = 'player' | 'enemy';

/** 이기는 상대: 맹장 > 기장 > 지장 > 맹장 */
const BEATS: Record<GeneralKind, GeneralKind> = { 맹장: '기장', 기장: '지장', 지장: '맹장' };

function gen(f: Fighter): DuelGeneral {
  const g = getDuelGeneral(f.id);
  if (!g) throw new Error(`없는 장수: ${f.id}`);
  return g;
}

function skill(id: string): Skill {
  const s = SKILLS[id];
  if (!s) throw new Error(`없는 기술: ${id}`);
  return s;
}

/** 이 장수·레벨의 최대 체력: round((통솔 × hpPerLead + level × hpPerLevel) × generalHp) (BALANCE) */
export function maxHpFor(id: string, level: number): number {
  const g = getDuelGeneral(id);
  if (!g) throw new Error(`없는 장수: ${id}`);
  return Math.round((g.stats.통솔 * BALANCE.hpPerLead + level * BALANCE.hpPerLevel) * (BALANCE.generalHp[id] ?? 1));
}

/** maxHp는 maxHpFor. uses는 횟수 제한 있는 기술만 넣는다(키 없음 = 무제한). */
export function makeFighter(id: string, level: number): Fighter {
  const g = getDuelGeneral(id);
  if (!g) throw new Error(`없는 장수: ${id}`);
  const maxHp = maxHpFor(id, level);
  const uses: Record<string, number> = {};
  for (const sid of g.skills) {
    const n = skill(sid).uses;
    if (n !== null) uses[sid] = n;
  }
  return { id, level, hp: maxHp, maxHp, uses, status: {}, bonus: { atk: 0, int: 0, speed: 0 } };
}

export type Eff = 'win' | 'lose' | 'even';

/** 공격 유형 a가 방어 유형 d를 칠 때 유리·불리·보통 (matchup과 같은 판정) */
export function effOf(a: GeneralKind, d: GeneralKind): Eff {
  if (BEATS[a] === d) return 'win';
  if (BEATS[d] === a) return 'lose';
  return 'even';
}

/** 공격 유형 a가 방어 유형 d를 칠 때 배율 */
export function matchup(a: GeneralKind, d: GeneralKind): number {
  const e = effOf(a, d);
  return e === 'win' ? BALANCE.matchWin : e === 'lose' ? BALANCE.matchLose : 1;
}

export function speedOf(f: Fighter): number {
  return gen(f).speed + f.bonus.speed;
}

/** 맹장 무력, 기장 무력 + 속도/4, 지장 지력 (+보너스) */
export function attackStat(f: Fighter): number {
  const g = gen(f);
  if (g.kind === '지장') return g.stats.지력 + f.bonus.int;
  if (g.kind === '기장') return g.stats.무력 + f.bonus.atk + speedOf(f) / 4;
  return g.stats.무력 + f.bonus.atk;
}

/**
 * 치명타 확률: critBase, 기장이면 + critKiBonus(정교한 무예), 속도 보너스(명마) × critPerSpeed.
 * 보스가 치면 × bossCritFactor(보스전이 운으로 끝나지 않게), 상대가 방어 태세면 0. (BALANCE)
 */
export function critChance(att: Fighter, def: Fighter): number {
  if (def.status.guard) return 0;
  let p = BALANCE.critBase + Math.max(0, att.bonus.speed) * BALANCE.critPerSpeed;
  if (gen(att).kind === '기장') p += BALANCE.critKiBonus;
  if (att.boss) p *= BALANCE.bossCritFactor;
  return Math.min(1, Math.max(0, p));
}

/**
 * 위력 × (공격 능력치 / 상대 통솔) × 상성(기술 유형 → 상대 장수 유형) × 자속(기술 유형 = 내 유형이면 1.2) × 난수(0.85~1.0)
 * 공격자가 일갈을 들었으면 ×0.8, 상대가 방어 태세면 ×0.5. 위력 0 기술은 0, 그 외 최소 1.
 * 난수는 두 번 뽑는다: 첫째는 0.85~1.0 계수, 둘째가 critChance보다 작으면 치명타(× critMult).
 */
export function damageRoll(att: Fighter, def: Fighter, sk: Skill, rng: Rng): { amount: number; crit: boolean } {
  if (sk.power <= 0) return { amount: 0, crit: false };
  let v = baseDamage(att, def, sk);
  v *= 0.85 + 0.15 * rng();
  const crit = rng() < critChance(att, def);
  if (crit) v *= BALANCE.critMult;
  return { amount: Math.max(1, Math.round(withGuardAndShout(v, att, def))), crit };
}

/** 난수·치명타 전의 피해: 위력 × (공격 능력치 / 상대 통솔) × 상성 × 자속 × 장수별 보정 */
function baseDamage(att: Fighter, def: Fighter, sk: Skill): number {
  const a = gen(att);
  const d = gen(def);
  const v = sk.power * (attackStat(att) / d.stats.통솔) * matchup(sk.kind, d.kind) * (sk.kind === a.kind ? BALANCE.stab : 1);
  return v * (BALANCE.generalPower[att.id] ?? 1);
}

/** 공격자가 일갈을 들었으면 ×shoutRate, 상대가 방어 태세면 ×0.5 */
function withGuardAndShout(v: number, att: Fighter, def: Fighter): number {
  if (att.status.shouted) v *= SKILL_RULES.shoutRate;
  if (def.status.guard) v *= 0.5;
  return v;
}

/**
 * 미리보기용 피해 범위: damageRoll과 같은 식에 난수 계수 0.85(min)와 1.0(max), 치명타 없음.
 * 위력 0 기술은 { min: 0, max: 0 }.
 */
export function damageRange(att: Fighter, def: Fighter, sk: Skill): { min: number; max: number } {
  if (sk.power <= 0) return { min: 0, max: 0 };
  const v = baseDamage(att, def, sk);
  const at = (k: number) => Math.max(1, Math.round(withGuardAndShout(v * k, att, def)));
  return { min: at(0.85), max: at(1) };
}

/** damageRoll의 피해만 */
export function damage(att: Fighter, def: Fighter, sk: Skill, rng: Rng): number {
  return damageRoll(att, def, sk, rng).amount;
}

/** 이 장수가 지금 쓰는 기술 4개 (보상으로 배운 기술 반영) */
export function skillsOf(f: Fighter): [string, string, string, string] {
  return f.skills ?? gen(f).skills;
}

function usable(f: Fighter, id: string): boolean {
  return !(id in f.uses) || f.uses[id] > 0;
}

const isUlt = (id: string) => id.endsWith('_ult');

/** 이름 + 은/는, 이/가, 을/를 */
const eunneun = (w: string) => josa(w, '은', '는');
const iga = (w: string) => josa(w, '이', '가');
const eulreul = (w: string) => josa(w, '을', '를');

/**
 * 적이 이번 턴에 쓸 기술 (난수 없음). 도발 중이면 기본 공격, 예고한 필살기가 있고 쓸 수 있으면 그 기술,
 * 아니면 상성·자속 고려해 가장 센 공격 기술(보스는 필살기 제외).
 * sure=false: 체력이 lowHp 이하이고 쓸 수 있는 방어·회복 기술이 있어 enemyAction이 확률로 그쪽을 고를 수 있다.
 */
export function enemyIntent(state: BattleState): { skillId: string; sure: boolean } {
  const e = state.enemy;
  const g = gen(e);
  const basic = skillsOf(e)[0];
  if (e.status.taunt) return { skillId: basic, sure: true };
  if (e.status.charging && usable(e, e.status.charging)) return { skillId: e.status.charging, sure: true };
  const foeKind = gen(state.party[state.active]).kind;
  const avail = skillsOf(e).filter((id) => usable(e, id));
  const sure = !(e.hp <= e.maxHp * SKILL_RULES.lowHp && defendSkills(avail).length > 0);
  let best = basic;
  let bestScore = -1;
  for (const id of avail) {
    const s = skill(id);
    if (s.power <= 0) continue;
    if (e.boss && isUlt(id)) continue;
    const score = s.power * matchup(s.kind, foeKind) * (s.kind === g.kind ? BALANCE.stab : 1);
    if (score > bestScore) {
      best = id;
      bestScore = score;
    }
  }
  return { skillId: best, sure };
}

const defendSkills = (ids: string[]) => ids.filter((id) => skill(id).effect === 'guard' || skill(id).effect === 'heal');

/**
 * 적 AI: enemyIntent의 기술을 쓰되, sure=false면 defendChance 확률로 방어·회복.
 * 난수는 그 방어 판단에서만 한 번 쓴다.
 */
export function enemyAction(state: BattleState, rng: Rng): Action {
  const { skillId, sure } = enemyIntent(state);
  if (!sure) {
    const e = state.enemy;
    const defend = defendSkills(skillsOf(e).filter((id) => usable(e, id)));
    if (rng() < SKILL_RULES.defendChance) return { type: 'skill', skillId: defend[0] };
  }
  return { type: 'skill', skillId };
}

/** 도발 중이면 기본 공격으로 바뀔 기술 (순서 계산용, 부작용 없음) */
function plannedSkill(f: Fighter, id: string): string {
  return f.status.taunt ? skillsOf(f)[0] : id;
}

export function resolveTurn(
  state: BattleState,
  playerAction: Action,
  rng: Rng,
): { state: BattleState; log: TurnEvent[] } {
  const s: BattleState = structuredClone(state);
  const log: TurnEvent[] = [];
  const enemyAct = enemyAction(state, rng);
  if (enemyAct.type !== 'skill') throw new Error('적은 교체하지 않는다');
  // 예고한 필살기는 이번 턴의 행동으로 소모된다(이번 턴 끝에는 다시 예고하지 않는다)
  const released = !!s.enemy.status.charging;
  delete s.enemy.status.charging;

  const fighter = (side: Side): Fighter => (side === 'player' ? s.party[s.active] : s.enemy);
  const other = (side: Side): Side => (side === 'player' ? 'enemy' : 'player');
  const name = (f: Fighter) => gen(f).name;

  const ko = (side: Side) => {
    log.push({ who: side, kind: 'ko', text: `${iga(name(fighter(side)))} 쓰러졌다!` });
  };

  const act = (side: Side, chosen: string) => {
    const self = fighter(side);
    const foeSide = other(side);
    const foe = fighter(foeSide);
    const g = gen(self);
    if (!skillsOf(self).includes(chosen)) throw new Error(`${g.name}에게 없는 기술: ${chosen}`);

    // 혼란: 이번 행동 50% 실패
    if (self.status.confuse) {
      self.status.confuse -= 1;
      if (self.status.confuse <= 0) delete self.status.confuse;
      if (rng() < SKILL_RULES.confuseFail) {
        log.push({ who: side, kind: 'miss', text: `${eunneun(g.name)} 혼란에 빠져 허둥댔다!` });
        return;
      }
    }

    const basic = skillsOf(self)[0];
    let id = chosen;
    let note = '';
    if (self.status.taunt) {
      if (id !== basic) {
        id = basic;
        note = `도발에 넘어가 ${skill(basic).name}밖에 쓸 수 없다! `;
      }
      self.status.taunt -= 1;
      if (self.status.taunt <= 0) delete self.status.taunt;
    }
    if (!usable(self, id)) {
      note = `${eulreul(skill(id).name)} 쓸 힘이 남지 않았다! 대신 `;
      id = basic;
    }
    if (id in self.uses) self.uses[id] -= 1;
    const sk = skill(id);
    log.push({ who: side, kind: 'skill', skillId: id, text: `${note}${g.name}의 ${sk.name}!` });

    if (sk.power > 0) {
      const { amount: dmg, crit } = damageRoll(self, foe, sk, rng);
      const eff = effOf(sk.kind, gen(foe).kind);
      delete self.status.shouted;
      foe.hp = Math.max(0, foe.hp - dmg);
      log.push({
        who: side,
        kind: 'hit',
        skillId: id,
        amount: dmg,
        ...(crit ? { crit: true } : {}),
        ...(eff !== 'even' ? { eff } : {}),
        text: `${crit ? '회심의 일격! ' : ''}${eff === 'win' ? '상성이 좋다! ' : eff === 'lose' ? '상성이 나쁘다… ' : ''}${name(foe)}에게 ${dmg}의 피해!`,
      });
      if (foe.hp <= 0) {
        ko(foeSide);
        return;
      }
      if (foe.status.ambush) {
        delete foe.status.ambush;
        const c = Math.max(1, Math.round(dmg * SKILL_RULES.ambushRate));
        self.hp = Math.max(0, self.hp - c);
        log.push({ who: foeSide, kind: 'counter', amount: c, text: `매복한 ${name(foe)}의 반격! ${c}의 피해!` });
        if (self.hp <= 0) {
          ko(side);
          return;
        }
      }
    }

    switch (sk.effect) {
      case 'burn':
        foe.status.burn = sk.burnTurns ?? SKILL_RULES.burnTurns;
        log.push({ who: foeSide, kind: 'status', text: `${name(foe)}에게 불이 붙었다!` });
        break;
      case 'confuse':
        foe.status.confuse = SKILL_RULES.confuseActions;
        log.push({ who: foeSide, kind: 'status', text: `${eunneun(name(foe))} 혼란에 빠졌다!` });
        break;
      case 'taunt':
        foe.status.taunt = SKILL_RULES.tauntActions;
        log.push({ who: foeSide, kind: 'status', text: `${eunneun(name(foe))} 도발에 넘어갔다!` });
        break;
      case 'shout':
        foe.status.shouted = true;
        log.push({ who: foeSide, kind: 'status', text: `${eunneun(name(foe))} 일갈에 기가 꺾였다!` });
        break;
      case 'guard':
        self.status.guard = true;
        log.push({ who: side, kind: 'status', text: `${eunneun(g.name)} 방어 태세를 갖췄다!` });
        break;
      case 'ambush':
        self.status.ambush = true;
        log.push({ who: side, kind: 'status', text: `${eunneun(g.name)} 매복했다!` });
        break;
      case 'heal': {
        const amt = Math.min(self.maxHp - self.hp, Math.round(self.maxHp * BALANCE.healRate));
        self.hp += amt;
        // 체력이 가득하면 "0 회복" 대신 기력이 넘친다고만 알린다(숫자도 띄우지 않는다)
        log.push(
          amt > 0
            ? { who: side, kind: 'status', amount: amt, text: `${eunneun(g.name)} 숨을 골랐다. 체력 ${amt} 회복!` }
            : { who: side, kind: 'status', text: `${eunneun(g.name)} 숨을 골랐다. 이미 기력이 넘친다!` },
        );
        break;
      }
    }
  };

  const alive = (side: Side) => fighter(side).hp > 0;

  if (playerAction.type === 'switch') {
    const to = playerAction.toIndex;
    const target = s.party[to];
    if (!target || to === s.active || target.hp <= 0) throw new Error(`교체할 수 없는 자리: ${to}`);
    s.active = to;
    log.push({ who: 'player', kind: 'switch', text: `${name(target)}, 나서라!` });
    if (alive('enemy')) act('enemy', enemyAct.skillId);
  } else {
    // 방어 태세는 먼저, 그다음 속도 순(동속이면 플레이어 먼저)
    const p = fighter('player');
    const e = fighter('enemy');
    const pGuard = skill(plannedSkill(p, playerAction.skillId)).effect === 'guard';
    const eGuard = skill(plannedSkill(e, enemyAct.skillId)).effect === 'guard';
    const playerFirst = pGuard !== eGuard ? pGuard : speedOf(p) >= speedOf(e);
    const order: [Side, string][] = playerFirst
      ? [['player', playerAction.skillId], ['enemy', enemyAct.skillId]]
      : [['enemy', enemyAct.skillId], ['player', playerAction.skillId]];
    for (const [side, id] of order) {
      if (!alive('player') || !alive('enemy')) break;
      act(side, id);
    }
  }

  // 턴 끝: 둘 다 서 있으면 화상이 탄다
  for (const side of ['player', 'enemy'] as Side[]) {
    if (!alive('player') || !alive('enemy')) break;
    const f = fighter(side);
    if (!f.status.burn) continue;
    const amt = Math.max(1, Math.round(f.maxHp * BALANCE.burnRate));
    f.hp = Math.max(0, f.hp - amt);
    log.push({ who: side, kind: 'status', amount: amt, text: `${eunneun(name(f))} 불길에 휩싸였다! ${amt}의 피해!` });
    f.status.burn -= 1;
    if (f.status.burn <= 0) delete f.status.burn;
    if (f.hp <= 0) ko(side);
  }

  // 보스 필살기 예고: 이번 턴에 필살기를 쓰지 않았고 다음 턴에 쓸 수 있으면(도발 중이 아니면) 턴 끝에 알린다
  const e = s.enemy;
  if (e.boss && !released && alive('player') && alive('enemy') && !e.status.taunt) {
    const ult = skillsOf(e).find((id) => isUlt(id) && usable(e, id));
    if (ult) {
      e.status.charging = ult;
      const n = name(e);
      const u = skill(ult).name;
      log.push({ who: 'enemy', kind: 'status', skillId: ult, text: `${iga(n)} ${eulreul(u)} 준비한다!` });
    }
  }

  // 방어 태세는 그 턴에만
  for (const f of s.party) delete f.status.guard;
  delete s.enemy.status.guard;
  s.turn += 1;
  return { state: s, log };
}
