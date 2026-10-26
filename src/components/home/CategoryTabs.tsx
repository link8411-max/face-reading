"use client";

import { useState } from "react";
import Link from "next/link";
import CategoryList from "@/components/CategoryList";
import { CATEGORIES } from "@/content/navigation";

// 메인의 묶음 탭 (얼굴 테스트 / 운세·사주 / MBTI)
export default function CategoryTabs() {
  const [active, setActive] = useState(CATEGORIES[0].key);
  const category = CATEGORIES.find((c) => c.key === active)!;
  return (
    <section aria-label="테스트 묶음">
      <div role="tablist" aria-label="테스트 묶음 선택" className="flex gap-2 mb-3">
        {CATEGORIES.map((c) => (
          <button
            key={c.key}
            role="tab"
            type="button"
            aria-selected={c.key === active}
            onClick={() => setActive(c.key)}
            className={`px-3.5 py-2 rounded-full text-[13px] font-bold border transition ${c.key === active ? "bg-ink text-white border-ink" : "bg-white text-muted border-line"}`}
          >
            {c.tabLabel}
          </button>
        ))}
      </div>
      <div role="tabpanel" aria-label={category.title}>
        {category.items.length > 0 ? (
          <>
            <CategoryList items={category.items} />
            {category.key === "face" && <p className="text-[11px] text-muted mt-2">🔒 사진은 브라우저 안에서만 분석돼요</p>}
          </>
        ) : (
          <Link href={category.href} className="block bg-gradient-to-br from-[#6B3FA0] to-[#9466C9] text-white rounded-2xl p-4">
            <span className="font-black">🧩 MBTI 궁합, 곧 열려요</span>
            <span className="block text-xs opacity-85 mt-1">16유형 궁합·이달의 운세·여행지·직업</span>
          </Link>
        )}
      </div>
    </section>
  );
}
