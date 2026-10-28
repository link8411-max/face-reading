// 시작·보상·결과 장면의 바탕: 다리 연결·정리, 커서(ui:focus), 값이 바뀌면 통째로 다시 그리기.
// 움직임이 거의 없는 화면이라 바뀔 때마다 오브젝트를 다 지우고 새로 그린다(320×240에 오브젝트 수십 개).
import * as Phaser from 'phaser';
import type { DuelBridge, DuelEvents, SceneName } from './bridge';
import { KO_FAMILY, KO_PX } from './config';
import { playSfx } from './sfx';
import { fonts, text, type TextOpt } from './ui';

type On = <K extends keyof DuelEvents>(name: K, fn: (p: DuelEvents[K]) => void) => void;

export abstract class PanelScene extends Phaser.Scene {
  protected bridge!: DuelBridge;
  /** 커서가 있는 투명 버튼 id */
  protected focus: string | null = null;
  protected abstract readonly sceneName: SceneName;

  /** 바탕(천·틀) 위에 화면을 그린다 */
  protected abstract draw(g: Phaser.GameObjects.Graphics): void;
  /** 이 장면이 받는 커서 id인지 */
  protected abstract accepts(id: string): boolean;
  /** 장면별 다리 이벤트 */
  protected abstract listen(on: On): void;

  create(): void {
    this.bridge = this.registry.get('bridge') as DuelBridge;
    this.focus = null;
    const bridge = this.bridge;
    const offs: (() => void)[] = [];
    const on: On = (name, fn) => {
      bridge.on(name, fn);
      offs.push(() => bridge.off(name, fn));
    };
    on('ui:focus', ({ id }) => {
      if (this.focus === id || !this.accepts(id)) return;
      this.focus = id;
      playSfx('card');
      this.redraw();
    });
    this.listen(on);
    // game.destroy(true)는 DESTROY만 보낸다 → 둘 다에서 뗀다
    const cleanup = () => {
      offs.forEach((off) => off());
      offs.length = 0;
      this.events.off(Phaser.Scenes.Events.SHUTDOWN, cleanup);
      this.events.off(Phaser.Scenes.Events.DESTROY, cleanup);
    };
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, cleanup);
    this.events.once(Phaser.Scenes.Events.DESTROY, cleanup);
    this.onCreate();
    this.redraw();
    bridge.setAnimating(false);
    this.announce();
  }

  /** 장면이 (다시) 열릴 때 상태 비우기 */
  protected onCreate(): void {}

  /** 입력을 받을 준비가 됐다고 React에 알린다(연출이 있는 장면은 끝난 뒤에 부른다) */
  protected announce(): void {
    this.bridge.emit('scene:changed', { scene: this.sceneName });
  }

  protected redraw(): void {
    this.tweens.killAll();
    this.children.removeAll(true);
    this.add.image(0, 0, 'cloth').setOrigin(0);
    this.add.image(0, 0, 'frame').setOrigin(0);
    const g = this.add.graphics();
    this.draw(g);
  }

  /** 글씨가 maxW보다 넓으면 작은 글꼴(Galmuri7)로 바꾼다 */
  protected fit(t: Phaser.GameObjects.Text, maxW: number): Phaser.GameObjects.Text {
    if (t.width > maxW) t.setFontFamily(`${KO_FAMILY[7]}, ${fonts.kr}`).setFontSize(KO_PX[7]).setFontStyle('normal');
    return t;
  }

  protected t(x: number, y: number, s: string, opt: TextOpt = {}): Phaser.GameObjects.Text {
    return text(this, x, y, s, opt);
  }

  /** 깜빡이는 ▼ */
  protected more(x = 298, y = 218): void {
    const m = this.t(x, y, '▼', { size: 8 });
    this.tweens.add({ targets: m, alpha: 0, duration: 400, yoyo: true, repeat: -1, hold: 300 });
  }
}
