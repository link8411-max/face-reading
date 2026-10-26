import { NextRequest, NextResponse } from "next/server";
import { computeFortune } from "@/lib/fortuneService";

export async function POST(request: NextRequest) {
  try {
    const { year, month, day, hour, isLunar, isLeapMonth } = await request.json();

    if (!year || !month || !day) {
      return NextResponse.json({ error: "생년월일이 필요합니다." }, { status: 400 });
    }

    // DB 기반 계산 (AI 호출 없음)
    const result = computeFortune({ year, month, day, hour, isLunar: !!isLunar, isLeapMonth: !!isLeapMonth });
    if ("error" in result) return NextResponse.json(result, { status: 400 });
    return NextResponse.json(result);
  } catch (error) {
    console.error("Fortune error:", error);
    return NextResponse.json(
      { error: "운세 분석 중 오류가 발생했습니다. 다시 시도해주세요." },
      { status: 500 }
    );
  }
}
