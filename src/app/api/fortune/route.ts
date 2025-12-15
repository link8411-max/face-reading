import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextRequest, NextResponse } from "next/server";
import { 사주분석, 년도2026 } from "@/lib/saju";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

// 재시도 함수
async function tryGenerateContent(prompt: string, maxRetries = 2) {
  const models = ["gemini-2.0-flash-lite", "gemini-2.5-flash", "gemini-2.0-flash"];

  for (const modelName of models) {
    for (let i = 0; i < maxRetries; i++) {
      try {
        const model = genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent(prompt);
        return result.response.text();
      } catch (error: unknown) {
        const err = error as { status?: number };
        console.log(`${modelName} 시도 ${i + 1} 실패:`, err.status);
        if (err.status === 503 || err.status === 429) {
          await new Promise(r => setTimeout(r, 1000 * (i + 1)));
          continue;
        }
        break;
      }
    }
  }
  throw new Error("모든 모델 시도 실패");
}

export async function POST(request: NextRequest) {
  try {
    const { year, month, day, isLunar } = await request.json();

    if (!year || !month || !day) {
      return NextResponse.json({ error: "생년월일이 필요합니다." }, { status: 400 });
    }

    const 사주결과 = 사주분석(year, month, day);
    const 역법 = isLunar ? "음력" : "양력";

    const prompt = `당신은 전통 사주명리학 전문가입니다.
아래 사주 정보를 바탕으로 2026년 병오년(丙午年) 신년 운세를 분석해주세요.

[사주 정보]
- 생년월일: ${year}년 ${month}월 ${day}일 (${역법})
- 역법: ${역법} ${isLunar ? "(전통 사주명리학 기준)" : "(양력 입력 - 참고용 분석)"}
- 띠: ${사주결과.띠} (${사주결과.띠이모지})
- 사주팔자:
  - 년주: ${사주결과.사주.년주}
  - 월주: ${사주결과.사주.월주}
  - 일주: ${사주결과.사주.일주}
- 일간(본인 오행): ${사주결과.일간} (${사주결과.일간오행})
- 음양: ${사주결과.음양}
- 오행 분포: 목(${사주결과.오행분포.목}) 화(${사주결과.오행분포.화}) 토(${사주결과.오행분포.토}) 금(${사주결과.오행분포.금}) 수(${사주결과.오행분포.수})
- 강한 오행: ${사주결과.강한오행}
- 약한 오행: ${사주결과.약한오행}

[2026년 정보]
- 병오년(丙午年): 화(火) + 말띠
- 특징: ${년도2026.특징}

반드시 아래 JSON 형식으로만 응답하세요:

{
  "총운": {
    "rating": 1-5 사이 숫자,
    "keyword": "올해의 키워드 (한 단어)",
    "summary": "2026년 전체 운세 요약 (3-4문장)"
  },
  "월별운세": {
    "상반기": "1-6월 운세 (2문장)",
    "하반기": "7-12월 운세 (2문장)",
    "최고의달": "가장 좋은 달 (예: 3월)",
    "주의할달": "조심해야 할 달 (예: 8월)"
  },
  "세부운세": {
    "재물운": {
      "rating": 1-5 사이 숫자,
      "description": "재물운 상세 설명 (2문장)"
    },
    "애정운": {
      "rating": 1-5 사이 숫자,
      "description": "애정운 상세 설명 (2문장)"
    },
    "직장운": {
      "rating": 1-5 사이 숫자,
      "description": "직장/사업운 상세 설명 (2문장)"
    },
    "건강운": {
      "rating": 1-5 사이 숫자,
      "description": "건강운 상세 설명 (2문장)"
    },
    "학업운": {
      "rating": 1-5 사이 숫자,
      "description": "학업/자기계발운 상세 설명 (2문장)"
    }
  },
  "사주분석": {
    "오행조화": "오행 분포에 따른 분석 (2문장)",
    "2026년궁합": "병오년과 본인 사주의 궁합 분석 (2문장)"
  },
  "행운요소": {
    "행운의숫자": [3개의 숫자],
    "행운의색상": "색상",
    "행운의방위": "방위 (예: 동쪽)",
    "행운의계절": "계절"
  },
  "조언": {
    "해야할것": "2026년에 해야 할 것 (한 문장)",
    "피해야할것": "2026년에 피해야 할 것 (한 문장)",
    "명심할말": "명심해야 할 한마디"
  }
}

중요:
- 사주팔자의 원리에 기반하여 분석해주세요
- 오행의 상생상극을 고려해주세요
- 긍정적이면서도 실질적인 조언을 해주세요`;

    const text = await tryGenerateContent(prompt);

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return NextResponse.json({ error: "분석 결과를 파싱할 수 없습니다." }, { status: 500 });
    }

    const aiResult = JSON.parse(jsonMatch[0]);

    const finalResult = {
      사주정보: { ...사주결과, 역법 },
      운세: aiResult,
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
