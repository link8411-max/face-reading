// 전투 화면(와꾸 v5 draw1): 보이는 것은 전부 Phaser 오브젝트. 입력은 React의 투명 DOM 버튼이 bridge로 보낸다.
import * as Phaser from 'phaser';
import { SKILLS } from '@/lib/duel/skills';
import { WAVES } from '@/lib/duel/run';
import { FIELD, MUTED, PALETTE as S, SPRITE_PX, hex } from './config';
import type { BattleView, DuelBridge, DuelEvents, FighterView, FocusId } from './bridge';
import { playSfx } from './sfx';
import { otherSide, otherWho, timelineLength, CLASH_MS, PASS_MS, STRIKE_MS, KO_MS, type Side, type TimelineItem, type Who } from './timeline';
import { portraitKeyFor, spriteKeyFor } from './textures';
import { KIND_MARK, box, cursor, hpBar, slashArc, spark, tag, text } from './ui';

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
const MENU_Y = 175;
const MENU_STEP = 11;
const SWITCH_Y = 222;
const MSG_LINES = 3;
const FOCUS_IDS: FocusId[] = ['skill0', 'skill1', 'skill2', 'skill3', 'switch'];

interface FighterObjs {
  sprite: Phaser.GameObjects.Image;
  baseScale: number;
  portrait: Phaser.GameObjects.Image;
  noPortrait: Phaser.GameObjects.Text;
  name: Phaser.GameObjects.Text;
  str: Phaser.GameObjects.Text;
  lead: Phaser.GameObjects.Text;
  info: Phaser.GameObjects.Text;
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
  private focus: FocusId = 'skill0';
  /** 연출 중 보여 주는 체력(피해를 맞을 때마다 깎는다) */
  private shownHp: Record<Who, number> = { player: 0, enemy: 0 };
  private messages: string[] = [];
  /** 이번 연출에서 쓰러진 쪽 */
  private koed = new Set<Who>();
  /** 이번 연출이 끝난 뒤의 자리 */
  private finalSides: { player: Side } = { player: 'left' };

  private f!: Record<Who, FighterObjs>;
  private wave!: Phaser.GameObjects.Text;
  private turn!: Phaser.GameObjects.Text;
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

  constructor() {
    super('Battle');
  }

