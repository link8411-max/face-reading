"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { loadSave } from "@/lib/duel/save";

/** 이 기기 장수록에 그 장수가 있는지(저장을 못 읽으면 없음) */
export function rosterHas(id: string): boolean {
  try {
    return loadSave(window.localStorage).roster.includes(id);
  } catch {
    return false;
  }
}

// 영입 장수 소개 페이지의 시작 단추. 페이지는 정적이라 서버는 "영입하면 고를 수 있어요"를 그리고,
// 이 기기 장수록에 이미 있는 장수면(영입한 적이 있으면) 그 자리를 "이 장수로 시작"(?me=) 링크로 바꾼다.
export default function RosterStartLink({ id }: { id: string }) {
  const [owned, setOwned] = useState(false);
  useEffect(() => {
    // 저장은 브라우저에만 있어 마운트 뒤에 한 번 읽는다
    setOwned(rosterHas(id));
  }, [id]);

  if (owned) {
    return (
      <Link href={`/samguk/duel?me=${id}`} className="flex h-[52px] items-center justify-center rounded-full bg-ink text-paper font-medium">
        이 장수로 시작
      </Link>
    );
  }
  return (
    <div className="rounded-[18px] bg-card px-4 py-4 text-center">
      <p>영입하면 시작 장수로 고를 수 있어요</p>
      <span className="block text-xs text-muted mt-1">싸움에서 이긴 뒤 항복을 받아 내면 장수록에 올라요.</span>
      <Link href="/samguk/duel" className="mt-3 inline-flex h-11 items-center justify-center rounded-full border border-line bg-white px-5 text-sm font-medium">
        영입하러 출진
      </Link>
    </div>
  );
}
