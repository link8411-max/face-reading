// React ↔ Phaser 다리. Phaser를 import하지 않아 단위 테스트가 가능하다(작은 자체 이미터 위에 선다).
import type { RunState } from '@/lib/duel/types';
import type { GeneralKind } from '@/lib/duel/types';
import type { Side, TimelineItem } from './timeline';

// ── 전투 화면이 그리는 값(React가 RunState에서 만든다) ──

export interface SkillView {
  id: string;
  name: string;
  kind: GeneralKind;
  /** null = 무제한 */
  usesLeft: number | null;
}

export interface FighterView {
  id: string;
  name: string;
  kind: GeneralKind;
  level: number;
  hp: number;
  maxHp: number;
  stats: { 무력: number; 통솔: number };
  skills: SkillView[];
}

export interface BattleView {
  wave: number;
  turn: number;
  player: FighterView;
  enemy: FighterView & { isBoss: boolean };
  party: { id: string; name: string; hp: number; maxHp: number }[];
  /** 대사창 줄들(최대 3줄을 보여 준다) */
  message: string[];
}

// ── 시작·보상·결과 화면 값 ──

export interface StartShow {
  roster: { id: string; name: string; kind: GeneralKind; locked: boolean }[];
  best: number;
  clears: number;
  /** 행군 기록 줄(최신 먼저, 최대 5) */
  history: string[];
  /** 고른 시작 장수 id */
  selected: string;
  /** 진행 중인 판(있으면 이어하기 칸을 보인다) */
  resume?: { starter: string; name: string; wave: number };
  /** false면 이 브라우저에 저장할 수 없다(시작 화면에 한 줄 안내) */
  storageOk?: boolean;
}

/** 항복 장면: 항복한 장수와 동행 칸 */
export interface RecruitView {
  /** 예: 마초가 항복했다! */
  title: string;
  /** 동행 칸 아래 한 줄(합류했다 / 누구를 보낼까) */
  note: string;
  id: string;
  name: string;
  kind: GeneralKind;
  level: number;
  /** 지금 동행(항복한 장수가 합류했으면 그 장수 포함) */
  party: { id: string; name: string }[];
  /** 동행 자리 수(3 또는 4) */
  slots: number;
  /** 자리가 없어 누군가를 보내야 하는지 */
  full: boolean;
}

/** 카드 위에 띄우는 고르기 창(보상 대상·영입 교체) */
export interface PickView {
  title: string;
  options: { label: string; sub?: string; disabled?: boolean }[];
}

export interface RewardShow {
  headline: string;
  cards: { id: string; name: string; desc: string; rarity: 'common' | 'rare' }[];
  party: string[];
  next: string;
  pick?: PickView;
  /** 있으면 카드 대신 항복 창을 먼저 띄운다(고르기 줄은 pick) */
  recruit?: RecruitView;
}

export interface ResultShow {
  starter: string;
  title: string;
  headline: string;
  lines: string[];
  best: number;
  clears: number;
  /** 고른 별 수(0 = 아직) */
  stars?: number;
  /** 열전 본문 쪽(0부터, 끝을 넘으면 처음으로) */
  page?: number;
}

export type UiAction =
  | { type: 'skill'; skillId: string }
  | { type: 'switch'; toIndex: number }
  | { type: 'reward'; rewardId: string; targetIndex?: number }
  | { type: 'result'; action: 'share' | 'retry' | 'samguk' }
  | { type: 'rate'; stars: number }
  | { type: 'select'; starterId: string }
  | { type: 'sortie' }
  | { type: 'resume' }
  | { type: 'pick'; index: number };

export type SceneName = 'start' | 'battle' | 'reward' | 'result';
/** 전투 메뉴 커서 자리 */
export type BattleFocusId = 'skill0' | 'skill1' | 'skill2' | 'skill3' | 'switch';
/** 커서 자리: 전투는 BattleFocusId, 그 밖은 general0·sortie·card0·opt0·share·star1 같은 투명 버튼 id */
export type FocusId = BattleFocusId | (string & {});

