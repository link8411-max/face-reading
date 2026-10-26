import type { ReactNode, Ref } from "react";

// 스토리용 9:16 틀 (360×640, 3배로 캡처해 1080×1920). 화면 밖에 그려 두고 캡처만 한다.
export default function StoryFrame({ frameRef, testName, children }: { frameRef: Ref<HTMLDivElement>; testName: string; children: ReactNode }) {
  return (
    <div aria-hidden="true" className="fixed -left-[10000px] top-0 pointer-events-none">
      <div ref={frameRef} className="w-[360px] h-[640px] bg-paper text-ink flex flex-col px-5 py-10">
        <p className="text-center font-serif font-bold text-lg">운명을 읽다</p>
        <p className="text-center text-xs text-muted mt-1">{testName}</p>
        <div className="flex-1 flex flex-col justify-center">{children}</div>
        <p className="text-center text-sm font-medium">unse-ai.com 에서 나도 해보기</p>
      </div>
    </div>
  );
}
