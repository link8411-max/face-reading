"use client";

import Link from "next/link";
import { Icon } from "@/components/icons";
import { handOffPhoto } from "@/lib/photoHandoff";
import { track, type TestName } from "@/lib/analytics";

// 사진 테스트 결과 아래 "같은 사진으로 바로" 다른 사진 테스트 카드. 사진은 메모리로만 넘긴다(lib/photoHandoff).
type PhotoTest = Extract<TestName, "samguk" | "animal" | "face">;

const TESTS: Record<PhotoTest, { href: string; question: string; icon: "fan" | "cat" | "face" }> = {
  samguk: { href: "/samguk", question: "삼국지에선 누구?", icon: "fan" },
  animal: { href: "/animal", question: "동물상으로는?", icon: "cat" },
  face: { href: "/face2", question: "관상으로는?", icon: "face" },
};

export default function NextTests({ current, image }: { current: PhotoTest; image: string }) {
  const others = (Object.keys(TESTS) as PhotoTest[]).filter((t) => t !== current);
  return (
    <section className="no-screenshot mt-4">
      <h2 className="text-sm font-bold mb-2">이 얼굴, 다른 테스트로도 볼까요?</h2>
      <div className="grid grid-cols-2 gap-2">
        {others.map((t) => (
          <Link
            key={t}
            href={TESTS[t].href}
            onClick={() => { handOffPhoto(image); track("next_test_click", { test_name: t }); }}
            className="bg-white border border-line rounded-[22px] px-4 py-3.5 flex flex-col gap-1.5"
          >
            <Icon name={TESTS[t].icon} size={20} className="text-accent" />
            <span className="text-[15px] font-bold">{TESTS[t].question}</span>
            <span className="text-xs text-muted flex items-center gap-0.5">같은 사진으로 바로 <Icon name="chevron" size={14} /></span>
          </Link>
        ))}
      </div>
    </section>
  );
}
