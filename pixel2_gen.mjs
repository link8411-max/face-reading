import { GoogleGenerativeAI } from "@google/generative-ai";
import * as fs from "fs";

const apiKey = process.env.GEMINI_API_KEY; // Secured: run with --env-file=.env.local
const genAI = new GoogleGenerativeAI(apiKey);

async function gen() {
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });

  const prompt = `Create a 16-bit RETRO GAME PORTRAIT in the style of 1990s KOEI strategy games (Romance of the Three Kingdoms III/IV).

TECHNICAL STYLE:
- Hand-dotted Pixel Art (Bust Portrait)
- Heavy use of "DITHERING" (cross-hatch/checkered pixel patterns) for gradients and skin shading. This is CRITICAL for the Koei look.
- Realistic proportions (Old-school Seinen manga style), not anime.
- Palette: Desaturated 16/256 color indexed palette (earthy greens, warm skin tones, dark browns).
- Composition: Square bust portrait with dramatic side-lighting.

SUBJECT: Zhuge Liang (Strategus)
- Features: Handsome, noble young scholar (late 20s), sharp intelligent eyes, thin elegant beard.
- Attire: Deep forest-green silk robes with gold-threaded details, holding a white crane-feather fan.
- Background: Solid dark neutral color (navy or sepia).

AESTHETIC GOAL:
Must look like a character from a Japanese 1994 PC-9801 or Super Famicom simulation game. Visible chunky pixels, retro dithering shadows, and a "painted-then-scanned" retro digital look. NO modern smooth gradients.`;

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
