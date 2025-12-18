import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextRequest, NextResponse } from "next/server";
import { getCharacterByName, getCharacterListForPrompt, getCharacterNames } from "@/lib/samgukDB";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

let cachedModels: string[] = [];

/**
 * 실시간으로 사용 가능한 모델 리스트를 가져와 최적의 순서로 정렬합니다.
 * 우선순위: 1.5-flash (무료 쿼터 안정) -> 2.0-flash (속도) -> 기타 프리뷰
 */
async function getOptimizedModels() {
  if (cachedModels.length > 0) return cachedModels;

  try {
    const key = process.env.GEMINI_API_KEY;
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${key}`);
    const data = await res.json();

    if (!data.models) return ["gemini-1.5-flash", "gemini-2.0-flash"];

    const available = data.models
      .filter((m: any) => m.supportedGenerationMethods.includes("generateContent"))
      .map((m: any) => m.name.replace("models/", ""));

    const priorityOrder = [
      "gemini-1.5-flash",
      "gemini-2.0-flash",
      "gemini-2.5-flash",
      "gemini-2.0-flash-exp",
      "gemini-1.5-flash-latest"
    ];

    cachedModels = priorityOrder.filter(p => available.includes(p));

    // 만약 우선순위에 있는 모델이 하나도 없다면 사용 가능한 것 중 첫 번째를 반환
    if (cachedModels.length === 0 && available.length > 0) {
      cachedModels = [available[0]];
    }

    return cachedModels.length > 0 ? cachedModels : ["gemini-1.5-flash"];
  } catch (error) {
    console.error("Model discovery failed:", error);
    return ["gemini-1.5-flash"];
  }
}

// 재시도 함수 (이미지 포함)
async function tryGenerateWithImage(base64Image: string, prompt: string, maxRetries = 2) {
  const models = await getOptimizedModels();

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

    // 1단계: 성별 판단
    const genderPrompt = `이 사진 속 사람의 성별을 판단해주세요.
반드시 "남" 또는 "여" 중 하나로만 응답하세요.
다른 말은 하지 말고 한 글자만 응답하세요.`;

    const genderResult = await tryGenerateWithImage(base64Image, genderPrompt);
    const gender = genderResult.trim().includes("여") ? "여" : "남";

    // 2단계: 해당 성별의 인물 목록으로 매칭
    const characterList = getCharacterListForPrompt(gender as "남" | "여");
    const characterNames = getCharacterNames(gender as "남" | "여").join(", ");

    const prompt = `당신은 삼국지 인물 전문가입니다.
이 사람의 얼굴을 보고, 아래 삼국지 ${gender === "여" ? "여성" : "남성"} 인물 중에서 가장 닮은 인물을 찾아주세요.

## 삼국지 ${gender === "여" ? "여성" : "남성"} 인물 목록 (이름: 외모 특징)
${characterList}

## 규칙
1. 반드시 위 목록에 있는 인물 중에서만 선택하세요
2. 얼굴 특징(눈매, 이목구비, 인상, 분위기 등)을 기반으로 판단하세요
3. 가장 닮은 인물 1명만 선택하세요
4. 닮은 이유도 설명해주세요

## 응답 형식 (JSON만)
{
  "name": "인물 이름 (한글)",
  "matchReason": "닮은 이유 설명 (3-4문장, 구체적인 외모 특징 비교)",
  "similarity": 70-95 사이의 숫자 (닮은 정도 퍼센트),
  "faceAnalysis": {
    "눈": "이 사람의 눈 특징",
    "코": "이 사람의 코 특징",
    "입": "이 사람의 입 특징",
    "얼굴형": "이 사람의 얼굴형",
    "인상": "전체적인 인상"
  }
}

중요:
- name은 반드시 다음 중 하나여야 합니다: ${characterNames}
- JSON 형식으로만 응답하세요
- 재미있고 긍정적으로 작성해주세요`;

    const text = await tryGenerateWithImage(base64Image, prompt);

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return NextResponse.json({ error: "분석 결과를 파싱할 수 없습니다." }, { status: 500 });
    }

    const analysisResult = JSON.parse(jsonMatch[0]);

    // DB에서 인물 정보 가져오기
    const character = getCharacterByName(analysisResult.name);

    if (!character) {
      // 인물을 못 찾으면 기본값 (조조)
      const defaultCharacter = getCharacterByName("조조");
      return NextResponse.json({
        ...analysisResult,
        character: defaultCharacter,
      });
    }

    return NextResponse.json({
      ...analysisResult,
      character,
    });
  } catch (error) {
    console.error("Samguk analysis error:", error);
    return NextResponse.json(
      { error: "삼국지 닮은꼴 분석 중 오류가 발생했습니다. 다시 시도해주세요." },
      { status: 500 }
    );
  }
}
