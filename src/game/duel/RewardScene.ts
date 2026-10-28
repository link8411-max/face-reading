// 보상 화면(와꾸 v5 draw2): 승전 한 줄, 카드 3장, 동행·다음 싸움 창.
// 순서: (항복이 있으면) 항복 창 — 초상이 미끄러져 들어오고 동행 칸, 자리가 없으면 교체 고르기
//      → 카드가 한 장씩 뒤집힌다(scaleX 1→0→1, 뒷면↔앞면) → 그다음에 입력을 연다.
// 대상 고르기(보검을 누구에게)는 카드 위에 작은 창.
import * as Phaser from 'phaser';
import { MUTED, PALETTE as S, hex } from './config';
import { REWARD_CARD, pickLayout, pickWindowH, recruitLayout } from './layout';
import { PanelScene } from './PanelScene';
import { playSfx } from './sfx';
import { portraitKeyFor } from './textures';
import { box, cursor } from './ui';
import { drawRewardIcon } from './rewardIcons';
import type { PickView, RecruitView, RewardShow } from './bridge';

const CARD_INNER = REWARD_CARD.w - 12;
const FLIP_START = 250;
const FLIP_STEP = 260;
const FLIP_HALF = 110;

export class RewardScene extends PanelScene {
  protected readonly sceneName = 'reward' as const;
  /** 카드가 앞면으로 다 뒤집혔는지 */
  private revealed = false;
  private flipping = false;
  /** 미끄러져 들어오는 연출을 이미 보여 준 항복 장수 */
  private slidIn: string | null = null;
  private backs: Phaser.GameObjects.Container[] = [];

  constructor() {
    super('Reward');
  }

  protected onCreate(): void {
    this.revealed = false;
    this.flipping = false;
    this.slidIn = null;
    this.backs = [];
  }

  private get show(): RewardShow | undefined {
    return this.bridge.shown.reward;
  }

  protected accepts(id: string): boolean {
    const v = this.show;
    if (v?.recruit || v?.pick) return /^opt\d+$/.test(id);
    return this.revealed && /^card\d$/.test(id);
  }

  protected listen(on: Parameters<PanelScene['listen']>[0]): void {
    on('reward:show', () => {
      if (this.focus && !this.accepts(this.focus)) this.focus = null;
      this.redraw();
      // 항복 창을 닫고 나면 카드를 뒤집는다
      if (!this.show?.recruit && !this.revealed && !this.flipping) this.startFlip();
    });
  }

  /** 항복 창이 없으면 카드를 뒤집고 나서 입력을 연다 */
  protected announce(): void {
    if (!this.show?.recruit && !this.revealed) this.startFlip();
    else super.announce();
  }

  protected draw(g: Phaser.GameObjects.Graphics): void {
    const v = this.show;
    if (!v) return;
    box(g, 10, 12, 300, 22, S.cream);
    this.fit(this.t(16, 17, v.headline, { ko: 9 }), 288);
    this.t(16, 38, '보상 하나를 고르시오', { ko: 9, color: S.gold, shadow: true });

    this.backs = [];
    v.cards.forEach((c, i) => {
      if (this.revealed) this.front(i, c, !v.pick && !v.recruit && this.focus === `card${i}`);
      else this.backs[i] = this.back(i);
    });

    box(g, 10, 180, 300, 50, S.cream);
    this.fit(this.t(16, 185, `동행  ${v.party.join(' · ')}`, { ko: 9 }), 288);
    if (v.next) this.fit(this.t(16, 200, `다음  ${v.next}`, { ko: 9 }), 288);
    this.more();

    if (v.recruit) this.drawRecruit(v.recruit, v.pick);
    else if (v.pick) this.drawPick(v.pick);
  }

  // ── 카드 ──

  private cardCenter(i: number) {
    return { x: REWARD_CARD.x0 + i * REWARD_CARD.step + REWARD_CARD.w / 2, y: REWARD_CARD.y + REWARD_CARD.h / 2 };
  }

