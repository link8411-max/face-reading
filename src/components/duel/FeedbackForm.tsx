"use client";

import { useState } from "react";

interface Props {
  wave: number;
  starter: string;
  cleared: boolean;
  /** 같은 판 중복 제출 방지용 식별자(영문·숫자 32자 이하). 서버가 판마다 한 번만 받는다 */
  runId?: string;
  /** 별점을 밖(캔버스 별 줄)과 함께 쓸 때: 지금 별 수 */
  rating?: number;
  /** 별점을 밖과 함께 쓸 때: 별을 눌렀다 */
  onRate?: (n: number) => void;
}

type Status = "idle" | "sending" | "done" | "failed";

// 한 판 종료 후 한 번만 보내는 피드백 폼. 실패해도 게임 흐름에는 영향 없음.
// rating·onRate를 주면 별점은 밖이 가진다(같은 판에서 별을 바꿔도 폼이 새로 만들어지지 않아 한 줄 메모가 남는다).
export default function FeedbackForm({ wave, starter, cleared, runId, rating: ratingProp, onRate }: Props) {
  const [ownRating, setOwnRating] = useState(0);
  const rating = ratingProp ?? ownRating;
  const setRating = (n: number) => (onRate ? onRate(n) : setOwnRating(n));
  const [note, setNote] = useState("");
  const [status, setStatus] = useState<Status>("idle");

  if (status === "done") {
    return <p className="text-center text-sm text-paper">고마워요!</p>;
  }

  async function submit() {
    if (rating < 1 || status === "sending") return;
    setStatus("sending");
    const device = window.matchMedia("(pointer: coarse)").matches ? "mobile" : "desktop";
    try {
      const res = await fetch("/api/duel/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating, note, wave, starter, cleared, device, runId }),
      });
      // 409는 이미 받은 판이므로 완료로 본다
      setStatus(res.ok || res.status === 409 ? "done" : "failed");
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
