// 일기토 공용 타입

export type GeneralKind = '맹장' | '기장' | '지장';

export type SkillEffect = 'burn' | 'confuse' | 'ambush' | 'taunt' | 'guard' | 'heal' | 'shout';

export interface Skill {
  id: string;
  name: string;
  kind: GeneralKind;
  power: number;
  /** null = 무제한 */
  uses: number | null;
  effect?: SkillEffect;
}

export interface DuelGeneral {
  id: string;
  name: string;
  kind: GeneralKind;
  speed: number;
  skills: [string, string, string, string];
  role: 'starter' | 'recruit' | 'boss' | 'mob';
  /** 파일 이름만 (예: guanyu.png) */
  sprite: string;
  stats: { 통솔: number; 무력: number; 지력: number; 매력: number };
}

// ── 전투 상태 ──

export interface FighterStatus {
  /** 남은 화상 턴 (턴 끝마다 maxHp 8% 피해) */
  burn?: number;
  /** 남은 혼란 행동 수 (행동할 때 50% 실패) */
  confuse?: number;
  /** 다음 피격 때 받은 피해의 50% 반격 */
  ambush?: boolean;
  /** 남은 도발 행동 수 (기본 공격만) */
  taunt?: number;
  /** 이번 턴 받는 피해 절반 (턴 끝에 풀림) */
  guard?: boolean;
  /** 상대의 일갈을 들음: 다음에 주는 피해 0.8배 (한 번 주면 풀림) */
  shouted?: boolean;
}

export interface Fighter {
  /** DuelGeneral id */
  id: string;
  level: number;
  hp: number;
  maxHp: number;
  /** 횟수 제한 있는 기술만 키가 있다. 키가 없으면 무제한 */
  uses: Record<string, number>;
  status: FighterStatus;
  bonus: { atk: number; int: number; speed: number };
}

export interface BattleState {
  party: Fighter[];
  active: number;
  enemy: Fighter;
  turn: number;
}

export type Action = { type: 'skill'; skillId: string } | { type: 'switch'; toIndex: number };

/** who: skill·switch·hit·miss·counter는 행동한 쪽, status·ko는 영향을 받은 쪽 */
export type TurnEvent = {
  who: 'player' | 'enemy';
  kind: 'skill' | 'switch' | 'hit' | 'miss' | 'status' | 'ko' | 'counter';
  skillId?: string;
  amount?: number;
  text: string;
};
