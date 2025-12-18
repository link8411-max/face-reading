import { GoogleGenerativeAI } from "@google/generative-ai";
import * as fs from "fs";

const apiKey = "AIzaSyCltI-V0cYrB71sbi7WhdB-mYQokELViGQ";
const genAI = new GoogleGenerativeAI(apiKey);

async function gen() {
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });

  const prompt = `Create a 16-bit RETRO GAME PORTRAIT in the exact style of 1990s KOEI strategy games (Romance of the Three Kingdoms III/IV).

TECHNICAL SPECIFICATIONS:
- STYLE: Hand-dotted Pixel Art (Bust Portrait)
- PALETTE: Limited 16-color or 256-color palette (Indexed color look)
- TECHNIQUE: Heavy use of "DITHERING" (checkered pixel patterns) for shading and gradients
- RESOLUTION: Render as if it were 64x80 pixels, but sharp and clean
- LIGHTING: Dramatic side-lighting (Chiaroscuro) with deep shadows and high contrast
- BACKGROUND: Solid dark neutral color (navy, dark brown) or simple stone texture

SUBJECT: Zhuge Liang, the legendary strategist
- Appearance: Handsome, refined scholar, late 20s
- Features: Sharp intelligent eyes, thin elegant mustache and goatee, fair skin
- Clothing: Forest green silk scholar robes with intricate gold-threaded embroidery
- Accessory: Holding a white crane-feather fan near his chest
- Hat: Traditional black scholar's headcloth (Guan)

AESTHETIC GOAL:
Must look like a character from a Japanese 16-bit PC-98 or Super Famicom simulation game. Visible chunky pixels, retro dithering artifacts, and a "painted" but pixelated look. NO smooth gradients, NO modern digital art look.`;

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
