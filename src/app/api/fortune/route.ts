import { NextRequest, NextResponse } from "next/server";
import { 사주분석 } from "@/lib/saju";
import { generateFortune } from "@/lib/fortuneDB";

export async function POST(request: NextRequest) {
  try {
    const { year, month, day, hour, isLunar } = await request.json();

    if (!year || !month || !day) {
      return NextResponse.json({ error: "생년월일이 필요합니다." }, { status: 400 });
    }

    // 사주 계산
    const 사주결과 = 사주분석(year, month, day);
    const 역법 = isLunar ? "음력" : "양력";
    const 시간정보 = hour && hour !== "모름" ? hour : null;

    // DB에서 운세 조회 (AI 호출 없음!)
    const 운세결과 = generateFortune({
      띠: 사주결과.띠,
      일간오행: 사주결과.일간오행,
      강한오행: 사주결과.강한오행,
      약한오행: 사주결과.약한오행,
      사주: 사주결과.사주,
      음양: 사주결과.음양,
    });

    const finalResult = {
      사주정보: { ...사주결과, 역법, 시주: 시간정보 },
      운세: 운세결과,
    };

    return NextResponse.json(finalResult);
  } catch (error) {
    console.error("Fortune error:", error);
    return NextResponse.json(
      { error: "운세 분석 중 오류가 발생했습니다. 다시 시도해주세요." },
      { status: 500 }
    );
  }
}
