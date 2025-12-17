import { GoogleGenerativeAI } from "@google/generative-ai";
import * as fs from "fs";

const apiKey = "AIzaSyCltI-V0cYrB71sbi7WhdB-mYQokELViGQ";
const genAI = new GoogleGenerativeAI(apiKey);

async function gen() {
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });

  const prompt = `Create a 64x64 PIXEL ART portrait, then upscaled to show the pixels clearly.

MUST be actual PIXEL ART with visible square pixels like:
- Final Fantasy 6 character portraits
- Suikoden 1/2 character faces
- Old KOEI strategy games from Super Famicom era
- Retro 16-bit JRPG style

Subject: Zhuge Liang, Chinese strategist
- Handsome bishonen style face
- Green scholar robes, gold trim
- White feather fan
- Black hair tied up
- Thin elegant beard
- Sharp intelligent eyes
- Noble heroic look

IMPORTANT: Must look like actual retro game pixel art with blocky pixels visible, not smooth digital art. Like a sprite from a 1995 SNES game.`;

  try {
    const result = await model.generateContent({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { responseModalities: ["TEXT", "IMAGE"] }
    });

    for (const part of result.response.candidates[0].content.parts) {
      if (part.inlineData) {
        fs.writeFileSync("/Users/hongseong-il/Downloads/ai_zhuge_pixel2.png", Buffer.from(part.inlineData.data, "base64"));
        console.log("Saved!");
      }
    }
  } catch (e) {
    console.error(e.message);
  }
}

gen();
