"use client";

import { useEffect, useRef, useState } from "react";

const DURATION = 6000;
const W = 300;
const H = 520;
const TYPES = ["video/mp4", "video/mp4;codecs=avc1", "video/webm", "video/webm;codecs=vp9", "video/webm;codecs=vp8"];

function draw(ctx: CanvasRenderingContext2D, t: number) {
  ctx.fillStyle = "#F3E6B3";
  ctx.fillRect(0, 0, W, H);
  ctx.strokeStyle = "#B3392B";
  ctx.lineWidth = 6;
  ctx.lineCap = "round";
  ctx.beginPath();
  const p = Math.min(1, t / DURATION);
  const n = Math.floor(p * 120);
  for (let i = 0; i <= n; i++) {
    const a = (i / 120) * Math.PI * 6;
    const r = 20 + (i / 120) * 110;
    const x = W / 2 + Math.cos(a) * r;
    const y = H / 2 + Math.sin(a) * r;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.stroke();
}

export default function BujeokRec() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [support, setSupport] = useState<string[]>([]);
  const [status, setStatus] = useState("대기");
  const [url, setUrl] = useState<string | null>(null);
  const [mime, setMime] = useState("");

  useEffect(() => {
    const ok = typeof MediaRecorder === "undefined" ? [] : TYPES.filter((t) => MediaRecorder.isTypeSupported(t));
    setSupport(ok);
    const ctx = canvasRef.current?.getContext("2d");
    if (ctx) draw(ctx, 0);
  }, []);

  async function record() {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx || typeof MediaRecorder === "undefined") {
      setStatus("MediaRecorder 없음");
      return;
    }
    const type = TYPES.find((t) => MediaRecorder.isTypeSupported(t));
    setUrl(null);
    setStatus("녹화 중");
    try {
      const rec = new MediaRecorder(canvas.captureStream(30), type ? { mimeType: type } : undefined);
      const chunks: Blob[] = [];
      rec.ondataavailable = (e) => e.data.size && chunks.push(e.data);
      rec.onstop = () => {
        const blob = new Blob(chunks, { type: rec.mimeType });
        setMime(rec.mimeType);
        setUrl(URL.createObjectURL(blob));
        setStatus(`녹화 끝 (${Math.round(blob.size / 1024)}KB)`);
      };
      rec.start();
      const t0 = performance.now();
      const tick = (now: number) => {
        const t = now - t0;
        draw(ctx, t);
        if (t < DURATION) requestAnimationFrame(tick);
        else rec.stop();
      };
      requestAnimationFrame(tick);
    } catch (e) {
      setStatus(`실패: ${e instanceof Error ? e.message : String(e)}`);
    }
  }

  const ext = mime.includes("mp4") ? "mp4" : "webm";
  return (
    <main className="mx-auto max-w-sm p-4">
      <h1 className="font-serif text-xl">부적 영상 녹화 시험</h1>
      <p className="mt-2 text-sm">지원 형식: {support.length ? support.join(", ") : "없음"}</p>
      <canvas ref={canvasRef} width={W} height={H} className="mt-3 w-full border border-line" />
      <button type="button" onClick={record} className="mt-3 h-[52px] w-full rounded-full bg-ink text-paper">녹화</button>
      <p className="mt-2 text-sm" data-testid="status">{status}</p>
      {url && (
        <div className="mt-3">
          <video src={url} controls playsInline className="w-full" data-testid="playback" />
          <a href={url} download={`bujeok-rec.${ext}`} className="mt-2 block text-sm underline">저장 ({mime})</a>
        </div>
      )}
    </main>
  );
}
