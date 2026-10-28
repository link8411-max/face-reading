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
  /** effect 'burn'의 화상 턴 수 (없으면 3) */
  burnTurns?: number;
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
  /** 남은 화상 턴 (턴 끝마다 maxHp × BALANCE.burnRate 피해) */
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
  /** 보스가 다음 턴에 쓰겠다고 예고한 필살기 id (enemyAction이 다음 턴에 그대로 쓰고 지운다) */
  charging?: string;
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
  /** 누적 경험치 (100마다 레벨업, 남는 값만 남는다). 없으면 0 */
  exp?: number;
  /** 보상으로 배운 기술이 있으면 장수 기본 기술 대신 이 4개를 쓴다 */
  skills?: [string, string, string, string];
  /** 보스 웨이브의 적: 필살기를 한 턴 전에 예고하고, 치는 치명타 확률이 bossCritFactor배 */
  boss?: boolean;
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
  /** hit: 치명타(회심의 일격)였다 */
  crit?: boolean;
  /** hit: 기술 유형 대 맞는 쪽 유형의 상성 (유리·불리일 때만) */
  eff?: 'win' | 'lose';
  text: string;
};

// ── 한 판(런) 상태 ──

export interface RunWave {
  wave: number;
  /** 적 장수 id */
  enemy: string;
  turns: number;
  /** 결정타 기술 id (화상으로 쓰러뜨렸으면 'burn') */
  finisher?: string;
  /** 결정타를 낸 아군 장수 id */
  finisherBy?: string;
  /** 이 싸움에서 쓰러진 아군 (처음 쓰러진 장수) */
  lostAlly?: string;
  recruited?: boolean;
  /** 항복 창을 이미 처리했는지(합류 확인·교체·거절). 이어하기 때 창을 다시 띄우지 않는다 */
  recruitHandled?: boolean;
}

export interface RunRecord {
  starter: string;
  waves: RunWave[];
  /** 고른 보상 id 순서대로 */
  rewards: string[];
  cleared: boolean;
}

export interface RunState {
  seed: number;
  /** 1부터 */
  wave: number;
  party: Fighter[];
  partyMax: 3 | 4;
  /** 이번 판에서 장수록에 오른 장수 (시작 장수 포함) */
  roster: string[];
  enemy: Fighter | null;
  phase: 'battle' | 'reward' | 'won' | 'lost';
  battle: BattleState | null;
  record: RunRecord;
  rewardsOffered: string[];
  /** 마지막 playerTurn의 사건(연출·대사창용). 새 웨이브에서 비운다. 옛 저장에는 없다 */
  lastEvents?: TurnEvent[];
  /** 판을 시작한 때(ms). 플레이 데이터용, 옛 저장에는 없다 */
  startedAt?: number;
  /** 지금까지 진행한 시간(ms): 저장 사이 시간을 5분까지만 쌓는다. 이어하기 때 이어서 쌓는다 */
  playedMs?: number;
}

export interface Reward {
  id: string;
  name: string;
  desc: string;
  rarity: 'common' | 'rare';
  /** 대상이 필요한 보상이면 고를 수 있는 party 자리 목록 */
  targets?: (run: RunState) => number[];
  /** 대상과 무관하게 지금 쓸 수 있는지 (없으면 true) */
  canUse?: (run: RunState) => boolean;
  /** 능력치를 올리는 보상이면 어느 능력치인지 (오름 폭은 rewardEffect가 BALANCE에서 읽는다) */
  effect?: { stat: 'atk' | 'int' | 'speed' };
  /** 대상이 필요한 보상에 잘못된 자리를 주면 throw */
  apply(run: RunState, targetIndex?: number): RunState;
}

// ── 저장 ──

export interface SaveData {
  version: 1;
  /** 영구 장수록 (시작 장수는 항상 포함) */
  roster: string[];
  best: { wave: number; clears: number };
  /** 지난 판 기록, 최신이 앞 (최대 20) */
  history: RunRecord[];
  /** 진행 중인 판 */
  current: RunState | null;
}
