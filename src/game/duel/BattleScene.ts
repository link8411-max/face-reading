// 전투 화면(와꾸 v5 draw1): 보이는 것은 전부 Phaser 오브젝트. 입력은 React의 투명 DOM 버튼이 bridge로 보낸다.
import * as Phaser from 'phaser';
import { SKILLS } from '@/lib/duel/skills';
import { BOSS_WAVES, WAVES } from '@/lib/duel/run';
import { FIELD, GAME_H, GAME_H_TALL, MUTED, PALETTE as S, SPRITE_PX, hex } from './config';
import type { BattleFocusId, BattleView, DuelBridge, DuelEvents, FighterView } from './bridge';
import { playSfx } from './sfx';
import { otherSide, otherWho, timelineLength, CLASH_MS, PASS_MS, STRIKE_MS, KO_MS, type Side, type TimelineItem, type Who } from './timeline';
import { clothKey, frameKey, portraitKeyFor, spriteKeyFor } from './textures';
import { KIND_MARK, box, cursor, hpBar, slashArc, spark, text } from './ui';
import { BATTLE_MENU, BATTLE_SWITCH, BATTLE_TALL, DIALOG_BOX, MENU_BOX, MSG_CHARS, battleCardRect } from './layout';
import { wrapText } from './wrap';

// ── 배치(와꾸 v5 좌표) ──
const SPR_BOTTOM = FIELD.y + 68;
const SIDE_X: Record<Side, number> = { left: 16 + SPRITE_PX / 2, right: 304 - SPRITE_PX / 2 };
const CENTER_X = FIELD.x + FIELD.w / 2;
/** 가운데에서 맞닿을 때 비켜 서는 거리 */
const MEET_GAP = 11;
const CLASH_Y = FIELD.y + 50;
/** 돌진 끝·충돌 정지 끝(timeline.ts passPose와 같은 비율) */
const T_MEET = 0.45;
const T_LEAVE = 0.55;
const MSG_LINES = 3;
/** 대사창 줄 자리: 가로형(Galmuri9, 13 간격) / 세로형(Galmuri11, 14 간격) */
const MSG_WIDE = { x: DIALOG_BOX.x + 6, y: DIALOG_BOX.y + 6, step: 13 } as const;
const MSG_TALL = { x: BATTLE_TALL.dialog.x + 6, y: BATTLE_TALL.dialog.y + 5, step: 14 } as const;
/** 웨이브 진행 띠: WAVES(36)칸 한 줄(가운데 맞춤), 보스(BOSS_WAVES)는 금색 긴 칸 */
const STRIP = { x: 160 - (WAVES * 3 - 1) / 2, y: 30, cell: 3, w: 2, h: 5 } as const;
const FOCUS_IDS: BattleFocusId[] = ['skill0', 'skill1', 'skill2', 'skill3', 'switch'];
/** 처음 고를 때 대사창 안내 */
const CONFIRM_HINT = '한 번 더 누르면 결정';

interface FighterObjs {
  sprite: Phaser.GameObjects.Image;
  baseScale: number;
  portrait: Phaser.GameObjects.Image;
  noPortrait: Phaser.GameObjects.Text;
  name: Phaser.GameObjects.Text;
  info: Phaser.GameObjects.Text;
  /** 보스 표찰(적만) */
  boss: Phaser.GameObjects.Text | null;
  /** 초상 테두리 깜빡임(보스 필살기 예고) */
  border: Phaser.GameObjects.Graphics;
  hpNum: Phaser.GameObjects.Text;
}

const reducedMotion = (): boolean => {
  try {
    return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  } catch {
    return false;
  }
};

export class BattleScene extends Phaser.Scene {
  private bridge!: DuelBridge;
  private view: BattleView | null = null;
  /** 연출 중 들어온 화면 값(끝나고 적용) */
  private pendingView: BattleView | null = null;
  private sides: { player: Side } = { player: 'left' };
  private animating = false;
  private focus: BattleFocusId = 'skill0';
  /** 연출 중 보여 주는 체력(피해를 맞을 때마다 깎는다) */
  private shownHp: Record<Who, number> = { player: 0, enemy: 0 };
  private messages: string[] = [];
  /** 결정 대기 중인 명령 안내 줄(대사창 아래쪽에 빨갛게) */
  private prompt: string[] | null = null;
  /** 결정을 기다리는 중(고른 카드를 금색으로, 대사창에 결정 단추) */
  private pending = false;
  /** 대사창 결정 단추(금색 베벨)와 ▼ */
  private chipG!: Phaser.GameObjects.Graphics;
  private chipT!: Phaser.GameObjects.Text;
  private moreT!: Phaser.GameObjects.Text;
  /** 이번 연출에서 쓰러진 쪽 */
  private koed = new Set<Who>();
  /** 이번 연출이 끝난 뒤의 자리 */
  private finalSides: { player: Side } = { player: 'left' };

