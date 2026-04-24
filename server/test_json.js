import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
dotenv.config();

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

async function test() {
  try {
     const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: 'return a json object with testing: true',
      config: {
         responseMimeType: 'application/json',
      }
    });
    console.log(response.text);
  } catch (e) {
    console.error("FAILED SDK CONFIG:", e.message);
  }
}
test();
