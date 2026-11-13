"use client";

import { useEffect, useRef, useState } from "react";
import type { Landmark } from "@/lib/face/landmarkFeatures";
import type { ZoneKey, PalaceKey } from "@/lib/face/guansangKeys";
import type { PalaceResult } from "@/lib/face/palaces";
import { LABEL_COPY, PALACE_COPY } from "@/content/guansang";
import { revealPlan, STEP_MS, type RevealStep } from "@/lib/face/revealTimeline";
import { useT } from "@/lib/i18n/LocaleProvider";
import { useEnCopy } from "@/lib/i18n/copy";
import type { UiKey } from "@/lib/i18n/dict";

const W = 390;
const H = 488; // 4:5
const ACCENT = "#2D55FF";
const PALACE_GAP_MS = 400;

interface Props {
  imageUrl: string;
  landmarks: Landmark[] | null;
  zones: { up: number; mid: number; down: number };
  dominant: ZoneKey;
  palaces: PalaceResult[];
  onDone: () => void;
}

/** object-fit: cover 변환. 정규화 좌표(0~1, 원본 이미지 기준) -> 캔버스 픽셀. */
export function coverTransform(iw: number, ih: number, w = W, h = H) {
  const s = Math.max(w / iw, h / ih);
  const ox = (w - iw * s) / 2;
  const oy = (h - ih * s) / 2;
  return {
    s,
    ox,
    oy,
    px: (x: number) => x * iw * s + ox,
    py: (y: number) => y * ih * s + oy,
  };
}

function browCenterY(lm: Landmark[]) {
  return (lm[105].y + lm[334].y) / 2;
}

type Align = "center" | "left" | "right";

function palaceAnchor(key: PalaceKey, lm: Landmark[]): { x: number; y: number; align: Align } {
  const by = browCenterY(lm);
  switch (key) {
    case "money": return { x: lm[1].x + 0.08, y: lm[1].y, align: "left" };
    case "work": return { x: lm[10].x, y: by - 0.14, align: "center" };
    case "love": return { x: lm[263].x, y: lm[263].y, align: "left" };
    case "people": return { x: lm[70].x, y: lm[70].y, align: "right" };
    case "base": return { x: lm[152].x, y: lm[152].y + 0.05, align: "center" };
  }
}

const STEP_KEY: Record<RevealStep, UiKey> = { dots: "reveal.dots", zones: "reveal.zones", palaces: "reveal.palaces", card: "reveal.card" };

const ZONE_KEY: Record<ZoneKey, UiKey> = { up: "reveal.up", mid: "reveal.mid", down: "reveal.down" };

