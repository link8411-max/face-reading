import { GoogleGenerativeAI } from "@google/generative-ai";
import * as fs from "fs";

const apiKey = process.env.GEMINI_API_KEY;

const genAI = new GoogleGenerativeAI(apiKey);

async function generateImage() {
  try {
    console.log("Testing Imagen 3...");
    const imagenModel = genAI.getGenerativeModel({ model: "imagen-3.0-generate-002" });

    const result = await imagenModel.generateImages({
      prompt: "Portrait of Zhuge Liang (Kongming) from Romance of Three Kingdoms, Koei Tecmo game art style, traditional Chinese strategist holding white feathered fan, wearing green scholar robes, wise calm expression, dramatic lighting, detailed realistic painting, square portrait format",
      numberOfImages: 1,
      aspectRatio: "1:1",
    });

    console.log("Imagen Success!");

    // Save the image
    if (result.images && result.images[0]) {
      const imageData = result.images[0].bytesBase64Encoded;
      fs.writeFileSync("/Users/hongseong-il/Downloads/test_ai_portrait.png", Buffer.from(imageData, 'base64'));
      console.log("Image saved to Downloads/test_ai_portrait.png");
    }
  } catch (error) {
    console.log("Imagen error:", error.message);
  }
}

generateImage();
