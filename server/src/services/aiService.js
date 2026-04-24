import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
dotenv.config();

// Lazy initialize to ensure ENV is loaded
let ai;
function getAi() {
  if (!ai && process.env.GEMINI_API_KEY) {
     ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  }
  return ai;
}

/**
 * Analyzes a given document/image and extracts structured medical intelligence.
 * @param {Buffer} fileBuffer
 * @param {String} mimeType
 * @returns {Promise<Object>}
 */
export const analyzeHealthReport = async (fileBuffer, mimeType) => {
  console.log("DEBUG: analyzeHealthReport called with mimeType:", mimeType);
  const currentAi = getAi();
  if (!currentAi) {
     console.error("DEBUG: GEMINI_API_KEY is missing during execution.");
     return {
        aiSummary: "AI capabilities disabled (Missing API Key).",
        aiAbnormalities: [],
        aiRecommendations: [],
        healthMetrics: {},
        category: "Other"
     };
  }

  try {
    const prompt = `
      You are an expert, empathetic medical AI assistant for a personal health application.
      Your goal is to explain health reports to normal users with zero medical knowledge, making them feel empowered and informed.
      
      CRITICAL MEDICAL SAFETY RULE ⚠:
      You must NEVER behave like a doctor. NEVER provide a direct diagnosis, prescribe medicine, or give unsafe medical advice/treatment instructions.
      ONLY provide observations, understandable explanations, and safe guidance to consult a doctor. Keep it extremely patient-friendly.

      EXTRACTION FOCUS (MOST IMPORTANT):
      Pay exceptionally close attention to: CBC, HbA1c, Blood Sugar, Cholesterol, Thyroid, Vitamin D, Vitamin B12, Liver Function, Kidney Function, BP, Hemoglobin, Iron, Lipid Profile. These must work extremely well.
      
      Respond STRICTLY with ONLY a JSON object having the following schema (no markdown formatting, no text outside JSON):
      {
        "category": "String (Auto-detect the best category from: ['Blood Test', 'Prescription', 'X-Ray', 'MRI/CT Scan', 'Discharge Summary', 'Consultation Notes', 'Vaccination Record', 'Other'])",
        "simpleSummary": [
          "String (Patient-friendly bullet points. Explain what the report means in simple terms. E.g. '⚠ Your report may suggest mild iron deficiency' or '✅ Blood sugar levels are normal'). No heavy clinical jargon."
        ],
        "abnormalFindings": [
          "String (Specific and genuinely useful abnormal flags. E.g. 'Borderline high triglycerides', 'Slight kidney function variation'). Do not generate vague text."
        ],
        "doctorDiscussionPoints": [
          "String (Intelligent, practical suggestions for their doctor visit. E.g. 'whether iron deficiency treatment is needed', 'if kidney function should be monitored again')."
        ],
        "followUpSuggestion": "String (Specific follow-up timing based on report. E.g. 'Recheck CBC after iron treatment', 'Thyroid follow-up recommended in 6 months'. Leave blank if none.)",
        "healthMetrics": { "metric_key_in_snake_case": "String value of the extracted metric (e.g. '165' for Glucose)" }
      }
    `;

    const response = await currentAi.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [
        {
          role: 'user',
          parts: [
            { text: prompt },
            { inlineData: { mimeType, data: fileBuffer.toString("base64") } }
          ]
        }
      ],
      config: { responseMimeType: 'application/json' }
    });

    const outputText = response.text;
    console.log("DEBUG: Raw Gemini Response:", outputText);
    
    // Safety fallback parser in case model wraps in markdown
    let cleanJson = outputText.trim();
    if (cleanJson.startsWith('```json')) {
       cleanJson = cleanJson.replace(/```json/g, "").replace(/```/g, "").trim();
    } else if (cleanJson.startsWith('```')) {
       cleanJson = cleanJson.replace(/```/g, "").trim();
    }

    const result = JSON.parse(cleanJson);
    console.log("DEBUG: Parsed JSON Category:", result.category);
    
    // Aggregating Gemini output to fit Report.js Mongoose Schema natively
    let finalSummary = result.simpleSummary;
    if (Array.isArray(result.simpleSummary)) {
       finalSummary = result.simpleSummary.join('\n\n');
    }

    let finalRecommendations = [];
    if (Array.isArray(result.doctorDiscussionPoints)) {
       finalRecommendations.push(...result.doctorDiscussionPoints);
    }
    if (Array.isArray(result.recommendations)) {
       finalRecommendations.push(...result.recommendations);
    }
    if (result.followUpSuggestion && result.followUpSuggestion.trim()) {
       finalRecommendations.push(`Follow-up: ${result.followUpSuggestion}`);
    }

    return {
       aiSummary: finalSummary || "Completed analysis safely.",
       aiAbnormalities: result.abnormalFindings || [],
       aiRecommendations: finalRecommendations,
       healthMetrics: result.healthMetrics || {},
       category: result.category || "Other"
    };

  } catch (error) {
    console.error("AI Analysis Failed:", error);
     return {
        aiSummary: "The AI analysis could not be completed for this specific document format.",
        aiAbnormalities: [],
        aiRecommendations: [],
        healthMetrics: {},
        category: "Other"
     };
  }
};
