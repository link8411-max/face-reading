"use client";

import { useEffect, useRef, useState } from "react";
import { GAME_W } from "@/game/duel/config";
import { hitRects, type OverlaySlot } from "./clientLogic";

export interface OverlayButton extends OverlaySlot {
  disabled?: boolean;
  /** 고른 상태(전투 메뉴 커서 줄) */
  pressed?: boolean;
}

// 캔버스 위의 투명 DOM 버튼: 화면 읽기·키보드·터치를 받는다(그림은 Phaser가 그린다).
// 320×240 설계 좌표를 래퍼 크기로 환산하고, 44px보다 작으면 이웃과 겹치지 않는 만큼 터치 영역을 넓힌다.
export default function OverlayButtons({ buttons, disabled, onFocus, onAction, onKeyDown, hover = true }: {
  buttons: OverlayButton[];
  disabled: boolean;
  onFocus: (id: string) => void;
  onAction: (id: string) => void;
  /** 화살표·Enter 같은 키(전투: 위아래로 커서, Enter/Space로 결정) */
  onKeyDown?: (e: React.KeyboardEvent) => void;
  /** 마우스를 올리면 커서를 옮길지(전투는 고르기→결정이라 끈다) */
  hover?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const measure = () => setSize({ w: el.clientWidth, h: el.clientHeight });
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const k = size.w / GAME_W;
  const rects = size.w
    ? hitRects(
        buttons.map((b) => ({
          x: b.x * k,
          y: b.y * k,
          w: b.w * k,
          h: b.h * k,
          ...(b.panel ? { panel: { x: b.panel.x * k, y: b.panel.y * k, w: b.panel.w * k, h: b.panel.h * k } } : {}),
        })),
        size.w,
        size.h,
      )
    : [];

  return (
    <div ref={ref} className="absolute inset-0" onKeyDown={onKeyDown}>
      {rects.map((r, i) => {
        const b = buttons[i];
        const off = disabled || !!b.disabled;
        return (
          <button
            key={b.id}
            type="button"
            data-duel-btn={b.id}
            aria-label={b.label}
            aria-disabled={off || undefined}
            aria-pressed={b.pressed}
            onFocus={() => onFocus(b.id)}
            onPointerEnter={(e) => { if (hover && e.pointerType === "mouse") onFocus(b.id); }}
            onClick={() => { if (!off) onAction(b.id); }}
            className="absolute bg-transparent rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-paper cursor-pointer aria-disabled:cursor-default"
            style={{ left: r.x, top: r.y, width: r.w, height: r.h }}
          />
        );
      })}
    </div>
  );
}
