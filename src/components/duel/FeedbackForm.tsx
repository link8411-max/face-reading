"use client";

import { useState } from "react";

interface Props {
  wave: number;
  starter: string;
  cleared: boolean;
  /** 캔버스 별점 줄에서 고른 별 수(처음 값) */
  initialRating?: number;
}

type Status = "idle" | "sending" | "done" | "failed";

// 한 판 종료 후 한 번만 보내는 피드백 폼. 실패해도 게임 흐름에는 영향 없음.
export default function FeedbackForm({ wave, starter, cleared, initialRating = 0 }: Props) {
  const [rating, setRating] = useState(initialRating);
  const [note, setNote] = useState("");
  const [status, setStatus] = useState<Status>("idle");

  if (status === "done") {
    return <p className="text-center text-sm text-ink">고마워요!</p>;
  }

  async function submit() {
    if (rating < 1 || status === "sending") return;
    setStatus("sending");
    const device = window.matchMedia("(pointer: coarse)").matches ? "mobile" : "desktop";
    try {
      const res = await fetch("/api/duel/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating, note, wave, starter, cleared, device }),
      });
      setStatus(res.ok ? "done" : "failed");
    } catch {
      setStatus("failed");
    }
  }

  return (
    <div className="rounded-2xl border border-line bg-card p-4">
      <div className="flex justify-center gap-1" role="group" aria-label="별점">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            aria-label={`별 ${n}개`}
            aria-pressed={rating === n}
            onClick={() => setRating(n)}
            className={`min-h-[44px] min-w-[44px] text-2xl ${n <= rating ? "text-ink" : "text-muted"}`}
          >
            {n <= rating ? "★" : "☆"}
          </button>
        ))}
      </div>
      <input
        type="text"
        value={note}
        maxLength={200}
        onChange={(e) => setNote(e.target.value)}
        placeholder="한 줄 남기기 (선택)"
        className="mt-3 h-11 w-full rounded-full border border-line bg-card px-4 text-sm text-ink placeholder:text-muted"
      />
      <button
        type="button"
        onClick={submit}
        disabled={rating < 1 || status === "sending"}
        className="mt-3 h-[52px] w-full rounded-full bg-ink text-paper disabled:opacity-40"
      >
        보내기
      </button>
      {status === "failed" && (
        <p className="mt-2 text-center text-sm text-muted" role="status">
          지금은 보낼 수 없어요
        </p>
      )}
    </div>
  );
}
