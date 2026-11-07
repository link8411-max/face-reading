import { RELATION_COPY, SEUN_TEMPLATE, TEN_GOD_COPY } from "@/content/saju";
import type { SajuResult } from "@/lib/saju/engine";

export default function SeunCard({ seun, dayMasterTitle }: { seun: SajuResult["seun"]; dayMasterTitle: string }) {
  const text = SEUN_TEMPLATE({
    dayMasterTitle,
    tenGodEasy: TEN_GOD_COPY[seun.stemTenGod].easy,
    relationLine: RELATION_COPY[seun.dayBranchRelation.kind],
  });
  return (
    <div>
      <h3 className="font-serif font-bold text-base">{seun.year} {seun.korean}년과 나</h3>
      <p className="mt-2 text-sm leading-relaxed">{text}</p>
    </div>
  );
}
