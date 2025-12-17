import { GoogleGenerativeAI } from "@google/generative-ai";
import * as fs from "fs";

const apiKey = "AIzaSyCltI-V0cYrB71sbi7WhdB-mYQokELViGQ";
const genAI = new GoogleGenerativeAI(apiKey);

async function generateAndSave() {
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });
  
  const result = await model.generateContent({
    contents: [{
      parts: [{
        text: "Generate an image: A portrait painting of Zhuge Liang (Kongming) from Romance of Three Kingdoms in Koei Tecmo game art style. Traditional Chinese military strategist holding a white feathered fan, wearing green scholar robes. Wise calm expression. Dramatic lighting. Detailed realistic painting. Square portrait, dark background."
      }]
    }],
    generationConfig: { responseModalities: ["TEXT", "IMAGE"] }
  });

  const response = result.response;
  for (const part of response.candidates[0].content.parts) {
    if (part.inlineData) {
      const imageData = part.inlineData.data;
      fs.writeFileSync("/Users/hongseong-il/Downloads/ai_portrait_zhuge.png", Buffer.from(imageData, "base64"));
      console.log("AI image saved to: /Users/hongseong-il/Downloads/ai_portrait_zhuge.png");
    }
  }
}

generateAndSave().catch(console.error);
