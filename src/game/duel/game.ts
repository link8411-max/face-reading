// Phaser 본체를 쓰는 부분. createDuelGame이 브라우저에서만 동적으로 불러온다(서버 번들에 섞이지 않게).
import * as Phaser from 'phaser';
import { BootScene } from './BootScene';
import { BattleScene } from './BattleScene';
import { GAME_H, GAME_W, PALETTE } from './config';
import type { DuelBridge } from './bridge';

export function buildGame(parent: HTMLElement, bridge: DuelBridge): Phaser.Game {
  return new Phaser.Game({
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
      preBoot: (game) => game.registry.set('bridge', bridge),
    },
    scene: [BootScene, BattleScene],
  });
}