  private f!: Record<Who, FighterObjs>;
  private wave!: Phaser.GameObjects.Text;
  private turn!: Phaser.GameObjects.Text;
  private stripG!: Phaser.GameObjects.Graphics;
  private hpG!: Phaser.GameObjects.Graphics;
  private cursorG!: Phaser.GameObjects.Graphics;
  private fx!: Phaser.GameObjects.Graphics;
  private menu!: { name: Phaser.GameObjects.Text; sub: Phaser.GameObjects.Text }[];
  private switchLine!: Phaser.GameObjects.Text;
  private msg!: Phaser.GameObjects.Text[];
  private overlay!: Phaser.GameObjects.Rectangle;
  private cutinImg!: Phaser.GameObjects.Image;
  private cutinTitle!: Phaser.GameObjects.Text;
  private doneTimer: Phaser.Time.TimerEvent | null = null;
  /** 말발굽 먼지 조각(연출이 끝나면 지운다) */
  private dust: Phaser.GameObjects.Rectangle[] = [];

  constructor() {
    super('Battle');
  }

  create(): void {
    // scene.restart()에도 안전하게 연출 상태를 비운다
    this.animating = false;
    this.pendingView = null;
    this.koed = new Set<Who>();
    this.doneTimer = null;
    this.dust = [];
    this.prompt = null;
    this.pending = false;
    this.bridge = this.registry.get('bridge') as DuelBridge;
    this.buildStatic();
    this.buildDynamic();

    const onUpdate = (p: DuelEvents['run:update']) => {
      if (!p.view) return;
      if (this.animating) this.pendingView = p.view;
      else this.applyView(p.view);
    };
    const onPlay = (p: DuelEvents['anim:play']) => this.play(p.timeline, p.sides, p.view);
    const onFocus = (p: DuelEvents['ui:focus']) => {
      if ((FOCUS_IDS as string[]).includes(p.id)) this.setFocus(p.id as BattleFocusId, true);
    };
    this.bridge.on('run:update', onUpdate);
    this.bridge.on('anim:play', onPlay);
    this.bridge.on('ui:focus', onFocus);
    const onPrompt = (p: DuelEvents['battle:prompt']) => {
      // 고른 명령 한 줄(+ 처음 몇 번은 "한 번 더 누르면 결정" 안내)
      this.prompt = p.text ? [...wrapText(p.text, MSG_CHARS).slice(0, 1), ...(p.hint ? [CONFIRM_HINT] : [])] : null;
      this.pending = !!p.text;
      this.drawMessages();
      this.drawMenu();
    };
    this.bridge.on('battle:prompt', onPrompt);
    // game.destroy(true)는 SHUTDOWN이 아니라 DESTROY만 보낸다 → 둘 다에서 뗀다(다리는 게임보다 오래 산다)
    const bridge = this.bridge;
    const cleanup = () => {
      bridge.off('run:update', onUpdate);
      bridge.off('anim:play', onPlay);
      bridge.off('ui:focus', onFocus);
      bridge.off('battle:prompt', onPrompt);
      this.events.off(Phaser.Scenes.Events.SHUTDOWN, cleanup);
      this.events.off(Phaser.Scenes.Events.DESTROY, cleanup);
    };
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, cleanup);
    this.events.once(Phaser.Scenes.Events.DESTROY, cleanup);

