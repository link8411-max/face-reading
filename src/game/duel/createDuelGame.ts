// 일기토 게임 만들기. Phaser는 import 순간 window·document를 만지므로 브라우저에서만 동적으로 불러온다.
// 호출자(React)가 언마운트 때 game.destroy(true)를 부른다.
import type * as Phaser from 'phaser';
import type { DuelBridge } from './bridge';

export async function createDuelGame(parent: HTMLElement, bridge: DuelBridge): Promise<Phaser.Game> {
  const { buildGame } = await import('./game');
  return buildGame(parent, bridge);
}

export { DuelBridge } from './bridge';
export type { BattleView, FighterView, SkillView, UiAction, FocusId, SceneName, StartShow, RewardShow, ResultShow, PickView } from './bridge';
