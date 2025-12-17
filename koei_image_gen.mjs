import { GoogleGenerativeAI } from "@google/generative-ai";
import * as fs from "fs";

const apiKey = "AIzaSyCltI-V0cYrB71sbi7WhdB-mYQokELViGQ";
const genAI = new GoogleGenerativeAI(apiKey);

async function generateKoeiStylePortrait() {
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });

  // 코에이 스타일 - 더 미화되고 잘생기게
  const prompt = `Generate an image: A highly idealized, handsome portrait of Zhuge Liang (Kongming) from Romance of Three Kingdoms in KOEI TECMO game art style.

Key features:
- EXTREMELY handsome face with sharp, elegant features
- Intense, intelligent piercing eyes with beautiful shape
- Perfect smooth skin, idealized beauty
- Noble, commanding presence
- Thick black hair and well-groomed beard
- Holding iconic white feathered fan gracefully
- Wearing elaborate green silk scholar robes with gold embroidery
- Dramatic cinematic lighting with golden highlights
- Rich detailed oil painting style like KOEI games (Romance of Three Kingdoms 14)
- Heroic, majestic atmosphere
- Square portrait format, dark dramatic background
- Style: Japanese video game character art, bishonen influence, idealized male beauty

The character should look like a legendary hero, not realistic - beautified and glorified like in KOEI games.`;

  try {
    const result = await model.generateContent({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { responseModalities: ["TEXT", "IMAGE"] }
    });

    const response = result.response;
    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData) {
        const imageData = part.inlineData.data;
        fs.writeFileSync("/Users/hongseong-il/Downloads/ai_portrait_zhuge_koei.png", Buffer.from(imageData, "base64"));
        console.log("Koei-style idealized image saved!");
      }
    }
  } catch (error) {
    console.error("Error:", error.message);
  }
}

generateKoeiStylePortrait();
