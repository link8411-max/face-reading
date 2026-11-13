import type { Metadata } from "next";
import CategoryList from "@/components/CategoryList";
import SeasonPicks from "@/components/SeasonPicks";
import ZodiacPicker from "@/components/home/ZodiacPicker";
import { ALL_ITEMS } from "@/content/navigation";
import { CAST } from "@/content/cast";

const url = "https://unse-ai.com/today";
const title = "오늘 – 오늘의 운세·MBTI 운세·밈 능력고사 | 운명을 읽다";
const description = "날마다 새로 바뀌는 오늘의 운세, 오늘의 MBTI 운세, 매일 5문제 밈 능력고사를 모았어요. 띠를 눌러 오늘 운세를 바로 볼 수도 있어요.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: url },
  openGraph: { title, description, url, type: "website", locale: "ko_KR", siteName: "운명을 읽다" },
};

const DAILY = ALL_ITEMS.filter((i) => i.daily).map((i) => ({ ...i, group: undefined }));

export default function Page() {
  const saja = CAST.saja;
  return (
    <div className="max-w-lg mx-auto px-4 pt-6 pb-6 space-y-6">
      <h1 className="font-serif text-[28px] font-extrabold tracking-tight">오늘</h1>
      <div className="flex items-center gap-3">
        <img src={saja.face} alt={`${saja.name} 캐릭터`} width={64} height={64} className="w-16 h-16 rounded-[20px] object-cover flex-none" style={{ background: saja.bg }} />
        <p className="bg-card border border-line rounded-[18px] rounded-bl-[4px] px-4 py-2.5 font-bold text-[14.5px]">오늘 바뀌는 것들이에요</p>
      </div>
      <CategoryList items={DAILY} />
      <div className="px-1.5">
        <ZodiacPicker />
      </div>
      <SeasonPicks slot="today" />
    </div>
  );
}
