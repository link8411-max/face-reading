// 장면 이름(React 쪽) → Phaser 장면 키
import type { SceneName } from './bridge';

export const SCENE_KEY: Record<SceneName, string> = {
  start: 'Start',
  battle: 'Battle',
  reward: 'Reward',
  result: 'Result',
};