export interface DuelEvents {
  // React → Phaser
  'run:start': { run: RunState; seed: number };
  'run:update': { run: RunState; view?: BattleView };
  /** view: 턴이 끝난 뒤의 화면 값(있으면 연출이 끝날 때 적용) */
  'anim:play': { timeline: TimelineItem[]; sides: { player: Side }; view?: BattleView };
  'ui:focus': { id: FocusId };
  /** 전투: 고른 명령을 대사창에 띄운다("▶ 일격\n탭하여 결정"). null이면 대사만 */
  'battle:prompt': { text: string | null; hint?: boolean };
  /** 장면 바꾸기(게임의 작은 컨트롤러가 받는다) */
  'scene:go': { scene: SceneName };
  /** 가로형(320×240) ↔ 세로형(320×408) 바꾸기. 게임 크기를 바꾸고 지금 장면을 다시 연다 */
  'layout:tall': { tall: boolean };
  'start:show': StartShow;
  'reward:show': RewardShow;
  'result:show': ResultShow;
  // Phaser → React
  'ui:action': UiAction;
  'anim:done': { sides: { player: Side } };
  'scene:changed': { scene: SceneName };
}

type Handler<T> = (payload: T) => void;

/** on/off/once/emit만 있는 작은 이미터 */
export class Emitter<E extends object> {
  private handlers = new Map<keyof E, Set<Handler<never>>>();

  on<K extends keyof E>(name: K, fn: Handler<E[K]>): this {
    let set = this.handlers.get(name);
    if (!set) {
      set = new Set();
      this.handlers.set(name, set);
    }
    set.add(fn as Handler<never>);
    return this;
  }

  off<K extends keyof E>(name: K, fn: Handler<E[K]>): this {
    this.handlers.get(name)?.delete(fn as Handler<never>);
    return this;
  }

  once<K extends keyof E>(name: K, fn: Handler<E[K]>): this {
    const wrap: Handler<E[K]> = (p) => {
      this.off(name, wrap);
      fn(p);
    };
    return this.on(name, wrap);
  }

  emit<K extends keyof E>(name: K, payload: E[K]): boolean {
    const set = this.handlers.get(name);
    if (!set || set.size === 0) return false;
    // 부르는 중에 off돼도 안전하게 복사해서 돈다
    for (const fn of [...set]) (fn as Handler<E[K]>)(payload);
    return true;
  }

  removeAllListeners(): void {
    this.handlers.clear();
  }
}

/** E2E 디버그 훅 */
export interface DuelDebug {
  scene: SceneName;
  phase?: string;
  wave?: number;
  animating: boolean;
}

declare global {
  interface Window {
    __duel?: DuelDebug;
  }
}

export class DuelBridge extends Emitter<DuelEvents> {
  /** 마지막으로 받은 화면 값(장면이 늦게 만들어져도 바로 그린다) */
  view: BattleView | null = null;
  /** 마지막으로 받은 시작·보상·결과 화면 값(장면이 뜰 때 읽는다) */
  shown: { start?: StartShow; reward?: RewardShow; result?: ResultShow } = {};
  /** 마지막으로 요청된 장면(부팅이 끝나면 여기로 간다) */
  wantScene: SceneName = 'start';
  /** 세로형 배치인지(폰·터치). 장면이 그릴 때 읽는다 */
  tall = false;
  private debug: DuelDebug = { scene: 'start', animating: false };

  override emit<K extends keyof DuelEvents>(name: K, payload: DuelEvents[K]): boolean {
    if (name === 'scene:changed') {
      this.patchDebug({ scene: (payload as DuelEvents['scene:changed']).scene });
    } else if (name === 'run:update' || name === 'run:start') {
      const p = payload as DuelEvents['run:update'];
      if (p.view) this.view = p.view;
      this.patchDebug({ phase: p.run?.phase, wave: p.run?.wave });
    } else if (name === 'layout:tall') {
      this.tall = (payload as DuelEvents['layout:tall']).tall;
    } else if (name === 'scene:go') {
      this.wantScene = (payload as DuelEvents['scene:go']).scene;
    } else if (name === 'start:show') {
      this.shown.start = payload as StartShow;
    } else if (name === 'reward:show') {
      this.shown.reward = payload as RewardShow;
    } else if (name === 'result:show') {
      this.shown.result = payload as ResultShow;
    } else if (name === 'anim:play') {
      const p = payload as DuelEvents['anim:play'];
      if (p.view) this.view = p.view;
    }
    return super.emit(name, payload);
  }

  /** 연출 재생 중인지 디버그 훅에 적는다 */
  setAnimating(on: boolean): void {
    this.patchDebug({ animating: on });
  }

  private patchDebug(part: Partial<DuelDebug>): void {
    this.debug = { ...this.debug, ...part };
    if (typeof window !== 'undefined') window.__duel = { ...this.debug };
  }
}
