import DuelMount from "@/components/duel/DuelMount";

// 삼국지 일기토 (/samguk/duel). 게임 화면은 클라이언트에서만 그린다. 안내·SEO는 Task 9에서 붙인다
export default function DuelPage() {
  return (
    <div className="min-h-screen bg-paper text-ink">
      <main className="mx-auto px-4 max-w-lg pb-10">
        <DuelMount />
      </main>
    </div>
  );
}
