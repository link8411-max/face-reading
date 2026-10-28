'use client';

// 일기토 벌판 단독 캔버스(296×70): fieldRenderer를 감싼 얇은 껍데기. 개발·시험용이자 대체 화면.
// 실제 전투 화면(320×240 한 장)은 createFieldScene().render를 직접 부른다. DOM 오버레이는 쓰지 않는다.
import { useEffect, useLayoutEffect, useRef } from 'react';
import type { Side, TimelineItem } from './animations';
import { createFieldScene, sceneLength, shakeAt, FIELD_W, FIELD_H, type FieldScene, type RenderExtra, type RenderResult } from './fieldRenderer';
import { playSfx, isMuted, type SfxName } from './sfx';

export interface BattleCanvasFighter {
  id: string;
  name: string;
  hpRatio: number;
}

export interface BattleCanvasProps {
  player: BattleCanvasFighter;
  enemy: BattleCanvasFighter;
  timeline: TimelineItem[];
  sides: { player: Side };
  onDone: (sides: { player: Side }) => void;
  muted?: boolean;
}

const SFX_OF: Partial<Record<TimelineItem['kind'], SfxName>> = { clash: 'hit', cutin: 'cutin', strike: 'slash', ko: 'ko' };

function prefersReducedMotion(): boolean {
  try {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  } catch {
    return false;
  }
}

export default function BattleCanvas(props: BattleCanvasProps) {
  const { player, enemy, timeline, sides } = props;
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const sceneRef = useRef<FieldScene | null>(null);
  const propsRef = useRef(props);
  const playingRef = useRef(false);
  /** 대기 들썩임 박자: -1 멈춤, 0/1 번갈아 */
  const bobRef = useRef(-1);
  const paintRef = useRef<(tl: TimelineItem[], e: number, reduced: boolean) => RenderResult | null>(() => null);

  useLayoutEffect(() => {
    propsRef.current = props;
    // 한 프레임: 흔들림만큼 region을 옮겨 그린다
    paintRef.current = (tl, e, reduced) => {
      const ctx = canvasRef.current?.getContext('2d');
      const scene = sceneRef.current;
      if (!ctx || !scene) return null;
      const pr = propsRef.current;
      const s = reduced || tl.length === 0 ? { dx: 0, dy: 0 } : shakeAt(tl, e);
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.globalAlpha = 1;
      ctx.fillStyle = '#23263A';
      ctx.fillRect(0, 0, FIELD_W, FIELD_H);
      const extra: RenderExtra = {
        alive: { player: pr.player.hpRatio > 0, enemy: pr.enemy.hpRatio > 0 },
        bob: bobRef.current,
        reducedMotion: reduced,
      };
      return scene.render(ctx, { x: s.dx, y: s.dy, w: FIELD_W, h: FIELD_H }, tl, e, pr.sides, extra);
    };
  });

  // 장면(그림 읽기) 만들기·정리
  useEffect(() => {
    const scene = createFieldScene({
      player: propsRef.current.player,
      enemy: propsRef.current.enemy,
      onLoad: () => {
        if (!playingRef.current) paintRef.current([], 0, true);
      },
    });
    sceneRef.current = scene;
    paintRef.current([], 0, true);
    return () => {
      scene.dispose();
      sceneRef.current = null;
    };
  }, []);

  // 장수가 바뀌면(교체·다음 웨이브) 새 그림
  useEffect(() => {
    sceneRef.current?.setFighters({ id: player.id, name: player.name }, { id: enemy.id, name: enemy.name });
  }, [player.id, player.name, enemy.id, enemy.name]);

  // 대기 장면: 양쪽 자리에서 2px 들썩임(움직임 줄이기면 멈춤)
  const idle = timeline.length === 0;
  const pAlive = player.hpRatio > 0;
  const eAlive = enemy.hpRatio > 0;
  useEffect(() => {
    if (!idle) return;
    bobRef.current = -1;
    paintRef.current([], 0, true);
    if (prefersReducedMotion()) return;
    const h = window.setInterval(() => {
      bobRef.current = bobRef.current ? 0 : 1;
      paintRef.current([], 0, true);
    }, 450);
    return () => window.clearInterval(h);
  }, [idle, sides.player, player.id, enemy.id, pAlive, eAlive]);

  // 타임라인 재생: 끝나면 멈추고 onDone(다음 자리)을 한 번만 부른다. 움직임 줄이기면 2배속·흔들림 없음
  useEffect(() => {
    if (timeline.length === 0) return;
    const reduced = prefersReducedMotion();
    const speed = reduced ? 2 : 1;
    const total = sceneLength(timeline);
    const fired = new Set<number>();
    let start: number | null = null;
    let raf = 0;
    let finished = false;
    playingRef.current = true;
    const step = (now: number) => {
      if (start === null) start = now;
      const e = Math.min(total, (now - start) * speed);
      const pr = propsRef.current;
      const mute = pr.muted ?? isMuted();
      timeline.forEach((it, i) => {
        if (fired.has(i) || e < it.at) return;
        fired.add(i);
        const name = SFX_OF[it.kind];
        if (name && !mute) playSfx(name);
      });
      const res = paintRef.current(timeline, e, reduced);
      if (e >= total) {
        playingRef.current = false;
        if (!finished) {
          finished = true;
          pr.onDone(res?.sidesAfter ?? timeline[timeline.length - 1].sidesAfter);
        }
        return;
      }
      raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => {
      cancelAnimationFrame(raf);
      playingRef.current = false;
    };
  }, [timeline]);

  return (
    <canvas
      ref={canvasRef}
      width={FIELD_W}
      height={FIELD_H}
      role="img"
      aria-label={`${player.name} 대 ${enemy.name} 일기토`}
      className="block w-full"
      style={{ aspectRatio: `${FIELD_W} / ${FIELD_H}`, imageRendering: 'pixelated' }}
    />
  );
}
