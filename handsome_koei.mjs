import { GoogleGenerativeAI } from "@google/generative-ai";
import * as fs from "fs";

const apiKey = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey);

async function gen() {
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });

  const refImage = fs.readFileSync("/Users/hongseong-il/Downloads/삼국지.webp");
  const refBase64 = refImage.toString("base64");

  const prompt = `Look at the character portrait art style in this reference image from KOEI's Romance of Three Kingdoms game.

Generate a NEW portrait in that SAME painted pixel art style, but make the character EXTREMELY HANDSOME:

Character: Zhuge Liang (제갈량/諸葛亮) - the legendary genius strategist

MUST BE VERY HANDSOME:
- Young, beautiful face (late 20s appearance)
- SLIM face, NOT round or chubby
- Sharp jawline, high cheekbones
- Beautiful almond-shaped eyes, intelligent gaze
- Elegant thin eyebrows
- Small refined nose
- Thin neat beard (not bushy)
- Long black hair, elegantly styled
- Pale fair skin
- Bishonen/pretty boy aesthetic
- Think: Korean drama actor handsome

Outfit:
- Green silk scholar robes with gold trim
- Traditional scholar hat (건/巾)
- Holding white feathered fan gracefully

Style: SAME as reference - classic KOEI game portrait with painted/pixel texture, dark background

He should look like the most handsome genius in all of China - elegant, noble, beautiful.`;

  try {
    const result = await model.generateContent({
      contents: [{
        parts: [
          { inlineData: { mimeType: "image/webp", data: refBase64 } },
          { text: prompt }
        ]
      }],
      generationConfig: { responseModalities: ["TEXT", "IMAGE"] }
    });

    for (const part of result.response.candidates[0].content.parts) {
      if (part.inlineData) {
        fs.writeFileSync("/Users/hongseong-il/Downloads/ai_zhuge_handsome.png", Buffer.from(part.inlineData.data, "base64"));
        console.log("잘생긴 제갈량 저장!");
      }
    }
  } catch (e) {
    console.error("Error:", e.message);
  }
}

gen();
