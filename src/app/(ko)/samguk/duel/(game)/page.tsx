import DuelMount from "@/components/duel/DuelMount";

// 삼국지 일기토 (/samguk/duel). 게임 화면은 클라이언트에서만 그린다. 게임 영역은 화면 높이만큼 천 무늬로 채우고, 안내문(PageGuide)은 그 아래 일반 페이지로
export default function DuelPage() {
  return (
    <div className="bg-paper text-ink">
      <DuelMount />
    </div>
  );
}
