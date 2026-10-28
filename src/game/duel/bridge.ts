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

export type UiAction =
  | { type: 'skill'; skillId: string }
  | { type: 'switch'; toIndex: number }
  | { type: 'reward'; rewardId: string; targetIndex?: number }
  | { type: 'result'; action: 'share' | 'retry' | 'samguk' }
  | { type: 'rate'; stars: number };

export type SceneName = 'battle' | 'reward' | 'result';
/** 메뉴 커서 자리 */
export type FocusId = 'skill0' | 'skill1' | 'skill2' | 'skill3' | 'switch';

export interface DuelEvents {
  // React → Phaser
  'run:start': { run: RunState; seed: number };
  'run:update': { run: RunState; view?: BattleView };
  'anim:play': { timeline: TimelineItem[]; sides: { player: Side } };
  'ui:focus': { id: FocusId };
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
  private debug: DuelDebug = { scene: 'battle', animating: false };

  override emit<K extends keyof DuelEvents>(name: K, payload: DuelEvents[K]): boolean {
    if (name === 'scene:changed') {
      this.patchDebug({ scene: (payload as DuelEvents['scene:changed']).scene });
    } else if (name === 'run:update' || name === 'run:start') {
      const p = payload as DuelEvents['run:update'];
      if (p.view) this.view = p.view;
      this.patchDebug({ phase: p.run?.phase, wave: p.run?.wave });
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
