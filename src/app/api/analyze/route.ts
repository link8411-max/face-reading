import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextRequest, NextResponse } from "next/server";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export async function POST(request: NextRequest) {
  try {
    const { image } = await request.json();

    if (!image) {
      return NextResponse.json({ error: "이미지가 필요합니다." }, { status: 400 });
    }

    // Remove data URL prefix to get base64
    const base64Image = image.replace(/^data:image\/\w+;base64,/, "");

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const prompt = `당신은 재미있는 관상 분석가입니다. 이 얼굴 사진을 보고 재미있게 관상을 분석해주세요.

반드시 아래 JSON 형식으로만 응답하세요. 다른 텍스트는 포함하지 마세요:

{
  "type": "관상 유형 (예: 리더형, 예술가형, 힐러형, 모험가형, 지성인형 중 하나)",
  "title": "재미있는 별명 (예: 타고난 CEO상, 숨은 예술가, 사랑꾼 등)",
  "traits": ["성격 특징 1", "성격 특징 2", "성격 특징 3"],
  "career": "어울리는 직업 (한두 줄로)",
  "love": "연애 스타일 (한두 줄로)",
  "luckyNumber": 1에서 99 사이의 행운의 숫자,
  "description": "전체적인 인상과 운세를 2-3문장으로 재미있게 설명"
}

중요: 반드시 긍정적이고 재미있는 내용으로 작성하세요. 상대방의 기분이 좋아지도록 칭찬을 많이 해주세요.`;

    const result = await model.generateContent([
      {
        inlineData: {
          mimeType: "image/jpeg",
          data: base64Image,
        },
      },
      prompt,
    ]);

    const response = await result.response;
    const text = response.text();

    // Parse JSON from response
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
