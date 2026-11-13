import Link from "next/link";
import { ALL_ITEMS } from "@/content/navigation";

// "오늘 새로 바뀐 것" 가로 줄: 매일 바뀌는 항목(navigation.ts daily)과 오늘 탭으로 가는 링크
export default function TodayRow() {
  const items = ALL_ITEMS.filter((i) => i.daily);
  return (
    <section aria-labelledby="today-row-title">
      <div className="flex items-baseline justify-between px-1">
        <h2 id="today-row-title" className="font-serif font-extrabold text-[17px] tracking-tight">오늘 새로 바뀐 것</h2>
        <Link href="/today" className="text-[13px] text-accent font-semibold">오늘 탭에서 보기</Link>
      </div>
      <ul className="flex gap-2.5 overflow-x-auto [scrollbar-width:none] -mx-4 px-4 mt-3">
        {items.map((i) => (
          <li key={i.href} className="flex-none w-[150px]">
            <Link href={i.href} className="press block h-full rounded-[20px] bg-card border border-line p-3.5">
              <span className="inline-block text-[11px] font-bold bg-lime text-ink px-2 py-0.5 rounded-full mb-2">매일</span>
              <span className="block text-[15px] font-bold break-keep">{i.title}</span>
              <span className="block text-[12.5px] text-muted mt-1 leading-snug line-clamp-2">{i.desc}</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
