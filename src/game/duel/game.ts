// Phaser 본체를 쓰는 부분. createDuelGame이 브라우저에서만 동적으로 불러온다(서버 번들에 섞이지 않게).
import * as Phaser from 'phaser';
import { BootScene } from './BootScene';
import { BattleScene } from './BattleScene';
import { StartScene } from './StartScene';
import { RewardScene } from './RewardScene';
import { ResultScene } from './ResultScene';
import { GAME_H, GAME_W, PALETTE } from './config';
import { SCENE_KEY } from './sceneKeys';
import type { DuelBridge, DuelEvents } from './bridge';

/** React의 'scene:go'를 받아 지금 장면을 멈추고 새 장면을 연다(부팅 전이면 BootScene이 bridge.wantScene으로 간다) */
function attachSceneController(game: Phaser.Game, bridge: DuelBridge): void {
  const onGo = ({ scene }: DuelEvents['scene:go']) => {
    if (!game.registry.get('booted')) return;
    const key = SCENE_KEY[scene];
    for (const k of Object.values(SCENE_KEY)) {
      if (k !== key && game.scene.isActive(k)) game.scene.stop(k);
    }
    // 같은 장면이어도 다시 연다(새 값으로 다시 그림)
    if (game.scene.isActive(key)) game.scene.stop(key);
    game.scene.start(key);
  };
  bridge.on('scene:go', onGo);
  game.events.once(Phaser.Core.Events.DESTROY, () => bridge.off('scene:go', onGo));
}

export function buildGame(parent: HTMLElement, bridge: DuelBridge): Phaser.Game {
  const game = new Phaser.Game({
    type: Phaser.AUTO,
    parent,
    width: GAME_W,
    height: GAME_H,
    pixelArt: true,
    roundPixels: true,
    scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH, zoom: Phaser.Scale.MAX_ZOOM },
    backgroundColor: PALETTE.green1,
    banner: false,
    callbacks: {
      // 장면이 만들어지기 전에 다리를 놓는다
      preBoot: (g) => g.registry.set('bridge', bridge),
    },
    scene: [BootScene, StartScene, BattleScene, RewardScene, ResultScene],
  });
  attachSceneController(game, bridge);
  return game;
}
