"use client";
// 시작 화면 탭(11/14 사용자: "캐릭터 때문에 메뉴가 너무 밀렸다, 궁합 보기·미리보기처럼 탭으로 나눠 스크롤을 줄이자").
// 첫 탭(테스트)만 보이고 나머지 패널은 `hidden`으로 가린다(서버 HTML에는 모든 패널이 있다, 검색 봇이 읽음).
// content가 없는 탭(key "guide")은 페이지 아래의 설명 글(PageGuide, layout이 그림)을 보여 주는 탭이다:
// 탭이 그려져 있는 동안 <html data-start-tab>을 두고, CSS가 "guide"가 아니면 [data-page-guide]를 숨긴다. 탭이 사라지면(결과 화면) 속성을 지워 설명이 다시 보인다.
import { useEffect, useId, useState, type ReactNode } from "react";
import { useT } from "@/lib/i18n/LocaleProvider";

export interface StartTab { key: string; label: string; content?: ReactNode }
// guide 탭에 content를 주면 그 내용 + (PageGuide가 있는 페이지면) 아래 안내 한 줄을 보인다

export const GUIDE_TAB = "guide";

export default function StartTabs({ tabs, className = "" }: { tabs: StartTab[]; className?: string }) {
  const [active, setActive] = useState(tabs[0]?.key);
  const [hasGuide, setHasGuide] = useState(false);
  useEffect(() => { setHasGuide(!!document.querySelector("[data-page-guide]")); }, []);
  const id = useId();
  const t = useT();
  useEffect(() => {
    const el = document.documentElement;
    el.dataset.startTab = active;
    return () => { delete el.dataset.startTab; };
  }, [active]);
  return (
    <div className={className}>
      <div role="tablist" className="flex gap-1.5 p-1 rounded-full bg-card border border-line">
        {tabs.map((tab) => {
          const on = tab.key === active;
          return (
            <button
              key={tab.key}
              type="button"
              role="tab"
              id={`${id}-${tab.key}-tab`}
              aria-selected={on}
              aria-controls={`${id}-${tab.key}`}
              onClick={() => setActive(tab.key)}
              className={`flex-1 min-w-0 h-10 rounded-full text-[13px] font-medium truncate px-2 ${on ? "bg-ink text-paper" : "text-muted"}`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>
      {tabs.map((tab) => (
        <div key={tab.key} role="tabpanel" id={`${id}-${tab.key}`} aria-labelledby={`${id}-${tab.key}-tab`} data-start-panel={tab.key} className={tab.key === active ? "" : "hidden"}>
          {tab.content}
          {tab.key === GUIDE_TAB && hasGuide && <p className="mt-4 text-[13px] text-muted text-center">{t("start.guideHint")}</p>}
        </div>
      ))}
    </div>
  );
}
