// 에셋 로드 → 글꼴 대기(최대 1초) → 텍스처 생성 → 전투 장면
import * as Phaser from 'phaser';
import { DUEL_GENERALS } from '@/lib/duel/generals';
import { FONT_KR, FONT_NUM } from './config';
import { makeTextures } from './textures';
import { fonts } from './ui';
import { SCENE_KEY } from './sceneKeys';
import type { DuelBridge } from './bridge';

const FONT_WAIT_MS = 1000;

/** next/font는 글꼴 이름에 해시를 붙여 CSS 변수로만 알려 준다. 변수가 있으면 그 이름을 쓴다 */
function resolveFont(varName: string, fallback: string): string {
  try {
    for (const el of [document.body, document.documentElement]) {
      if (!el) continue;
      const v = getComputedStyle(el).getPropertyValue(varName).trim();
      if (v) return `${v}, ${fallback}`;
    }
  } catch {
    // 스타일을 못 읽으면 기본 이름
  }
  return fallback;
}

async function waitFonts(): Promise<void> {
  if (typeof document === 'undefined' || !document.fonts) return;
  const loads = [`8px ${fonts.kr}`, `bold 8px ${fonts.kr}`, `8px ${fonts.num}`].map((f) =>
    document.fonts.load(f, '가0').catch(() => []),
  );
  const timeout = new Promise<void>((resolve) => setTimeout(resolve, FONT_WAIT_MS));
  try {
    await Promise.race([Promise.all(loads), timeout]);
  } catch {
    // 글꼴을 못 받아도 기본 글꼴로 진행
  }
}

export class BootScene extends Phaser.Scene {
  constructor() {
    super('Boot');
  }

  preload(): void {
    // 실패한 그림은 텍스처가 생기지 않는다 → spriteKeyFor가 sprite:mob → 색 사각형 순으로 고른다
    this.load.on('loaderror', (file: Phaser.Loader.File) => {
      if (typeof console !== 'undefined') console.debug(`[duel] 그림 없음 ${file.key} → 대체`);
    });
    for (const g of DUEL_GENERALS) {
      // 졸개는 초상이 없다
      if (g.role !== 'mob') this.load.image(`portrait:${g.id}`, `/images/samguk/${g.name}.jpg`);
      this.load.image(`sprite:${g.id}`, `/images/samguk/sprites/${g.sprite}`);
    }
  }

  create(): void {
    fonts.kr = resolveFont('--font-noto-sans-kr', FONT_KR);
    fonts.num = resolveFont('--font-silkscreen', FONT_NUM);
    makeTextures(this);
    // 부팅이 끝나면 React가 마지막으로 부른 장면으로 간다(그 뒤의 장면 바꾸기는 game.ts의 컨트롤러 몫)
    void waitFonts().then(() => {
      const bridge = this.registry.get('bridge') as DuelBridge;
      this.registry.set('booted', true);
      this.scene.start(SCENE_KEY[bridge.wantScene]);
    });
  }
}
