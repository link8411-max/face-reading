// 일기토 게임 만들기. Phaser는 import 순간 window·document를 만지므로 브라우저에서만 동적으로 불러온다.
// 호출자(React)가 언마운트 때 game.destroy(true)를 부른다.
import type * as Phaser from 'phaser';
import type { DuelBridge } from './bridge';

export async function createDuelGame(parent: HTMLElement, bridge: DuelBridge): Promise<Phaser.Game> {
  const { buildGame } = await import('./game');
  const game = buildGame(parent, bridge);
  // 개발 서버에서만: 브라우저 확인용으로 게임을 열어 둔다(연출 속도 늦추기 등)
  if (process.env.NODE_ENV !== 'production') (window as unknown as { __duelGame?: Phaser.Game }).__duelGame = game;
  return game;
}

export { DuelBridge } from './bridge';
export type { BattleView, FighterView, SkillView, UiAction, FocusId, SceneName, StartShow, RewardShow, ResultShow, PickView, RecruitView } from './bridge';
