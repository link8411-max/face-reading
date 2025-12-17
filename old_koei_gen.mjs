import { GoogleGenerativeAI } from "@google/generative-ai";
import * as fs from "fs";

const apiKey = "AIzaSyCltI-V0cYrB71sbi7WhdB-mYQokELViGQ";
const genAI = new GoogleGenerativeAI(apiKey);

async function generateOldKoeiPortrait() {
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });

  // 올드 코에이 스타일 - 90년대~2000년대 삼국지 게임
  const prompt = `Generate an image: A classic KOEI Romance of Three Kingdoms portrait of Zhuge Liang in the style of the 1990s-2000s games.

Art style:
- Traditional oil painting technique, NOT digital art
- MUTED, darker color palette - no bright or flashy colors
- Earthy tones: dark browns, deep greens, aged gold
- Subtle brush strokes visible like real oil painting
- Slightly grainy, vintage texture
- Dark, moody atmospheric lighting
- Historical serious tone, NOT anime or modern game art

Character:
- Handsome but dignified older scholar look
- Wise, calm expression with knowing eyes
- Traditional Chinese scholar hat (guan)
- Dark green/brown scholar robes, simple not flashy
- Holding white feathered fan
- Well-groomed beard, distinguished appearance

Atmosphere:
- Like a historical painting from a museum
- Somber, serious mood
- Dark brown/sepia background
- NO shiny effects, NO glow, NO sparkles
- Feels like a portrait painted 30 years ago
- Square format

Reference: KOEI Sangokushi 7, 8, 9 era character portraits`;

  try {
    const result = await model.generateContent({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { responseModalities: ["TEXT", "IMAGE"] }
    });

    const response = result.response;
    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData) {
        const imageData = part.inlineData.data;
        fs.writeFileSync("/Users/hongseong-il/Downloads/ai_portrait_zhuge_oldkoei.png", Buffer.from(imageData, "base64"));
        console.log("Old Koei-style portrait saved!");
      }
    }
  } catch (error) {
    console.error("Error:", error.message);
  }
}

generateOldKoeiPortrait();
