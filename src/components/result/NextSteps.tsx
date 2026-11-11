"use client";

import Link from "next/link";
import { Icon } from "@/components/icons";
import { NEXT_BY_TEST, type NextFrom } from "@/content/navigation";
import { track } from "@/lib/analytics";
import { handOffBirth } from "@/lib/bujeok/birthHandoff";
import type { BirthInput } from "@/lib/bujeok/compose";

// 결과 아래 "이어서 보면 좋아요": 같은 줄기 1개 + 다른 줄기 1개(navigation.ts NEXT_BY_TEST).
// withPhoto면 같은 사진으로 잇는 칸은 NextTests가 이미 보여 주므로 뺀다. 사주·신년운세 결과는 birth를 주면 부적 카드를 누를 때 생년월일을 메모리로만 넘긴다(저장소·GA 금지, bujeok/birthHandoff.ts).
export default function NextSteps({ from, withPhoto = false, className = "mt-4", birth }: { from: NextFrom; withPhoto?: boolean; className?: string; birth?: BirthInput }) {
  const steps = NEXT_BY_TEST[from].filter((s) => !(withPhoto && "samePhoto" in s && s.samePhoto));
  if (steps.length === 0) return null;
  return (
    <section className={`no-screenshot ${className}`} aria-labelledby={`next-steps-${from}`}>
      <h2 id={`next-steps-${from}`} className="text-sm font-bold mb-2">이어서 보면 좋아요</h2>
      <div className={`grid gap-2 ${steps.length > 1 ? "grid-cols-2" : "grid-cols-1"}`}>
        {steps.map((s) => (
          <Link
            key={s.href + s.test}
            href={s.href}
            data-next-step={s.test}
            onClick={() => {
              if (s.test === "bujeok" && birth) handOffBirth(birth);
              track("next_test_click", { test_name: s.test });
            }}
            className="bg-white border border-line rounded-[22px] px-4 py-3.5 flex flex-col gap-1.5"
          >
            <Icon name={s.icon} size={20} className="text-accent" />
            <span className="text-[15px] font-bold">{s.title}</span>
            <span className="text-xs text-muted leading-normal flex items-start gap-0.5">{s.desc}<Icon name="chevron" size={14} className="shrink-0 mt-0.5" /></span>
          </Link>
        ))}
      </div>
    </section>
  );
}
