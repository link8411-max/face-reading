import { seunCopy } from "@/content/saju";
import type { SajuResult } from "@/lib/saju/engine";
import type { Branch } from "@/lib/saju/keys";

export default function SeunCard({ seun, dayBranch }: { seun: SajuResult["seun"]; dayBranch: Branch }) {
  const c = seunCopy({ korean: seun.korean, tenGod: seun.stemTenGod, relation: seun.dayBranchRelation.kind, dayBranch });
  return (
    <div>
      <h3 className="font-serif font-bold text-base">{seun.year}년은 나에게</h3>
      <p className="mt-2 text-sm leading-relaxed">{c.text}</p>
      <p className="mt-1.5 text-[11px] text-muted">{c.basis}</p>
    </div>
  );
}
