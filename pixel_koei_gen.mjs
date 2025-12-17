import { GoogleGenerativeAI } from "@google/generative-ai";
import * as fs from "fs";

const apiKey = "AIzaSyCltI-V0cYrB71sbi7WhdB-mYQokELViGQ";
const genAI = new GoogleGenerativeAI(apiKey);

async function generatePixelKoeiPortrait() {
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });

  const prompt = `Generate an image: A PIXEL ART portrait of Zhuge Liang from Romance of Three Kingdoms.

Style requirements:
- 16-bit or 32-bit PIXEL ART style like classic SNES/PS1 era games
- Visible pixels, retro game aesthetic
- Like old KOEI Sangokushi games from 1990s
- Hand-painted pixel art look
- NOT smooth, must have pixelated texture

Character:
- VERY HANDSOME, idealized beautiful male face
- Sharp elegant features, beautiful eyes
- Traditional Chinese scholar with green robes
- Holding white feathered fan
- Distinguished beard
- Noble, heroic appearance
- Bishonen style handsome

Colors:
- Rich but slightly muted palette
- Deep greens, browns, golds
- Dark moody background
- Warm lighting on face

Format: Square portrait, 256x256 pixel art style upscaled
The character should look like a handsome hero from a classic 90s strategy game.`;

  try {
    const result = await model.generateContent({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { responseModalities: ["TEXT", "IMAGE"] }
    });

    const response = result.response;
    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData) {
        const imageData = part.inlineData.data;
        fs.writeFileSync("/Users/hongseong-il/Downloads/ai_portrait_zhuge_pixel.png", Buffer.from(imageData, "base64"));
        console.log("Pixel art Koei portrait saved!");
      }
    }
  } catch (error) {
    console.error("Error:", error.message);
  }
}

generatePixelKoeiPortrait();
