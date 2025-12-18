import { GoogleGenerativeAI } from "@google/generative-ai";
import * as fs from "fs";

const apiKey = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey);

async function gen() {
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });

  // 레퍼런스 이미지 로드 (코에이 삼국지 스크린샷)
  const refImage = fs.readFileSync("/Users/hongseong-il/Downloads/삼국지.webp");
  const refBase64 = refImage.toString("base64");

  const prompt = `Look at this reference image from KOEI's Romance of Three Kingdoms game.
See the character portrait style on the left side? That's the exact art style I want.

Now generate a NEW portrait in that SAME style:
- Character: Zhuge Liang (제갈량/諸葛亮)
- Same painted pixel art aesthetic as the reference
- Handsome, noble, intelligent appearance
- Green scholar robes
- Holding white feathered fan
- Traditional Chinese scholar hat
- Distinguished thin beard
- Sharp wise eyes
- Dark background

IMPORTANT: Match the art style of the reference image exactly - that classic KOEI game portrait look with the painted/pixel texture.`;

  try {
    const result = await model.generateContent({
      contents: [{
        parts: [
          {
            inlineData: {
              mimeType: "image/webp",
              data: refBase64
            }
          },
          { text: prompt }
        ]
      }],
      generationConfig: { responseModalities: ["TEXT", "IMAGE"] }
    });

    for (const part of result.response.candidates[0].content.parts) {
      if (part.inlineData) {
        fs.writeFileSync("/Users/hongseong-il/Downloads/ai_zhuge_koei_style.png", Buffer.from(part.inlineData.data, "base64"));
        console.log("코에이 스타일 이미지 저장 완료!");
      }
    }
  } catch (e) {
    console.error("Error:", e.message);
  }
}

gen();
