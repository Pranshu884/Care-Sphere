/**
 * Mathematical Validation Engine for Critical Biomarkers
 * Safely analyzes numeric values extracted by OCR against strict, deterministic boundaries.
 */

const REFERENCE_RANGES = {
  // Diabetes
  'fasting_glucose': { min: 70, max: 100, unit: 'mg/dL', name: 'Fasting Glucose' },
  'postprandial_glucose': { min: 70, max: 140, unit: 'mg/dL', name: 'Postprandial Glucose' },
  'hba1c': { min: 4.0, max: 5.6, unit: '%', name: 'HbA1c' },
  
  // Lipid Profile
  'total_cholesterol': { min: 0, max: 199, unit: 'mg/dL', name: 'Total Cholesterol' },
  'ldl_cholesterol': { min: 0, max: 99, unit: 'mg/dL', name: 'LDL Cholesterol' },
  'hdl_cholesterol': { min: 40, max: 100, unit: 'mg/dL', name: 'HDL Cholesterol' },
  'triglycerides': { min: 0, max: 149, unit: 'mg/dL', name: 'Triglycerides' },

  // Liver
  'sgpt': { min: 7, max: 55, unit: 'U/L', name: 'SGPT (ALT)' },
  'sgot': { min: 8, max: 48, unit: 'U/L', name: 'SGOT (AST)' },
  'bilirubin_total': { min: 0.1, max: 1.2, unit: 'mg/dL', name: 'Total Bilirubin' },

  // Kidney
  'creatinine': { min: 0.6, max: 1.2, unit: 'mg/dL', name: 'Creatinine' },
  'urea': { min: 7, max: 20, unit: 'mg/dL', name: 'BUN / Urea' },
  'uric_acid': { min: 3.5, max: 7.2, unit: 'mg/dL', name: 'Uric Acid' },

  // CBC
  'hemoglobin': { min: 12.0, max: 17.5, unit: 'g/dL', name: 'Hemoglobin' },
  'rbc': { min: 4.0, max: 5.9, unit: 'millions/mcL', name: 'Red Blood Cells' },
  'wbc': { min: 4500, max: 11000, unit: 'cells/mcL', name: 'White Blood Cells' },
  'platelets': { min: 150000, max: 450000, unit: 'cells/mcL', name: 'Platelets' },

  // Thyroid
  'tsh': { min: 0.4, max: 4.0, unit: 'mIU/L', name: 'TSH' },
  't3': { min: 80, max: 200, unit: 'ng/dL', name: 'Total T3' },
  't4': { min: 4.5, max: 11.2, unit: 'mcg/dL', name: 'Total T4' },

  // Vitamins & Minerals
  'vitamin_d': { min: 20, max: 50, unit: 'ng/mL', name: 'Vitamin D' },
  'vitamin_b12': { min: 200, max: 900, unit: 'pg/mL', name: 'Vitamin B12' },
  'iron': { min: 60, max: 170, unit: 'mcg/dL', name: 'Iron' },
  'ferritin': { min: 12, max: 300, unit: 'ng/mL', name: 'Ferritin' }
};

/**
 * Standardizes extracted biomarker keys to match reference dictionary
 */
const normalizeKey = (key) => {
   const lower = key.toLowerCase().replace(/[^a-z0-9]/g, '_');
   if (lower.includes('hba1c') || lower.includes('a1c')) return 'hba1c';
   if (lower.includes('fasting') && lower.includes('glucose')) return 'fasting_glucose';
   if ((lower.includes('pp') || lower.includes('postprandial')) && lower.includes('glucose')) return 'postprandial_glucose';
   if (lower === 'glucose' || lower === 'sugar') return 'fasting_glucose'; // fallback guess
   
   if (lower.includes('ldl')) return 'ldl_cholesterol';
   if (lower.includes('hdl')) return 'hdl_cholesterol';
   if (lower.includes('triglycerides')) return 'triglycerides';
   if (lower.includes('cholesterol') && !lower.includes('hdl') && !lower.includes('ldl')) return 'total_cholesterol';
   
   if (lower.includes('sgpt') || lower.includes('alt')) return 'sgpt';
   if (lower.includes('sgot') || lower.includes('ast')) return 'sgot';
   if (lower.includes('bilirubin')) return 'bilirubin_total';
   
   if (lower.includes('creatinine')) return 'creatinine';
   if (lower.includes('urea') || lower.includes('bun')) return 'urea';
   if (lower.includes('uric')) return 'uric_acid';
   
   if (lower.includes('hemoglobin') || lower === 'hb') return 'hemoglobin';
   if (lower.includes('platelet')) return 'platelets';
   if (lower === 'rbc' || lower.includes('red blood')) return 'rbc';
   if (lower === 'wbc' || lower.includes('white blood')) return 'wbc';
   
   if (lower.includes('tsh')) return 'tsh';
   if (lower.includes('t3')) return 't3';
   if (lower.includes('t4')) return 't4';
   
   if (lower.includes('vitamin d') || lower.includes('vit_d') || lower.includes('vitd')) return 'vitamin_d';
   if (lower.includes('b12')) return 'vitamin_b12';
   if (lower === 'iron') return 'iron';
   if (lower === 'ferritin') return 'ferritin';
   
   return lower;
};

