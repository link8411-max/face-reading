"use client";

import { useState } from "react";
import CategoryList from "@/components/CategoryList";
import type { CategoryItem } from "@/content/navigation";

// 전체 테스트 목록 + 검색창. 서버 HTML에는 모든 카드가 있고, 글자를 치면 안 맞는 카드만 hidden으로 숨긴다.
export default function AllTests({ items }: { items: CategoryItem[] }) {
  const [q, setQ] = useState("");
  const needle = q.trim().toLowerCase();
  const miss = (i: CategoryItem) => needle !== "" && !`${i.title} ${i.desc} ${i.chip ?? ""}`.toLowerCase().includes(needle);
  const none = needle !== "" && items.every(miss);
  return (
    <div>
      <label className="flex items-center gap-2 bg-card border border-line rounded-full px-4 h-12 mb-4">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" aria-hidden="true" className="text-muted flex-none"><circle cx="11" cy="11" r="7" /><path d="M20 20l-3.5-3.5" /></svg>
        <span className="sr-only">테스트 검색</span>
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="테스트 검색 (예: 관상, 궁합, 부적)"
          className="flex-1 min-w-0 bg-transparent outline-none text-[15px] placeholder:text-muted"
        />
      </label>
      <CategoryList items={items} hidden={miss} />
      {none && <p className="text-sm text-muted text-center py-8">맞는 테스트가 없어요. 다른 말로 찾아 보세요.</p>}
    </div>
  );
}