    if (this.bridge.view) this.applyView(this.bridge.view);
    this.bridge.setAnimating(false);
    this.bridge.emit('scene:changed', { scene: 'battle' });
  }

  // ── 한 번 그리는 것 ──

  /** 세로형(320×408, 폰·터치) 배치인지 */
  private get tall(): boolean {
    return !!this.bridge?.tall;
  }

  private buildStatic(): void {
    const H = this.tall ? GAME_H_TALL : GAME_H;
    this.add.image(0, 0, clothKey(H)).setOrigin(0);
    this.add.image(0, 0, frameKey(H)).setOrigin(0);
    const g = this.add.graphics();
    box(g, 10, 12, 50, 58);
    box(g, 260, 12, 50, 58);
    box(g, 10, 76, 300, 74, S.ink);
    if (this.tall) {
      // 세로형: 넓은 대사창, 그 아래 기술 카드(drawMenu가 그린다)
      const d = BATTLE_TALL.dialog;
      box(g, d.x, d.y, d.w, d.h, S.cream);
    } else {
      // 명령 메뉴는 넓게(기술 이름이 잘리지 않게), 대사창은 그 오른쪽
      box(g, MENU_BOX.x, MENU_BOX.y, MENU_BOX.w, MENU_BOX.h, S.cream);
      box(g, DIALOG_BOX.x, DIALOG_BOX.y, DIALOG_BOX.w, DIALOG_BOX.h, S.cream);
    }
    this.add.image(FIELD.x, FIELD.y, 'field').setOrigin(0);
    // ▼ 깜빡임(대사창 오른쪽 아래)
    const d = this.tall ? BATTLE_TALL.dialog : DIALOG_BOX;
    this.moreT = text(this, d.x + d.w - 12, d.y + d.h - 12, '▼', { size: 8 });
    this.tweens.add({ targets: this.moreT, alpha: 0, duration: 400, yoyo: true, repeat: -1, hold: 300 });
    this.buildFighterTexts();
  }

  private buildFighterTexts(): void {
    const make = (who: Who): FighterObjs => {
      const left = who === 'player';
      const px = left ? 12 : 262;
      const portrait = this.add.image(px, 14, '__DEFAULT').setOrigin(0).setVisible(false);
      const noPortrait = text(this, px + 23, 41, '?', { size: 16, color: S.gold2, bold: true }).setOrigin(0.5);
      const border = this.add.graphics();
      // 무력·통솔 표찰은 뺐다(1배 폰에서 읽히지 않음): 이름, 유형·레벨(Galmuri11), 적이 보스면 표찰
      const name = text(this, left ? 64 : 256, 14, '', { ko: 11, color: S.cream, bold: true, shadow: true }).setOrigin(left ? 0 : 1, 0);
      const info = text(this, left ? 64 : 256, 56, '', { ko: 11, color: S.gold, shadow: true }).setOrigin(left ? 0 : 1, 0);
      const boss = left ? null : text(this, 256, 30, '보스', { ko: 11, bold: true, color: S.red, shadow: true }).setOrigin(1, 0).setVisible(false);
      // HP 숫자: 세로형(1배 폰)은 Silkscreen 16px
      const hpNum = text(this, left ? 12 : 308, 160, '', { color: S.cream2, num: true, shadow: true, size: this.tall ? 16 : 8 }).setOrigin(left ? 0 : 1, 0);
      const sprite = this.add.image(SIDE_X[left ? 'left' : 'right'], SPR_BOTTOM, '__DEFAULT').setOrigin(0.5, 1);
      return { sprite, baseScale: 1, portrait, noPortrait, name, info, boss, border, hpNum };
    };
    this.f = { player: make('player'), enemy: make('enemy') };
  }

  private buildDynamic(): void {
    this.wave = text(this, 160, 12, '', { color: S.gold, num: true, shadow: true }).setOrigin(0.5, 0);
    this.turn = text(this, 160, 40, '', { color: S.cream2, num: true, shadow: true }).setOrigin(0.5, 0);
    this.stripG = this.add.graphics();
    this.hpG = this.add.graphics();
    this.cursorG = this.add.graphics();
    if (this.tall) {
      // 세로형: 2×2 기술 카드(이름 Galmuri11 굵게, 아래 줄 유형·남은 횟수 Galmuri11)
      this.menu = [0, 1, 2, 3].map((i) => {
        const r = battleCardRect(i);
        return {
          name: text(this, r.x + 12, r.y + 8, '', { ko: 11, bold: true }),
          sub: text(this, r.x + 12, r.y + 28, '', { ko: 11, color: MUTED }),
        };
      });
      const sw = BATTLE_TALL.switch;
      this.switchLine = text(this, sw.x + sw.w / 2, sw.y + 17, '', { ko: 11, bold: true }).setOrigin(0.5, 0);
    } else {
      this.menu = [0, 1, 2, 3].map((i) => {
        const y = BATTLE_MENU.y + i * BATTLE_MENU.rowH;
        return {
          name: text(this, 22, y, '', { ko: 9 }),
          sub: text(this, 157, y, '', { ko: 9, color: MUTED }).setOrigin(1, 0),
        };
      });
      this.switchLine = text(this, 22, BATTLE_SWITCH.y + 2, '', { ko: 9, color: MUTED });
    }
    const M = this.tall ? MSG_TALL : MSG_WIDE;
    this.msg = [0, 1, 2].map((i) => text(this, M.x, M.y + i * M.step, '', { ko: this.tall ? 11 : 9 }));
    this.chipG = this.add.graphics();
    this.chipT = text(this, 0, 0, '결정', { ko: this.tall ? 11 : 9, bold: this.tall }).setVisible(false);
    // 메뉴 위에 포인터를 올리면 커서만 옮긴다(누르기는 React DOM 버튼 몫)
    FOCUS_IDS.forEach((id, i) => {
      const r = this.tall
        ? i < 4
          ? battleCardRect(i)
          : BATTLE_TALL.switch
        : i < 4
          ? { x: BATTLE_MENU.x, y: BATTLE_MENU.y + i * BATTLE_MENU.rowH, w: BATTLE_MENU.w, h: BATTLE_MENU.rowH }
          : BATTLE_SWITCH;
      const zone = this.add.zone(r.x, r.y, r.w, r.h).setOrigin(0).setInteractive();
      zone.on('pointerover', () => this.setFocus(id, true));
    });
    this.fx = this.add.graphics();
    this.overlay = this.add.rectangle(0, 0, 320, this.tall ? GAME_H_TALL : GAME_H, hex(S.navy), 0.65).setOrigin(0).setVisible(false);
    this.cutinImg = this.add.image(CENTER_X, 104, '__DEFAULT').setVisible(false);
    this.cutinTitle = text(this, CENTER_X, 146, '', { ko: 11, color: S.gold, bold: true }).setOrigin(0.5, 0).setVisible(false);
    this.cutinTitle.setShadow(1, 1, S.ink, 0);
  }

  // ── 화면 값 반영 ──

  private applyView(v: BattleView): void {
    this.view = v;
    this.wave.setText(`WAVE ${v.wave}/${WAVES}`);
    this.turn.setText(`TURN ${v.turn}`);
    this.drawStrip(v.wave);
    this.applyFighter('player', v.player, `${v.player.kind} Lv${v.player.level}`);
    this.applyFighter('enemy', v.enemy, `${v.enemy.kind} Lv${v.enemy.level}`);
    this.f.enemy.boss?.setVisible(v.enemy.isBoss);
    this.shownHp = { player: v.player.hp, enemy: v.enemy.hp };
    this.drawHp();
    this.placeIdle();
    this.messages = v.message.slice(-MSG_LINES);
    this.drawMessages();
    this.drawMenu();
  }

  private applyFighter(who: Who, fv: FighterView, info: string): void {
    const o = this.f[who];
    o.name.setText(fv.name);
    o.info.setText(info);
    const pk = portraitKeyFor(this, fv.id);
    if (pk) o.portrait.setTexture(pk).setDisplaySize(46, 54).setVisible(true);
    else o.portrait.setVisible(false);
    o.noPortrait.setVisible(!pk);
    o.sprite.setTexture(spriteKeyFor(this, fv.id, who));
    o.sprite.setDisplaySize(SPRITE_PX, SPRITE_PX);
    o.baseScale = o.sprite.scaleX;
    o.sprite.setAlpha(fv.hp > 0 ? 1 : 0);
  }

  private drawHp(): void {
    if (!this.view) return;
    const g = this.hpG.clear();
    const { player, enemy } = this.view;
    hpBar(g, 12, 152, 140, this.shownHp.player / Math.max(1, player.maxHp), S.blue);
    hpBar(g, 168, 152, 140, this.shownHp.enemy / Math.max(1, enemy.maxHp), S.red);
    this.f.player.hpNum.setText(`${Math.max(0, this.shownHp.player)}/${player.maxHp}`);
    this.f.enemy.hpNum.setText(`${Math.max(0, this.shownHp.enemy)}/${enemy.maxHp}`);
  }

  /** 웨이브 진행 띠: 지난 싸움은 크림, 지금은 빨강, 남은 싸움은 어두운 녹색. 보스 칸은 금색으로 길게 */
  private drawStrip(wave: number): void {
    const g = this.stripG.clear();
    for (let w = 1; w <= WAVES; w++) {
      const boss = (BOSS_WAVES as readonly number[]).includes(w);
      const x = STRIP.x + (w - 1) * STRIP.cell;
      const col = w === wave ? S.red : w < wave ? (boss ? S.gold : S.cream2) : boss ? S.gold2 : S.green3;
      g.fillStyle(hex(col), 1);
      if (boss) g.fillRect(x, STRIP.y - 2, STRIP.w, STRIP.h + 3);
      else g.fillRect(x, STRIP.y, STRIP.w, STRIP.h);
    }
  }

  private drawMessages(): void {
    // 결정 대기 중이면 마지막 대사 + "▶ 기술" 줄(빨강, 오른쪽에 금색 결정 단추) + 처음엔 안내 줄, 아니면 대사 3줄
    const p = this.animating ? null : this.prompt;
    const lines = p ? [...this.messages.slice(-(MSG_LINES - p.length)), ...p] : this.messages;
    const firstPrompt = p ? lines.length - p.length : MSG_LINES;
    this.msg.forEach((t, i) => t.setText(lines[i] ?? '').setColor(i >= firstPrompt ? S.red : S.ink));
    const g = this.chipG.clear();
    this.chipT.setVisible(!!p);
    this.moreT.setVisible(!p);
    if (!p) return;
    const M = this.tall ? MSG_TALL : MSG_WIDE;
    const y = M.y + firstPrompt * M.step;
    const d = this.tall ? BATTLE_TALL.dialog : DIALOG_BOX;
    const w = this.tall ? 56 : 42;
    const h = this.tall ? 17 : 14;
    const x = d.x + d.w - w - 6;
    box(g, x, y - (this.tall ? 3 : 2), w, h, S.gold);
    this.chipT.setPosition(Math.round(x + (w - this.chipT.width) / 2), y - (this.tall ? 1 : 0));
  }

  private drawMenu(): void {
    const v = this.view;
    const g = this.cursorG.clear();
    if (!v) return;
    // 교체는 "다음에 나설 장수"로 간다
    const me = v.party.findIndex((p) => p.id === v.player.id);
    const n = v.party.length;
    let nextUp: (typeof v.party)[number] | null = null;
    for (let k = 1; k < n; k++) {
      const p = v.party[(me + k) % n];
      if (p.hp > 0) {
        nextUp = p;
        break;
      }
    }
    const switchText = nextUp ? `교체 ▷ ${nextUp.name}${nextUp.hp < nextUp.maxHp / 2 ? '(부상)' : ''}` : '교체 · 동행 없음';
    if (this.tall) this.drawCards(g, v, switchText, !nextUp);
    else this.drawList(g, v, switchText);
  }

  /** 기술 보조 글: 방어는 효과, 나머지는 유형 한 글자 · 남은 횟수 */
  private skillSub(s: BattleView['player']['skills'][number]): string {
    if (SKILLS[s.id]?.effect === 'guard') return '피해 절반';
    return `${KIND_MARK[s.kind] ?? ''}·${s.usesLeft === null ? '무제한' : `남은 ${s.usesLeft}`}`;
  }

  /** 가로형: 메뉴 상자 안 다섯 줄(Galmuri9) */
  private drawList(g: Phaser.GameObjects.Graphics, v: BattleView, switchText: string): void {
    this.menu.forEach((row, i) => {
      const s = v.player.skills[i];
      const on = this.focus === `skill${i}`;
      if (!s) {
        row.name.setText('');
        row.sub.setText('');
        return;
      }
      const empty = s.usesLeft === 0;
      row.name.setText(s.name);
      row.name.setColor(empty ? MUTED : on ? S.red : S.ink);
      row.sub.setText(this.skillSub(s));
      // 기술 이름이 보조 글과 겹치면 보조 글을 남은 횟수만으로 줄인다(글꼴은 줄이지 않는다)
      if (row.name.width > 157 - row.sub.width - 4 - 22 && s.usesLeft !== null) row.sub.setText(`${s.usesLeft}회`);
      if (on) cursor(g, 15, BATTLE_MENU.y + i * BATTLE_MENU.rowH + 2);
    });
    this.switchLine.setText(switchText);
    this.switchLine.setColor(this.focus === 'switch' ? S.red : MUTED);
    if (this.focus === 'switch') cursor(g, 15, BATTLE_SWITCH.y + 4);
  }

  /** 세로형: 2×2 기술 카드 + 교체 단추. 고른 카드는 빨간 테두리, 결정 대기 중이면 금색 */
  private drawCards(g: Phaser.GameObjects.Graphics, v: BattleView, switchText: string, noSwitch: boolean): void {
    const frame = (r: { x: number; y: number; w: number; h: number }, on: boolean, fill: string) => {
      if (on) {
        g.fillStyle(hex(S.red), 1);
        g.fillRect(r.x - 2, r.y - 2, r.w + 4, r.h + 4);
      }
      box(g, r.x, r.y, r.w, r.h, fill);
    };
    this.menu.forEach((row, i) => {
      const s = v.player.skills[i];
      const r = battleCardRect(i);
      const on = this.focus === `skill${i}`;
      if (!s) {
        frame(r, false, S.cream2);
        row.name.setText('');
        row.sub.setText('');
        return;
      }
      const empty = s.usesLeft === 0;
      frame(r, on, empty ? S.cream2 : on && this.pending ? S.gold : S.cream);
      row.name.setText(s.name).setColor(empty ? MUTED : on ? S.red : S.ink);
      this.fitText(row.name, r.w - 18);
      row.sub.setText(this.skillSub(s)).setColor(empty ? MUTED : S.ink);
      if (on) cursor(g, r.x + 5, r.y + 11);
    });
    const sw = BATTLE_TALL.switch;
    const onS = this.focus === 'switch';
    frame(sw, onS && !noSwitch, noSwitch ? S.cream2 : onS && this.pending ? S.gold : S.cream);
    this.switchLine.setText(switchText).setColor(noSwitch ? MUTED : onS ? S.red : S.ink);
    this.switchLine.setY(sw.y + Math.floor((sw.h - 12) / 2) - 1);
  }

  /** 글이 maxW보다 넓으면 끝을 말줄임(글꼴은 줄이지 않는다) */
  private fitText(t: Phaser.GameObjects.Text, maxW: number): void {
    let s = t.text;
    while (t.width > maxW && s.length > 1) {
      s = s.slice(0, -1);
      t.setText(`${s}…`);
    }
  }

  private setFocus(id: BattleFocusId, sound: boolean): void {
    if (this.focus === id) return;
    this.focus = id;
    if (sound) playSfx('card');
    this.drawMenu();
  }

  // ── 자리 ──

  private sideOf(who: Who, sides = this.sides): Side {
    return who === 'player' ? sides.player : otherSide(sides.player);
  }

  /** 서 있는 자리: 각자 끝에서 상대를 본다(그림 원본은 오른쪽을 본다) */
  private placeIdle(): void {
    for (const who of ['player', 'enemy'] as Who[]) {
      const o = this.f[who];
      const side = this.sideOf(who);
      o.sprite.setPosition(SIDE_X[side], SPR_BOTTOM).setFlipX(side === 'right').setScale(o.baseScale);
    }
  }

  // ── 연출 ──

  private play(timeline: TimelineItem[], sides: { player: Side }, view?: BattleView): void {
    if (this.animating) this.finish();
    // 턴이 끝난 뒤의 화면 값을 같이 받으면 연출이 끝날 때 적용한다
    if (view) this.pendingView = view;
    this.sides = { player: sides.player };
    this.koed.clear();
    this.placeIdle();
    this.animating = true;
    this.bridge.setAnimating(true);
    const reduce = reducedMotion();
    const k = reduce ? 0.5 : 1;
    const passStarts = new Set(timeline.filter((it) => it.kind === 'pass').map((it) => it.at));
    for (const it of timeline) {
      const at = it.at * k;
      switch (it.kind) {
        case 'pass':
          this.playPass(at, it, k);
          break;
        case 'clash': {
          // 보통 부딪힘은 타임라인상 합의 한가운데지만, 화면에서는 둘이 실제로 맞닿는 순간(T_MEET)에 터뜨린다
          const passStart = it.at - (PASS_MS / 2 - CLASH_MS / 2);
          const when = passStarts.has(passStart) ? (passStart + PASS_MS * T_MEET) * k : at;
          this.time.delayedCall(when, () => this.playClash(it, k, reduce));
          break;
        }
          break;
        case 'cutin':
          this.time.delayedCall(at, () => this.playCutin(it, k));
          break;
        case 'strike':
          this.time.delayedCall(at, () => this.playStrike(it, k));
          break;
        case 'ko':
          this.time.delayedCall(at, () => this.playKo(it, k));
          break;
        case 'text':
          this.time.delayedCall(at, () => this.pushMessage(it.text ?? ''));
          break;
      }
    }
    const last = timeline[timeline.length - 1];
    this.finalSides = { player: (last ? last.sidesAfter : sides).player };
    this.doneTimer = this.time.delayedCall(timelineLength(timeline) * k + 30, () => this.finish());
  }

  /** 둘 다 가운데로 돌진 → 충돌 정지(필살기면 hold만큼 더) → 서로 지나쳐 반대편 끝에서 돌아선다 */
  private playPass(at: number, it: TimelineItem, k: number): void {
    const meet = PASS_MS * T_MEET * k;
    const stay = (PASS_MS * (T_LEAVE - T_MEET) + (it.hold ?? 0)) * k;
    const leave = PASS_MS * (1 - T_LEAVE) * k;
    const startSides = { player: otherSide(it.sidesAfter.player) };
    for (const who of ['player', 'enemy'] as Who[]) {
      const o = this.f[who];
      const from = this.sideOf(who, startSides);
      const to = otherSide(from);
      const meetX = CENTER_X + (from === 'left' ? -MEET_GAP : MEET_GAP);
      const dir: 1 | -1 = from === 'left' ? 1 : -1;
      const kick = this.dustKicker(o.sprite, dir, k);
      this.tweens.add({ targets: o.sprite, x: meetX, delay: at, duration: meet, ease: 'Quad.easeIn', onUpdate: kick });
      this.tweens.add({
        targets: o.sprite,
        x: SIDE_X[to],
        delay: at + meet + stay,
        duration: leave,
        ease: 'Quad.easeOut',
        onUpdate: kick,
        onComplete: () => o.sprite.setFlipX(to === 'right'),
      });
    }
  }

  /** 달리는 동안 3px 움직일 때마다 말 뒤에 2×1 먼지 조각을 남기고 짧게 사라지게 한다(와꾸 draw1) */
  private dustKicker(sprite: Phaser.GameObjects.Image, dir: 1 | -1, k: number): () => void {
    let lastX = sprite.x;
    let n = 0;
    return () => {
      if (Math.abs(sprite.x - lastX) < 3) return;
      lastX = sprite.x;
      n++;
      const x = Math.round(sprite.x - dir * (SPRITE_PX / 2 - 2));
      const y = SPR_BOTTOM - 6 + (n % 3);
      const r = this.add.rectangle(x, y, 2, 1, hex(n % 2 ? '#e3d4a6' : '#d2c08d')).setOrigin(0);
      this.dust.push(r);
      this.tweens.add({
        targets: r,
        alpha: 0,
        duration: 250 * k,
        onComplete: () => {
          this.dust = this.dust.filter((d) => d !== r);
          r.destroy();
        },
      });
    };
  }

  /** 맞은 쪽(공격한 쪽의 상대)이 서 있는 충돌 지점 */
  private hitPoint(attacker: Who, it: TimelineItem): number {
    const defFrom = this.sideOf(otherWho(attacker), { player: otherSide(it.sidesAfter.player) });
    return CENTER_X + (defFrom === 'left' ? -MEET_GAP : MEET_GAP);
  }

  private damage(attacker: Who, amount: number, x: number, k: number): void {
    const def = otherWho(attacker);
    this.shownHp[def] = Math.max(0, this.shownHp[def] - amount);
    this.drawHp();
    const t = text(this, x, FIELD.y + 30, `-${amount}`, { size: 16, color: S.white, num: true }).setOrigin(0.5, 0);
    t.setShadow(1, 1, S.ink, 0);
    this.tweens.add({ targets: t, y: t.y - 14, alpha: 0, duration: 600 * k, ease: 'Quad.easeOut', onComplete: () => t.destroy() });
  }

  /** 프레임 3장을 dur 동안 차례로 그리고 지운다 */
  private frames3(dur: number, draw: (g: Phaser.GameObjects.Graphics, k: number) => void): void {
    const step = dur / 3;
    for (let i = 0; i < 3; i++) {
      this.time.delayedCall(step * i, () => draw(this.fx.clear(), i));
    }
    this.time.delayedCall(dur, () => this.fx.clear());
  }

  private playClash(it: TimelineItem, k: number, reduce: boolean): void {
    const who = it.who ?? 'player';
    const amount = it.amount ?? 0;
    if (amount <= 0) {
      // 빗나감·가드: 불꽃 없음
      const x = this.hitPoint(who, it);
      const t = text(this, x, FIELD.y + 30, 'MISS', { color: S.cream, num: true, shadow: true }).setOrigin(0.5, 0);
      this.tweens.add({ targets: t, y: t.y - 10, alpha: 0, duration: 500 * k, onComplete: () => t.destroy() });
      return;
    }
    playSfx('hit');
    if (!reduce) this.cameras.main.shake(120, 0.004);
    this.frames3(CLASH_MS * k, (g, i) => spark(g, CENTER_X, CLASH_Y, i));
    this.damage(who, amount, this.hitPoint(who, it), k);
  }

  private playCutin(it: TimelineItem, k: number): void {
    const who = it.who ?? 'player';
    const fv = who === 'player' ? this.view?.player : this.view?.enemy;
    playSfx('cutin');
    const fadeIn = 120 * k;
    this.overlay.setVisible(true).setAlpha(0);
    this.tweens.add({ targets: this.overlay, alpha: 1, duration: fadeIn });
    const pk = fv ? portraitKeyFor(this, fv.id) : null;
    const objs: Phaser.GameObjects.GameObject[] = [this.overlay, this.cutinTitle];
    if (pk) {
      this.cutinImg.setTexture(pk).setDisplaySize(46, 54).setVisible(true).setAlpha(1);
      const sx = this.cutinImg.scaleX;
      const sy = this.cutinImg.scaleY;
      this.cutinImg.setScale(sx * 0.5, sy * 0.5);
      this.tweens.add({ targets: this.cutinImg, scaleX: sx * 1.4, scaleY: sy * 1.4, duration: 260 * k, ease: 'Back.easeOut' });
      objs.push(this.cutinImg);
    }
    const name = (it.skillId && SKILLS[it.skillId]?.name) || '';
    this.cutinTitle.setText(name).setVisible(true).setAlpha(0);
    this.tweens.add({ targets: this.cutinTitle, alpha: 1, duration: fadeIn, delay: 150 * k });
    const total = (it.dur ?? 0) * k;
    this.time.delayedCall(Math.max(0, total - 150 * k), () => {
      this.tweens.add({
        targets: objs,
        alpha: 0,
        duration: 150 * k,
        onComplete: () => objs.forEach((o) => (o as Phaser.GameObjects.Image).setVisible(false)),
      });
    });
  }

  private playStrike(it: TimelineItem, k: number): void {
    const who = it.who ?? 'player';
    playSfx('slash');
    const x = this.hitPoint(who, it);
    const dir: 1 | -1 = this.sideOf(who, { player: otherSide(it.sidesAfter.player) }) === 'left' ? 1 : -1;
    this.frames3(STRIKE_MS * k, (g, i) => slashArc(g, x, CLASH_Y - 6, i, dir));
    if (it.amount) this.damage(who, it.amount, x, k);
  }

  private playKo(it: TimelineItem, k: number): void {
    const who = it.who ?? 'enemy';
    const o = this.f[who];
    this.koed.add(who);
    playSfx('ko');
    this.tweens.add({
      targets: o.sprite,
      alpha: 0,
      y: SPR_BOTTOM + 20,
      scaleX: o.baseScale * 0.9,
      scaleY: o.baseScale * 0.9,
      duration: KO_MS * k,
      ease: 'Quad.easeIn',
    });
  }

  private pushMessage(line: string): void {
    if (!line) return;
    // 대사창은 줄바꿈이 없으니 MSG_CHARS(14)자씩 나눠 넣는다
    this.messages = [...this.messages, ...wrapText(line, MSG_CHARS)].slice(-MSG_LINES);
    this.drawMessages();
  }

  /** 연출을 끝내고 자리를 맞춘 뒤 'anim:done'을 한 번 보낸다 */
  private finish(): void {
    if (!this.animating) return;
    this.animating = false;
    this.doneTimer?.remove(false);
    this.doneTimer = null;
    this.time.removeAllEvents();
    // 무한 반복(▼ 깜빡임)은 남기고 연출 트윈만 끝낸다
    for (const o of [this.f.player.sprite, this.f.enemy.sprite, this.overlay, this.cutinImg, this.cutinTitle]) this.tweens.killTweensOf(o);
    this.fx.clear();
    for (const d of this.dust) d.destroy();
    this.dust = [];
    this.overlay.setVisible(false);
    this.cutinImg.setVisible(false);
    this.cutinTitle.setVisible(false);
    this.sides = { player: this.finalSides.player };
    this.placeIdle();
    for (const who of ['player', 'enemy'] as Who[]) {
      const o = this.f[who].sprite;
      if (this.koed.has(who)) o.setAlpha(0);
      else o.setAlpha(1).setY(SPR_BOTTOM);
    }
    if (this.pendingView) {
      const v = this.pendingView;
      this.pendingView = null;
      this.applyView(v);
    }
    this.bridge.setAnimating(false);
    this.bridge.emit('anim:done', { sides: { player: this.sides.player } });
  }
}
