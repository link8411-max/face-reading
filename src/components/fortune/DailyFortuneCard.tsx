import type { DailyFortune } from "@/lib/dailyEngine";
import { 영역목록 } from "@/content/dailyFortuneText";
import { dailyDateLine } from "@/lib/dailyEngine/format";
import { fortuneDB } from "@/lib/fortuneDB";

const 상태기호 = { 좋음: "●", 보통: "◐", 조심: "○" } as const;

export default function DailyFortuneCard({ fortune, birthYearLabel }: { fortune: DailyFortune; birthYearLabel: string | null }) {
  const { 나, 별점, 영역, 행운 } = fortune;
  const 제목 = 나.년주표기 ? `${나.년주표기}년 ${나.띠}띠` : `${나.띠}띠`;
  const 특성 = fortuneDB.띠[나.띠 as keyof typeof fortuneDB.띠];

  return (
    <>
      <div className="bg-card rounded-[22px] p-5 text-center border border-line">
        <p className="text-xs font-medium text-accent-ink">{dailyDateLine(fortune)}</p>
        <h2 className="font-serif text-[25px] font-bold mt-1">{제목}</h2>
        <p className="text-2xl mt-1" aria-hidden="true">{나.띠이모지}</p>
        {/* 출생 연도는 화면에만, 저장·공유 이미지에는 넣지 않는다 */}
        {birthYearLabel && <p className="text-muted text-sm no-screenshot">{birthYearLabel}</p>}
      </div>

      <div className="bg-card rounded-[22px] p-5 border border-line">
        <div className="flex justify-between items-center mb-3">
          <h3 className="font-serif font-bold text-lg">오늘의 운세</h3>
          <span className="text-accent-ink text-xl tracking-wider" role="img" aria-label={`별 ${별점}개`}>
            {"★".repeat(별점) + "☆".repeat(5 - 별점)}
          </span>
        </div>
        <div className="bg-card-2 rounded-xl p-4 border border-line">
          <p className="text-xl text-center font-medium text-accent-ink">{fortune.한마디}</p>
        </div>
        <p className="text-xs text-muted mt-2 text-center">{fortune.근거}</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {영역목록.map((이름) => (
          <div key={이름} className="bg-card rounded-[22px] p-4 border border-line">
            <p className="text-xs text-muted mb-1">
              {이름} <span className="text-accent-ink">{상태기호[영역[이름].상태]}</span>
            </p>
            <p className="text-sm leading-relaxed break-keep">{영역[이름].문장}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-3">
        {[
          ["행운의 색", 행운.색],
          ["행운의 시간", 행운.시간],
          ["행운의 방향", 행운.방향],
        ].map(([라벨, 값]) => (
          <div key={라벨} className="bg-card rounded-xl p-3 text-center border border-line">
            <p className="text-xs text-muted mb-1">{라벨}</p>
            <p className="text-sm font-bold text-accent-ink break-keep">{값}</p>
          </div>
        ))}
      </div>

      <div className="bg-card rounded-[22px] p-5 border border-line">
        <h3 className="font-serif font-bold text-lg mb-3">{나.띠}띠 특성</h3>
        <p className="text-muted text-sm leading-relaxed">{특성.성격}</p>
        <div className="flex flex-wrap gap-2 mt-3">
          {특성.장점.map((장점, i) => (
            <span key={i} className="px-3 py-1 bg-card-2 text-accent-ink rounded-full text-xs border border-line">{장점}</span>
          ))}
        </div>
      </div>

      <div className="flex justify-between items-center px-1 text-[11px] text-muted">
        <span className="font-serif font-bold text-xs text-ink">운명을 읽다</span>
        <span>unse-ai.com</span>
      </div>
    </>
  );
}