export default function RevealMotion({ imageUrl, landmarks, zones, dominant, palaces, onDone }: Props) {
  const tr = useT();
  const enG = useEnCopy()?.guansang;
  const LABELS = enG?.label ?? LABEL_COPY;
  const PALACES = enG?.palace ?? PALACE_COPY;
  const canvasRef = useRef<HTMLCanvasElement>(null);
  // 라벨 위치도 캔버스의 cover 변환을 거쳐 점·선과 같은 좌표계를 쓴다
  const [imgSize, setImgSize] = useState<{ w: number; h: number } | null>(null);
  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;
  const doneRef = useRef(false);
  const cancelRef = useRef<() => void>(() => {});
  const [step, setStep] = useState<RevealStep | null>(null);
  const [palaceCount, setPalaceCount] = useState(0);

  const finish = () => {
    if (doneRef.current) return;
    doneRef.current = true;
    cancelRef.current();
    onDoneRef.current();
  };

  useEffect(() => {
    if (!landmarks || landmarks.length < 400) {
      finish();
      return;
    }
    const reduced =
      typeof window !== "undefined" &&
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const plan = revealPlan({ reducedMotion: reduced, hasLandmarks: true });
    if (plan.length === 1) {
      const t = setTimeout(finish, 0);
      cancelRef.current = () => clearTimeout(t);
      return () => clearTimeout(t);
    }

    const lm = landmarks;
    const timers: ReturnType<typeof setTimeout>[] = [];
    let raf = 0;
    let cancelled = false;
    const img = new Image();
    let loaded = false;
    img.onload = () => { loaded = true; setImgSize({ w: img.naturalWidth, h: img.naturalHeight }); };
    img.src = imageUrl;

    let curStep: RevealStep = plan[0];
    let stepStart = Date.now();

    const draw = () => {
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext("2d");
      if (!canvas || !ctx) return;
      ctx.clearRect(0, 0, W, H);
      if (loaded && img.naturalWidth > 0) {
        const { s, ox, oy } = coverTransform(img.naturalWidth, img.naturalHeight);
        ctx.drawImage(img, ox, oy, img.naturalWidth * s, img.naturalHeight * s);
      }
      const iw = img.naturalWidth || W;
      const ih = img.naturalHeight || H;
      const t = coverTransform(iw, ih);
      const elapsed = Date.now() - stepStart;
      const n = curStep === "dots"
        ? Math.min(lm.length, Math.floor((lm.length * elapsed) / STEP_MS.dots))
        : lm.length;
      ctx.fillStyle = ACCENT;
      ctx.globalAlpha = 0.9;
      for (let i = 0; i < n; i++) {
        ctx.beginPath();
        ctx.arc(t.px(lm[i].x), t.py(lm[i].y), 1.5, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      if (curStep !== "dots") {
        ctx.strokeStyle = ACCENT;
        ctx.lineWidth = 1;
        for (const y of [browCenterY(lm), lm[1].y]) {
          const py = t.py(y);
          ctx.beginPath();
          ctx.moveTo(0, py);
          ctx.lineTo(W, py);
          ctx.stroke();
        }
      }
    };

    const loop = () => {
      if (cancelled) return;
      draw();
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    let at = 0;
    plan.forEach((s) => {
      timers.push(setTimeout(() => {
        curStep = s;
        stepStart = Date.now();
        setStep(s);
      }, at));
      if (s === "palaces") {
        for (let i = 0; i < 5; i++) {
          timers.push(setTimeout(() => setPalaceCount(i + 1), at + i * PALACE_GAP_MS));
        }
      }
      at += STEP_MS[s];
    });
    timers.push(setTimeout(finish, at));

    cancelRef.current = () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      timers.forEach(clearTimeout);
    };
    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      timers.forEach(clearTimeout);
    };
    // 마운트 때 한 번만 시작한다.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const showBars = step === "zones" || step === "palaces" || step === "card";
  const fading = step === "card";
  const order: ZoneKey[] = ["up", "mid", "down"];
  const maxZone = Math.max(zones.up, zones.mid, zones.down, 0.0001);

  return (
    <div
      className="no-screenshot fixed inset-x-0 top-0 z-40 flex flex-col items-center justify-start bg-paper pt-14"
      style={{ bottom: "calc(4rem + env(safe-area-inset-bottom))" }}
    >
      <button
        type="button"
        onClick={finish}
        className="absolute right-4 top-4 z-10 rounded-full border border-line bg-white px-3.5 py-1.5 text-[13px] font-medium text-ink"
      >
        {tr("reveal.skip")}
      </button>
      <p className="absolute left-4 top-4 z-10 font-serif text-[16px] text-ink">
        {tr(STEP_KEY[step ?? "dots"])}
      </p>
    {showBars && landmarks && (
      <div className="absolute right-4 top-14 z-10 w-[84px] space-y-1.5 rounded-[22px] bg-paper/80 p-2.5">
        {order.map((z) => (
          <div key={z} className="flex items-center gap-1.5 text-[11px] text-ink">
            <span className="w-3 shrink-0">{tr(ZONE_KEY[z])}</span>
            <div className="h-2 flex-1 overflow-hidden rounded-full bg-card-2">
              <div
                data-testid={`bar-${z}`}
                className={`h-full rounded-full ${z === dominant ? "bg-current text-accent" : "bg-line"}`}
                style={{ width: `${Math.round((zones[z] / maxZone) * 100)}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    )}
      <div
        className="relative w-full max-w-[390px] overflow-hidden"
        style={{ aspectRatio: `${W} / ${H}` }}
      >
        <canvas
          ref={canvasRef}
          width={W}
          height={H}
          aria-hidden="true"
          className="h-full w-full transition-opacity duration-500"
          style={{ opacity: fading ? 0.3 : 1 }}
        />
        {landmarks &&
          palaces.slice(0, palaceCount).map((p) => {
            const a = palaceAnchor(p.key, landmarks);
            const t = imgSize ? coverTransform(imgSize.w, imgSize.h) : null;
            const ax = t ? (t.px(a.x) / W) * 100 : a.x * 100;
            const ay = t ? (t.py(a.y) / H) * 100 : a.y * 100;
            const left =
              a.align === "center"
                ? Math.min(80, Math.max(20, ax))
                : a.align === "left"
                  ? Math.min(60, Math.max(2, ax))
                  : Math.min(98, Math.max(40, ax));
            const tx = a.align === "center" ? "-50%" : a.align === "right" ? "-100%" : "0";
            return (
              <div
                key={p.key}
                className="absolute -translate-y-1/2 whitespace-nowrap rounded-full border border-line bg-white px-2 py-0.5 text-[11px] text-ink"
                style={{
                  left: `${left}%`,
                  top: `${Math.min(94, Math.max(6, ay))}%`,
                  transform: `translate(${tx}, -50%)`,
                }}
              >
                {LABELS[p.label]} · {PALACES[p.key].easy}
              </div>
            );
          })}
      </div>
    </div>
  );
}