export const extractBiomarkersRegex = (text) => {
   const extracted = [];
   const lines = text.split('\n');

   // Broad patterns for finding numbers near keywords
   const extractValue = (keyword, lowerText) => {
      const match = lowerText.match(new RegExp(`${keyword}[\\s\\S]{0,20}?[:=]?\\s*(\\d+\\.?\\d*)`));
      return match ? parseFloat(match[1]) : null;
   };

   // Essential targets mapped to generic regex
   const targets = [
      { key: 'hemoglobin', keywords: ['hemoglobin', 'hb'], unit: 'g/dL' },
      { key: 'hba1c', keywords: ['hba1c', 'a1c'], unit: '%' },
      { key: 'fasting_glucose', keywords: ['fasting glucose', 'fbs'], unit: 'mg/dL' },
      { key: 'postprandial_glucose', keywords: ['postprandial', 'ppbs'], unit: 'mg/dL' },
      { key: 'total_cholesterol', keywords: ['total cholesterol'], unit: 'mg/dL' },
      { key: 'ldl', keywords: ['ldl cholesterol', 'ldl'], unit: 'mg/dL' },
      { key: 'hdl', keywords: ['hdl cholesterol', 'hdl'], unit: 'mg/dL' },
      { key: 'triglycerides', keywords: ['triglycerides'], unit: 'mg/dL' },
      { key: 'tsh', keywords: ['tsh', 'thyroid stimulating'], unit: 'mIU/L' },
      { key: 'creatinine', keywords: ['creatinine'], unit: 'mg/dL' },
      { key: 'urea', keywords: ['blood urea', 'urea'], unit: 'mg/dL' }
   ];

   const lowerFull = text.toLowerCase();
   targets.forEach(t => {
      for (const kw of t.keywords) {
         const val = extractValue(kw, lowerFull);
         if (val !== null) {
            extracted.push({
               biomarkerName: t.key,
               value: val,
               unit: t.unit
            });
            break; // take first match for this target
         }
      }
   });

   return extracted;
};

/**
 * Validates extracted OCR values mathematically
 * @param {Array<{biomarker: String, value: Number, unit: String}>} extractedData 
 */
export const validateBiomarkers = (extractedData) => {
   const abnormalities = [];
   const parsedBiomarkers = [];
   const healthMetricsMap = {};
   const validatedKeys = [];

   if (!Array.isArray(extractedData)) {
      return { abnormalities, parsedBiomarkers, healthMetricsMap, validatedKeys };
   }

   extractedData.forEach(item => {
      if (!item.biomarker || typeof item.value !== 'number') return;
      
      const normalizedKey = normalizeKey(item.biomarker);
      const range = REFERENCE_RANGES[normalizedKey];
      
      let status = 'normal';
      let refString = 'Unknown';

      // If we have a mathematical rule for it
      if (range) {
         refString = `${range.min} - ${range.max} ${range.unit}`;
         validatedKeys.push(normalizedKey);
         
         if (item.value < range.min) {
            status = 'low';
            abnormalities.push(`Low ${range.name} (${item.value} ${item.unit || range.unit}). Normal range: ${refString}.`);
         } else if (item.value > range.max) {
            status = 'high';
            // HDL needs high logic reversed usually, but 40-100 is typical baseline. Let's just output mathematically.
            if (normalizedKey === 'hdl_cholesterol') {
               abnormalities.push(`Optimal/High HDL Cholesterol (${item.value} ${item.unit || range.unit}).`);
               status = 'normal'; // usually high HDL is good.
            } else {
               abnormalities.push(`High ${range.name} (${item.value} ${item.unit || range.unit}). Normal range: ${refString}.`);
            }
         }
      }

      parsedBiomarkers.push({
         biomarkerName: range ? range.name : item.biomarker,
         normalizedKey: normalizedKey,
         value: item.value,
         unit: item.unit || (range ? range.unit : ''),
         status,
         referenceRange: refString
      });

      // Maintain legacy map for easy extraction
      healthMetricsMap[normalizedKey] = `${item.value} ${item.unit || (range ? range.unit : '')}`;
   });

   return {
      abnormalities,
      parsedBiomarkers,
      healthMetricsMap,
      validatedKeys
   };
};