  create(): void {
    this.bridge = this.registry.get('bridge') as DuelBridge;
    this.buildStatic();
    this.buildDynamic();

    const onUpdate = (p: DuelEvents['run:update']) => {
      if (!p.view) return;
      if (this.animating) this.pendingView = p.view;
      else this.applyView(p.view);
    };
    const onPlay = (p: DuelEvents['anim:play']) => this.play(p.timeline, p.sides);
    const onFocus = (p: DuelEvents['ui:focus']) => this.setFocus(p.id, true);
    this.bridge.on('run:update', onUpdate);
    this.bridge.on('anim:play', onPlay);
    this.bridge.on('ui:focus', onFocus);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.bridge.off('run:update', onUpdate);
      this.bridge.off('anim:play', onPlay);
      this.bridge.off('ui:focus', onFocus);
    });

    if (this.bridge.view) this.applyView(this.bridge.view);
    this.bridge.setAnimating(false);
    this.bridge.emit('scene:changed', { scene: 'battle' });
  }

  // ── 한 번 그리는 것 ──

  private buildStatic(): void {
    this.add.image(0, 0, 'cloth').setOrigin(0);
    this.add.image(0, 0, 'frame').setOrigin(0);
    const g = this.add.graphics();
    box(g, 10, 12, 50, 58);
    box(g, 260, 12, 50, 58);
    box(g, 10, 76, 300, 74, S.ink);
    box(g, 10, 172, 118, 58, S.cream);
    box(g, 134, 172, 176, 58, S.cream);
    this.add.image(FIELD.x, FIELD.y, 'field').setOrigin(0);
    // ▼ 깜빡임
    const more = text(this, 298, 218, '▼', { size: 8 });
    this.tweens.add({ targets: more, alpha: 0, duration: 400, yoyo: true, repeat: -1, hold: 300 });
    this.buildFighterTexts(g);
  }

  private buildFighterTexts(g: Phaser.GameObjects.Graphics): void {
    const make = (who: Who): FighterObjs => {
      const left = who === 'player';
      const px = left ? 12 : 262;
      const portrait = this.add.image(px, 14, '__DEFAULT').setOrigin(0).setVisible(false);
      const noPortrait = text(this, px + 23, 41, '?', { size: 16, color: S.gold2, bold: true }).setOrigin(0.5);
      const tagX = left ? 64 : 212;
      const str = tag(this, g, tagX, 28, '무력');
      const lead = tag(this, g, tagX, 42, '통솔');
      const name = text(this, left ? 64 : 256, 14, '', { size: 10, color: S.cream, bold: true }).setOrigin(left ? 0 : 1, 0);
      const info = text(this, left ? 64 : 256, 56, '', { size: 7, color: S.gold, bold: true }).setOrigin(left ? 0 : 1, 0);
      const hpNum = text(this, left ? 12 : 308, 160, '', { size: 7, color: S.cream2, num: true }).setOrigin(left ? 0 : 1, 0);
      const sprite = this.add.image(SIDE_X[left ? 'left' : 'right'], SPR_BOTTOM, '__DEFAULT').setOrigin(0.5, 1);
      return { sprite, baseScale: 1, portrait, noPortrait, name, str, lead, info, hpNum };
    };
    this.f = { player: make('player'), enemy: make('enemy') };
  }

  private buildDynamic(): void {
    this.wave = text(this, 160, 12, '', { size: 7, color: S.gold, num: true }).setOrigin(0.5, 0);
    this.turn = text(this, 160, 22, '', { size: 7, color: S.cream2, num: true }).setOrigin(0.5, 0);
    this.hpG = this.add.graphics();
    this.cursorG = this.add.graphics();
    this.menu = [0, 1, 2, 3].map((i) => {
      const y = MENU_Y + i * MENU_STEP;
      return {
        name: text(this, 22, y, '', { size: 9 }),
        sub: text(this, 82, y + 1, '', { size: 6, color: MUTED }),
      };
    });
    this.switchLine = text(this, 22, SWITCH_Y, '', { size: 6, color: MUTED });
    this.msg = [0, 1, 2].map((i) => text(this, 140, 178 + i * 13, '', { size: 9, bold: i === 0 }));
    // 메뉴 위에 포인터를 올리면 커서만 옮긴다(누르기는 React DOM 버튼 몫)
    FOCUS_IDS.forEach((id, i) => {
      const y = i < 4 ? MENU_Y + i * MENU_STEP - 1 : SWITCH_Y - 2;
      const zone = this.add.zone(12, y, 114, i < 4 ? MENU_STEP : 9).setOrigin(0).setInteractive();
      zone.on('pointerover', () => this.setFocus(id, true));
    });
    this.fx = this.add.graphics();
    this.overlay = this.add.rectangle(0, 0, 320, 240, hex(S.navy), 0.65).setOrigin(0).setVisible(false);
    this.cutinImg = this.add.image(CENTER_X, 104, '__DEFAULT').setVisible(false);
    this.cutinTitle = text(this, CENTER_X, 146, '', { size: 12, color: S.gold, bold: true }).setOrigin(0.5, 0).setVisible(false);
    this.cutinTitle.setShadow(1, 1, S.ink, 0);
  }

  // ── 화면 값 반영 ──

  private applyView(v: BattleView): void {
    this.view = v;
    this.wave.setText(`WAVE ${v.wave}/${WAVES}`);
    this.turn.setText(`TURN ${v.turn}`);
    this.applyFighter('player', v.player, `${v.player.kind} Lv${v.player.level}`);
    this.applyFighter('enemy', v.enemy, `${v.enemy.kind} Lv${v.enemy.level}${v.enemy.isBoss ? ' · 보스' : ''}`);
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
    o.str.setText(String(fv.stats.무력));
    o.lead.setText(String(fv.stats.통솔));
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

  private drawMessages(): void {
    this.msg.forEach((t, i) => t.setText(this.messages[i] ?? ''));
  }

  private drawMenu(): void {
    const v = this.view;
    const g = this.cursorG.clear();
    if (!v) return;
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
      row.name.setFontStyle(on ? 'bold' : 'normal');
      const mark = KIND_MARK[s.kind] ?? '';
      const desc = SKILLS[s.id]?.effect === 'guard' ? '피해 절반' : null;
      row.sub.setText(desc ?? `${mark}·${s.usesLeft === null ? '무제한' : `남은 ${s.usesLeft}`}`);
      if (on) cursor(g, 15, MENU_Y + i * MENU_STEP + 2);
    });
    const others = v.party
      .filter((p) => p.id !== v.player.id)
      .map((p) => (p.hp <= 0 ? `${p.name}(전사)` : p.hp < p.maxHp / 2 ? `${p.name}(부상)` : p.name));
    this.switchLine.setText(`교체 ▷ ${others.length ? others.join(' · ') : '없음'}`);
    this.switchLine.setColor(this.focus === 'switch' ? S.red : MUTED);
    if (this.focus === 'switch') cursor(g, 15, SWITCH_Y + 1);
  }

  private setFocus(id: FocusId, sound: boolean): void {
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

  private play(timeline: TimelineItem[], sides: { player: Side }): void {
    if (this.animating) this.finish();
    this.sides = { player: sides.player };
    this.koed.clear();
    this.placeIdle();
    this.animating = true;
    this.bridge.setAnimating(true);
    const reduce = reducedMotion();
    const k = reduce ? 0.5 : 1;
    for (const it of timeline) {
      const at = it.at * k;
      switch (it.kind) {
        case 'pass':
          this.playPass(at, it, k);
          break;
        case 'clash':
          this.time.delayedCall(at, () => this.playClash(it, k, reduce));
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
      this.tweens.add({ targets: o.sprite, x: meetX, delay: at, duration: meet, ease: 'Quad.easeIn' });
      this.tweens.add({
        targets: o.sprite,
        x: SIDE_X[to],
        delay: at + meet + stay,
        duration: leave,
        ease: 'Quad.easeOut',
        onComplete: () => o.sprite.setFlipX(to === 'right'),
      });
    }
  }

  /** 맞은 쪽(공격한 쪽의 상대)이 서 있는 충돌 지점 */
  private hitPoint(attacker: Who, it: TimelineItem): number {
    const defFrom = this.sideOf(otherWho(attacker), { player: otherSide(it.sidesAfter.player) });
    return CENTER_X + (defFrom === 'left' ? -MEET_GAP : MEET_GAP);
  }

  private damage(attacker: Who, amount: number, x: number): void {
    const def = otherWho(attacker);
    this.shownHp[def] = Math.max(0, this.shownHp[def] - amount);
    this.drawHp();
    const t = text(this, x, FIELD.y + 30, `-${amount}`, { size: 9, color: S.white, num: true }).setOrigin(0.5, 0);
    t.setShadow(1, 1, S.ink, 0);
    this.tweens.add({ targets: t, y: t.y - 14, alpha: 0, duration: 600, ease: 'Quad.easeOut', onComplete: () => t.destroy() });
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
      const t = text(this, x, FIELD.y + 30, 'MISS', { size: 7, color: S.cream, num: true }).setOrigin(0.5, 0);
      this.tweens.add({ targets: t, y: t.y - 10, alpha: 0, duration: 500, onComplete: () => t.destroy() });
      return;
    }
    playSfx('hit');
    if (!reduce) this.cameras.main.shake(120, 0.004);
    this.frames3(CLASH_MS * k, (g, i) => spark(g, CENTER_X, CLASH_Y, i));
    this.damage(who, amount, this.hitPoint(who, it));
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
    if (it.amount) this.damage(who, it.amount, x);
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
    this.messages = [...this.messages, line].slice(-MSG_LINES);
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