  /** 뒷면: 틀과 같은 먹녹색 천(체커 디더)에 진금 테두리, 가운데 주홍 인장 */
  private back(i: number): Phaser.GameObjects.Container {
    const { x, y } = this.cardCenter(i);
    const c = this.add.container(x, y);
    const g = this.add.graphics();
    const ox = -REWARD_CARD.w / 2;
    const oy = -REWARD_CARD.h / 2;
    box(g, ox, oy, REWARD_CARD.w, REWARD_CARD.h, S.green1);
    g.fillStyle(hex(S.green2), 1);
    for (let yy = 2; yy < REWARD_CARD.h - 2; yy++) for (let xx = 2 + (yy % 2); xx < REWARD_CARD.w - 2; xx += 2) g.fillRect(ox + xx, oy + yy, 1, 1);
    g.fillStyle(hex(S.gold2), 1);
    g.fillRect(ox + 6, oy + 6, REWARD_CARD.w - 12, 1);
    g.fillRect(ox + 6, oy + REWARD_CARD.h - 7, REWARD_CARD.w - 12, 1);
    g.fillRect(ox + 6, oy + 6, 1, REWARD_CARD.h - 12);
    g.fillRect(ox + REWARD_CARD.w - 7, oy + 6, 1, REWARD_CARD.h - 12);
    // 주홍 인장(20×20): 테두리와 안쪽 획
    g.fillStyle(hex(S.red), 1);
    g.fillRect(-10, -10, 20, 20);
    g.fillStyle(hex(S.cream), 1);
    g.fillRect(-8, -8, 16, 1);
    g.fillRect(-8, 7, 16, 1);
    g.fillRect(-8, -8, 1, 16);
    g.fillRect(7, -8, 1, 16);
    g.fillRect(-5, -5, 10, 1);
    g.fillRect(-5, -1, 10, 1);
    g.fillRect(-5, 3, 10, 1);
    g.fillRect(0, -5, 1, 9);
    c.add(g);
    return c;
  }

  /** 앞면: 등급·이름·설명·작은 문장. 컨테이너 가운데가 카드 가운데 */
  private front(i: number, card: RewardShow['cards'][number], on: boolean): Phaser.GameObjects.Container {
    const { x, y } = this.cardCenter(i);
    const c = this.add.container(x, y);
    const g = this.add.graphics();
    c.add(g);
    const ox = -REWARD_CARD.w / 2;
    const oy = -REWARD_CARD.h / 2;
    box(g, ox, oy, REWARD_CARD.w, REWARD_CARD.h, on ? S.cream : S.cream2);
    if (on) {
      g.fillStyle(hex(S.red), 1);
      g.fillRect(ox + 2, oy + 2, REWARD_CARD.w - 4, 2);
    }
    const rare = card.rarity === 'rare';
    c.add(this.t(ox + 6, oy + 4, rare ? '희귀' : '보통', { ko: 9, color: rare ? S.red : MUTED }));
    c.add(this.fit(this.t(ox + 6, oy + 16, card.name, { ko: 11, bold: true }), CARD_INNER));
    g.fillStyle(hex(S.gold2), 1);
    g.fillRect(ox + 6, oy + 32, CARD_INNER, 1);
    // 설명은 늘 Galmuri9. 길면 아래 작은 문장을 빼고 그 자리까지 쓴다
    const desc = this.t(ox + 6, oy + 37, card.desc, { ko: 9, wrap: CARD_INNER });
    c.add(desc);
    const long = desc.height > 54;
    const ix = -10;
    const iy = oy + 94;
    if (long) {
      if (on) cursor(g, ox + 2, oy + 20);
      return c;
    }
    // 아이콘 칸: 등급 색 테두리 안에 종류별 16×16 도트 아이콘
    g.fillStyle(hex(rare ? S.red : S.gold2), 1);
    g.fillRect(ix, iy, 20, 20);
    g.fillStyle(hex(S.cream), 1);
    g.fillRect(ix + 1, iy + 1, 18, 18);
    drawRewardIcon(g, card.id, ix + 2, iy + 2);
    if (on) cursor(g, ix - 8, iy + 7);
    return c;
  }

  /** 카드를 한 장씩 뒤집고, 다 뒤집으면 입력을 연다 */
  private startFlip(): void {
    const v = this.show;
    if (!v || this.flipping) return;
    this.flipping = true;
    const n = v.cards.length;
    if (n === 0) {
      this.revealed = true;
      this.flipping = false;
      super.announce();
      return;
    }
    v.cards.forEach((card, i) => {
      const b = this.backs[i];
      this.tweens.add({
        targets: b,
        scaleX: 0,
        delay: FLIP_START + i * FLIP_STEP,
        duration: FLIP_HALF,
        ease: 'Quad.easeIn',
        onComplete: () => {
          b.destroy();
          playSfx('card');
          const f = this.front(i, card, false).setScale(0, 1);
          this.tweens.add({
            targets: f,
            scaleX: 1,
            duration: FLIP_HALF,
            ease: 'Quad.easeOut',
            onComplete: () => {
              if (i !== n - 1) return;
              this.revealed = true;
              this.flipping = false;
              super.announce();
            },
          });
        },
      });
    });
  }

  // ── 항복 창 ──

