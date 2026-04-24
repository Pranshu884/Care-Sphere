import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
dotenv.config();

console.log("Key:", process.env.GEMINI_API_KEY ? "EXISTS" : "MISSING");

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

async function test() {
  try {
     const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: 'test'
    });
    console.log(response.text);
  } catch (e) {
    console.error("FAILED:", e);
  }
}
test();
