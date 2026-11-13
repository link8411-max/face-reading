"use client";

import Link from "next/link";
import { Icon } from "@/components/icons";
import { handOffPhoto } from "@/lib/photoHandoff";
import { track, type TestName } from "@/lib/analytics";
import { useLocale, useT } from "@/lib/i18n/LocaleProvider";
import { localePath } from "@/lib/i18n/locales";

// 사진 테스트 결과 아래 "같은 사진으로 바로" 다른 사진 테스트 카드. 사진은 메모리로만 넘긴다(lib/photoHandoff).
type PhotoTest = Extract<TestName, "samguk" | "animal" | "face">;

// 순서가 추천 순서다. 관상은 해석 위주라 결과가 사진과 어긋나 보일 일이 적어 먼저 권한다.
const TESTS: Record<PhotoTest, { href: string; question: string; icon: "fan" | "cat" | "face"; qKey?: "next.face" | "next.animal" }> = {
  face: { href: "/face2", question: "관상으로는?", icon: "face", qKey: "next.face" },
  samguk: { href: "/samguk", question: "삼국지에선 누구?", icon: "fan" },
  animal: { href: "/animal", question: "동물상으로는?", icon: "cat", qKey: "next.animal" },
};

export default function NextTests({ current, image }: { current: PhotoTest; image: string }) {
  const t = useT();
  const locale = useLocale();
  // 영어판이 있는 테스트만 이어 준다(삼국지는 한국어만)
  const others = (Object.keys(TESTS) as PhotoTest[]).filter((k) => k !== current && (locale === "ko" || TESTS[k].qKey));
  return (
    <section className="no-screenshot mt-4">
      <h2 className="text-sm font-bold mb-2">{t("next.title")}</h2>
      <div className="grid grid-cols-2 gap-2">
        {others.map((k) => (
          <Link
            key={k}
            href={localePath(locale, TESTS[k].href)}
            onClick={() => { handOffPhoto(image); track("next_test_click", { test_name: k }); }}
            className="bg-card border border-line rounded-[22px] px-4 py-3.5 flex flex-col gap-1.5"
          >
            <Icon name={TESTS[k].icon} size={20} className="text-accent-ink" />
            <span className="text-[15px] font-bold">{locale === "en" && TESTS[k].qKey ? t(TESTS[k].qKey!) : TESTS[k].question}</span>
            <span className="text-xs text-muted flex items-center gap-0.5">{t("next.sameFace")} <Icon name="chevron" size={14} /></span>
          </Link>
        ))}
      </div>
    </section>
  );
}
