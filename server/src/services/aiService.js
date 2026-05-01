import { GoogleGenAI } from '@google/genai';
import { validateBiomarkers, extractBiomarkersRegex } from '../utils/medicalReference.js';
import { createRequire } from 'module';
import Report from '../models/Report.js';
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
 * Analyzes a given document/image in 3 Phases (OCR, Validation, Explanation).
 * @param {Buffer} fileBuffer - The PDF or Image buffer
 * @param {String} mimeType - The file MIME type
 * @param {String} reportId - Optional MongoDB Report ID for async background updating
 */
export const analyzeHealthReport = async (fileBuffer, mimeType, reportId = null) => {
  console.log("\n[GEMINI OCR START] Initializing Deep OCR Extraction Phase...");
  const currentAi = getAi();
  
  const fallbackError = {
      aiSummary: "AI capabilities disabled or failed.",
      aiAbnormalities: [],
      aiRecommendations: [],
      healthMetrics: {},
      parsedBiomarkers: [],
      category: "Other",
      auditLog: {}
  };

  if (!currentAi) {
     console.error("[GEMINI FAILURE] GEMINI_API_KEY is missing during execution.");
     fallbackError.aiSummary = "AI capabilities disabled (Missing API Key).";
     return fallbackError;
  }

  try {
    // ---------------------------------------------------------
    // PHASE 1: OCR EXTRACTION
    // ---------------------------------------------------------
    const extractionPrompt = `
      You are a highly precise clinical OCR parsing system.
      CRITICAL RULE: DO NOT EXPLAIN OR DIAGNOSE. ONLY EXTRACT RAW DATA.

      Read the attached medical document and extract all quantifiable biomarkers.
      Output strictly as JSON (no markdown formatting outside of JSON):
      {
        "category": "String (Detect exact report type: 'Blood Test', 'Prescription', 'X-Ray', 'MRI/CT Scan', 'Discharge Summary', 'Consultation Notes', 'Vaccination Record', 'Insurance', 'Other')",
        "biomarkers": [
          {
            "biomarker": "String (Exact name of the test, e.g. 'Fasting Glucose', 'HbA1c', 'TSH')",
            "value": Number (The exact numeric result extracted. Must be a number. Output null if non-numeric),
            "unit": "String (e.g. 'mg/dL', '%'. Empty string if none)"
          }
        ]
      }
    `;

    let finalExtractionPayload = [];

    if (mimeType === 'application/pdf') {
       console.log(`[PDF RECEIVED] Buffer size: ${fileBuffer.length}`);
       let pagesText = [];
       try {
           const requireWrapper = createRequire(import.meta.url);
           const pdfParseRaw = requireWrapper('pdf-parse');
           const pdfParse = typeof pdfParseRaw === 'function' ? pdfParseRaw : (pdfParseRaw.default || pdfParseRaw.pdf || pdfParseRaw);
           
           const options = {
              pagerender: function(pageData) {
                 return pageData.getTextContent().then(function(textContent) {
                     const text = textContent.items.map(i => i.str).join(' ');
                     pagesText.push(text);
                     return text;
                 });
              }
           };
           await pdfParse(fileBuffer, options);
           console.log("[PDF PARSED] 1.1.1 library successfully extracted text.");
       } catch (err) {
           console.log("[PDF PARSED FATAL] Text extraction failed purely on the buffer layer...", err.message);
       }
       
       console.log(`[TOTAL PAGES LOADED: ${pagesText.length}]`);
       const clinicalKeywords = ['hba1c', 'glucose', 'hemoglobin', 'wbc', 'ldl', 'hdl', 'creatinine', 'urea', 'tsh', 'impression', 'findings', 'diagnosis', 'observations', 'summary', 'cbc', 'laboratory', 'test', 'result', 'biomarker', 'platelet', 'cholesterol'];
       const relevantPages = [];

       pagesText.forEach((text, index) => {
          const lowerText = text.toLowerCase();
          const isRelevant = clinicalKeywords.some(kw => lowerText.includes(kw));
          if (isRelevant) {
             console.log(`[PAGE ${index + 1} RELEVANT] - Clinical Keywords Detected`);
             relevantPages.push(`--- PAGE ${index + 1} ---\n${text}`);
          } else {
             console.log(`[PAGE ${index + 1} SKIPPED] - Cover / Non-Medical Page`);
          }
       });

       if (relevantPages.length === 0) {
          console.log(`[ALL PAGES SKIPPED] No explicit keywords found. Forcing analysis on all pages as fallback.`);
          relevantPages.push(...pagesText.map((t, i) => `--- PAGE ${i + 1} ---\n${t}`));
       }

       const mergedContent = relevantPages.join('\n\n');
       if (mergedContent.trim().length < 100) {
           console.log(`[SCANNED PDF DETECTED] Text extraction too short. Falling back to Gemini Vision native buffer analysis.`);
           finalExtractionPayload = [
               { text: extractionPrompt },
               { inlineData: { mimeType, data: fileBuffer.toString("base64") } }
           ];
       } else {
           console.log(`[MERGED REPORT CONTENT] Consolidated ${mergedContent.length} characters for AI.`);
           finalExtractionPayload = [
               { text: extractionPrompt },
               { text: "Here is the extracted medical content:\n" + mergedContent }
           ];
       }
    } else {
       finalExtractionPayload = [
          { text: extractionPrompt },
          { inlineData: { mimeType, data: fileBuffer.toString("base64") } }
       ];
    }

    let ocrResponse;
    let extractedData = { category: "Other", biomarkers: [] };
    let phase1Failed = false;

    try {
      console.log(`[BACKGROUND AI START] Prompting Gemini for Extraction...`);
      ocrResponse = await currentAi.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [{ role: 'user', parts: finalExtractionPayload }],
        config: { responseMimeType: 'application/json' }
      });
      
      let cleanOcr = ocrResponse.text.trim();
      if (cleanOcr.startsWith('```json')) { cleanOcr = cleanOcr.replace(/```json/g, "").replace(/```/g, "").trim(); }
      else if (cleanOcr.startsWith('```')) { cleanOcr = cleanOcr.replace(/```/g, "").trim(); }
      
      extractedData = JSON.parse(cleanOcr);
      console.log("[OCR COMPLETE] Gemini Vision correctly processed data.");
    } catch (e) {
      console.error("[OCR FAILED → REGEX FALLBACK] Gemini extraction failed. Engaging pure Javascript text extraction...", e.message);
      phase1Failed = true;
      if (mimeType === 'application/pdf') {
         // Attempt recovery using pdf-parse Regex module!
         const regexExtraction = extractBiomarkersRegex(finalExtractionPayload[1]?.text || "");
         extractedData.biomarkers = regexExtraction;
         if (extractedData.biomarkers.length > 0) {
            console.log(`[FALLBACK SUCCESS] Regex located ${regexExtraction.length} vital records without AI.`);
         } else {
            console.log("[FALLBACK FAILED] No basic standard values found in regex scan.");
         }
      }
    }
    
    // ---------------------------------------------------------
    // PHASE 2: MATHEMATICAL VALIDATION ENGINE
    // ---------------------------------------------------------
    console.log(`[REFERENCE ENGINE VALIDATED] Running math algorithms for ${extractedData.category}...`);
    const validation = validateBiomarkers(extractedData.biomarkers);
    const { abnormalities, healthMetricsMap, parsedBiomarkers } = validation;
    
    if (abnormalities.length > 0) {
       console.log(`[ABNORMALITIES DETECTED] Found ${abnormalities.length} mathematically proven issues.`);
    }

    // ---------------------------------------------------------
    // PHASE 3: AI EXPLANATION & TRANSLATION
    // ---------------------------------------------------------
    const explanationPrompt = `
      You are an expert, empathetic medical AI assistant for a personal health application.
      Your goal is to explain MATH-VALIDATED results to a patient securely.

      CRITICAL MEDICAL SAFETY RULE ⚠:
      NEVER behave like a doctor. NEVER provide a diagnosis.

      Report Type: ${extractedData.category || 'Other'}
      
      MATHEMATICALLY PROVEN ABNORMALITIES CLASSIFIED BY OUR BACKEND ENGINE:
      ${abnormalities.length > 0 ? JSON.stringify(abnormalities) : 'None. All analyzed values are strictly in normal ranges.'}

      Generate a clean JSON explaining this for the patient:
      {
        "simpleSummary": [
          "String (Patient-friendly bullet points explaining what these findings mean. No heavy clinical jargon. Keep it empathetic and simple. E.g. 'Your HbA1c indicates higher average blood sugar', or 'Your test results look completely optimal')."
        ],
        "doctorDiscussionPoints": [
          "String (Premium suggestions for their doctor visit. E.g. 'Discuss your elevated HbA1c and request a care plan'. If all normal, suggest 'Maintain current healthy lifestyle')."
        ],
        "followUpSuggestion": "String (E.g. 'Recheck HbA1c after 3 months'. Leave blank if none.)"
      }
    `;

    let mappedExplanation = {
      simpleSummary: [],
      doctorDiscussionPoints: [],
      followUpSuggestion: ""
    };
    
    let phase3Failed = false;

    if (phase1Failed) {
       console.log("[SUMMARY FAILED → PARTIAL ANALYSIS] Skipping Gemini Explanation due to Phase 1 collapse.");
       phase3Failed = true;
    } else {
       try {
         const explainResponse = await currentAi.models.generateContent({
           model: 'gemini-2.5-flash',
           contents: [{ role: 'user', parts: [{ text: explanationPrompt }] }],
           config: { responseMimeType: 'application/json' }
         });

         let cleanExplain = explainResponse.text.trim();
         if (cleanExplain.startsWith('```json')) cleanExplain = cleanExplain.replace(/```json/g, "").replace(/```/g, "").trim();
         else if (cleanExplain.startsWith('```')) cleanExplain = cleanExplain.replace(/```/g, "").trim();
         
         mappedExplanation = JSON.parse(cleanExplain);
         console.log(`[GEMINI SUCCESS] Intelligent translations processed.`);
       } catch(e) {
         console.log(`[SUMMARY REGEX FALLBACK FAILED] Falling back to limited explanation structure. `, e.message);
         phase3Failed = true;
       }
    }

    const finalSummary = Array.isArray(mappedExplanation.simpleSummary) && mappedExplanation.simpleSummary.length > 0
          ? mappedExplanation.simpleSummary.join('\n\n')
          : '';

    const payload = {
      category: extractedData.category || 'Other',
      parsedBiomarkers,
      aiSummary: finalSummary,
      aiAbnormalities: mappedExplanation.abnormalClarifications || [], // Deprecated property logic mapped to arrays
      aiRecommendations: mappedExplanation.doctorDiscussionPoints || [],
      healthMetrics: healthMetricsMap,
      followUpSuggestion: mappedExplanation.followUpSuggestion || "",
      auditLog: {
        extractionTimestamp: new Date().toISOString(),
        aiModelVersion: "gemini-2.5-flash-v2",
        sourceReportType: extractedData.category || "Unknown",
        validatedKeys: Object.keys(healthMetricsMap)
      },
      analysisStatus: (phase1Failed || phase3Failed) ? 'partial_analysis' : 'completed'
    };

    if (payload.aiAbnormalities.length === 0 && Array.isArray(abnormalities)) {
       payload.aiAbnormalities = abnormalities;
    }
    
    console.log(`[STATUS UPDATED = ${payload.analysisStatus.toUpperCase()}]`);

    // Async Update MongoDB if reportId mapping enabled
    if (reportId) {
        await Report.findByIdAndUpdate(reportId, payload, { new: true });
        console.log(`[BACKGROUND COMPLETE] Successfully processed db updates for report ${reportId}`);
    }

    return payload;

  } catch (error) {
    console.error("[GEMINI SEVERE FATAL] AI Analysis fully crashed:", error.message);
    const fallbackPayload = {
      category: 'Other',
      parsedBiomarkers: [],
      aiSummary: '',
      aiAbnormalities: [],
      aiRecommendations: [],
      healthMetrics: {},
      auditLog: {},
      analysisStatus: 'failed'
    };

    if (reportId) {
        await Report.findByIdAndUpdate(reportId, fallbackPayload, { new: true });
    }

    return fallbackPayload;
  }
};
