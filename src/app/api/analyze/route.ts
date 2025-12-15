import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextRequest, NextResponse } from "next/server";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

// 재시도 함수 (이미지 포함)
async function tryGenerateWithImage(base64Image: string, prompt: string, maxRetries = 2) {
  const models = ["gemini-2.0-flash-lite", "gemini-2.5-flash", "gemini-2.0-flash"];

  for (const modelName of models) {
    for (let i = 0; i < maxRetries; i++) {
      try {
        const model = genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent([
          {
            inlineData: {
              mimeType: "image/jpeg",
              data: base64Image,
            },
          },
          prompt,
        ]);
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
    const { image } = await request.json();

    if (!image) {
      return NextResponse.json({ error: "이미지가 필요합니다." }, { status: 400 });
    }

    const base64Image = image.replace(/^data:image\/\w+;base64,/, "");

    const prompt = `당신은 전통 관상학에 기반한 전문 관상 분석가입니다.
이 얼굴 사진을 보고 체계적으로 관상을 분석해주세요.

관상학 기본 원리:
- 이마(천정): 초년운(1-30세), 지성, 부모운
- 눈썹~코(중정): 중년운(31-50세), 의지, 재물운
- 코~입~턱(하정): 말년운(51세~), 건강, 자녀운
- 눈: 마음의 창, 지혜와 감정
- 코: 재물운, 자존심
- 입: 언어력, 애정운
- 귀: 지혜, 초년운
- 광대뼈: 사회성, 권력

반드시 아래 JSON 형식으로만 응답하세요:

{
  "type": "관상 유형 (귀인상/복덕상/재물상/학자상/예술가상/리더상 중 하나)",
  "title": "대표 관상명 (예: 타고난 복덕상, 자수성가상 등)",
  "faceFeatures": {
    "이마": "이마 특징과 의미 (한 문장)",
    "눈": "눈 특징과 의미 (한 문장)",
    "코": "코 특징과 의미 (한 문장)",
    "입": "입 특징과 의미 (한 문장)",
    "전체윤곽": "얼굴형 특징 (한 문장)"
  },
  "lifeFortune": {
    "초년운": {
      "period": "1-30세",
      "rating": 1-5 사이 숫자,
      "description": "초년기 운세 설명 (2문장)"
    },
    "중년운": {
      "period": "31-50세",
      "rating": 1-5 사이 숫자,
      "description": "중년기 운세 설명 (2문장)"
    },
    "말년운": {
      "period": "51세 이후",
      "rating": 1-5 사이 숫자,
      "description": "말년기 운세 설명 (2문장)"
    }
  },
  "categories": {
    "재물운": 1-5 사이 숫자,
    "애정운": 1-5 사이 숫자,
    "직장운": 1-5 사이 숫자,
    "건강운": 1-5 사이 숫자,
    "대인운": 1-5 사이 숫자
  },
  "personality": ["성격 특징 1", "성격 특징 2", "성격 특징 3", "성격 특징 4"],
  "career": "어울리는 직업/분야 (2-3개)",
  "advice": "관상학적 조언 (한두 문장)",
  "luckyNumber": 1-99 사이 숫자,
  "luckyColor": "행운의 색상",
  "summary": "전체 관상 요약 (2-3문장)"
}

중요:
- 전통 관상학 용어와 원리를 활용하되 쉽게 설명해주세요
- 긍정적이고 희망적인 내용으로 작성해주세요
- 각 수치는 반드시 숫자로만 응답하세요`;

    const text = await tryGenerateWithImage(base64Image, prompt);

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return NextResponse.json({ error: "분석 결과를 파싱할 수 없습니다." }, { status: 500 });
    }

    const analysisResult = JSON.parse(jsonMatch[0]);

    return NextResponse.json(analysisResult);
  } catch (error) {
    console.error("Analysis error:", error);
    return NextResponse.json(
      { error: "관상 분석 중 오류가 발생했습니다. 다시 시도해주세요." },
      { status: 500 }
    );
  }
}
