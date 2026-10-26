"use client";

import { useState } from "react";
import CategoryList from "@/components/CategoryList";
import { CATEGORIES } from "@/content/navigation";
import { Icon } from "@/components/icons";

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
            className={`px-3.5 py-2 rounded-full text-[13px] font-bold border transition ${c.key === active ? "bg-ink text-paper border-ink" : "bg-white text-ink border-line"}`}
          >
            {c.tabLabel}
          </button>
        ))}
      </div>
      <div role="tabpanel" aria-label={category.title}>
        <CategoryList items={category.items} />
        {category.key === "face" && (
          <p className="flex items-center gap-1.5 text-xs text-muted mt-2">
            <Icon name="shield" size={14} className="text-accent" /> 사진은 브라우저 안에서만 분석돼요
          </p>
        )}
      </div>
    </section>
  );
}