  private drawRecruit(r: RecruitView, p?: PickView): void {
    this.add.rectangle(0, 0, 320, this.H, hex(S.navy), 0.7).setOrigin(0).setDepth(1);
    const g = this.add.graphics().setDepth(2);
    const R = recruitLayout(this.tall);
    box(g, R.x, R.y, R.w, R.h, S.cream);
    this.t(R.x + 10, R.y + 6, r.title, { ko: 11, bold: true, color: S.red }).setDepth(3);

    // 초상: 처음 한 번은 오른쪽 밖에서 미끄러져 들어온다
    const port = this.add.container(R.portX, R.portY).setDepth(3);
    const pg = this.add.graphics();
    box(pg, 0, 0, 50, 58);
    port.add(pg);
    const pk = portraitKeyFor(this, r.id);
    if (pk) port.add(this.add.image(2, 2, pk).setOrigin(0).setDisplaySize(46, 54));
    if (this.slidIn !== r.id) {
      this.slidIn = r.id;
      port.setX(330);
      this.tweens.add({ targets: port, x: R.portX, duration: 450, ease: 'Back.easeOut' });
      playSfx('cutin');
    }
    this.t(R.slotX, R.portY + 2, r.name, { ko: 11, bold: true }).setDepth(3);
    this.t(R.slotX, R.portY + 18, `${r.kind} Lv${r.level}`, { ko: 9, color: MUTED }).setDepth(3);

    // 동행 칸
    this.t(R.slotX + r.slots * R.slotStep + 2, R.slotY + 12, '동행', { ko: 9, color: S.red }).setDepth(3);
    for (let s = 0; s < r.slots; s++) {
      const x = R.slotX + s * R.slotStep;
      const m = r.party[s];
      if (m?.id === r.id) {
        g.fillStyle(hex(S.red), 1);
        g.fillRect(x - 2, R.slotY - 2, R.slotW + 4, R.slotH + 4);
      }
      box(g, x, R.slotY, R.slotW, R.slotH, m ? S.cream2 : S.ink);
      const k = m ? portraitKeyFor(this, m.id) : null;
      if (k) this.add.image(x + 2, R.slotY + 2, k).setOrigin(0).setDisplaySize(R.slotW - 4, R.slotH - 4).setDepth(3);
      else if (!m) this.t(x + R.slotW / 2, R.slotY + 12, '빈', { ko: 9, color: S.cream2 }).setOrigin(0.5, 0).setDepth(3);
    }
    this.fit(this.t(R.portX, R.slotY + R.slotH + 3, r.note, { ko: 9, color: r.full ? S.red : S.ink }).setDepth(3), R.w - 24);

    p?.options.forEach((o, i) => this.row(g, R.rowX, R.rowY0 + i * R.rowStep, R.rowW, R.rowH, R.rowStep, o, this.focus === `opt${i}`));
  }

  private drawPick(p: PickView): void {
    this.add.rectangle(0, 0, 320, this.H, hex(S.navy), 0.6).setOrigin(0).setDepth(1);
    const g = this.add.graphics().setDepth(2);
    const P = pickLayout(this.tall);
    box(g, P.x, P.y, P.w, pickWindowH(p.options.length, this.tall), S.cream);
    this.fit(this.t(P.x + 8, P.y + 6, p.title, { ko: this.tall ? 11 : 9, color: S.red }).setDepth(3), P.w - 16);
    p.options.forEach((o, i) => this.row(g, P.rowX, P.rowY0 + i * P.rowStep, P.rowW, P.rowH, P.rowStep, o, this.focus === `opt${i}`));
  }

  /** 고르기 줄 하나: 바탕(맞닿으면 1px 띄움) + 아래 진금 선 + 글(세로형은 Galmuri11, 가운데 높이) */
  private row(g: Phaser.GameObjects.Graphics, x: number, y: number, w: number, h: number, step: number, o: PickView['options'][number], on: boolean): void {
    const fillH = step <= h ? h - 1 : h;
    g.fillStyle(hex(on ? S.cream2 : S.cream), 1);
    g.fillRect(x, y, w, fillH);
    g.fillStyle(hex(S.gold2), 1);
    g.fillRect(x, y + fillH, w, 1);
    const ko = this.tall ? 11 : 9;
    const ty = y + Math.floor((fillH - (this.tall ? 12 : 10)) / 2);
    if (on) cursor(g, x + 3, ty + 2);
    const col = o.disabled ? MUTED : on ? S.red : S.ink;
    this.t(x + 10, ty, o.label, { ko, color: col }).setDepth(3);
    if (o.sub) this.t(x + w - 4, ty, o.sub, { ko, color: MUTED }).setOrigin(1, 0).setDepth(3);
  }
}
