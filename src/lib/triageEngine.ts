export interface Question {
  id: string;
  text: string;
  options: string[];
}

export interface Condition {
  name: string;
  confidence: 'Most likely' | 'Possible' | 'Less likely';
  confidenceValue: number;
  description: string;
}

export interface TriageResult {
  level: 'Emergency' | 'Urgent' | 'Moderate' | 'Low';
  color: 'red' | 'orange' | 'yellow' | 'green';
  conditions: Condition[];
  alert?: string;
  redFlags: string[];
  homeCare: string[];
  action: { type: 'maps' | 'book' | 'home'; text: string };
  parsedContext: {
    symptoms: string[];
    duration: string;
    severity: string;
  };
  isFallback: boolean;
}

export interface UserContext {
  age: string;
  gender: string;
  history: string;
}

const SYMPTOM_DATA: Record<string, { redFlags: string[], homeCare: string[] }> = {
  headache: {
    redFlags: ['Sudden severe pain', 'Vision loss', 'Confusion or trouble speaking', 'Stiff neck'],
    homeCare: ['Rest in a quiet, dark room', 'Stay hydrated', 'Apply a cold or warm compress', 'Take over-the-counter pain relievers if appropriate']
  },
  fever: {
    redFlags: ['Fever above 103°F (39.4°C)', 'Difficulty breathing', 'Severe headache', 'Chest pain'],
    homeCare: ['Stay hydrated with water or electrolytes', 'Rest and avoid strenuous activity', 'Monitor your temperature', 'Take fever-reducing medication if needed']
  },
  chest_pain: {
    redFlags: ['Pain spreading to arm, neck, or jaw', 'Sweating', 'Breathlessness', 'Squeezing pressure'],
    homeCare: ['Sit down and rest immediately', 'Loosen tight clothing', 'Take prescribed nitroglycerin if you have it', 'Do not exert yourself']
  },
  cough: {
    redFlags: ['Coughing up blood', 'Severe shortness of breath', 'Chest pain with coughing', 'High fever'],
    homeCare: ['Stay hydrated to soothe throat', 'Use a humidifier', 'Rest with head elevated', 'Consume honey or throat lozenges']
  },
  breathing_difficulty: {
    redFlags: ['Gasping for air', 'Inability to speak in full sentences', 'Bluish lips or face', 'Severe chest pain'],
    homeCare: ['Sit upright, do not lie flat', 'Try to remain calm and breathe slowly', 'Use prescribed inhalers if available', 'Open a window for fresh air']
  },
  stomach_pain: {
    redFlags: ['Severe, sudden pain', 'Vomiting blood or dark material', 'Inability to keep liquids down', 'Yellowing of skin or eyes'],
    homeCare: ['Sip clear liquids slowly', 'Eat bland foods (BRAT diet)', 'Avoid spicy, greasy, or dairy foods', 'Rest with a heating pad']
  },
  dizziness: {
    redFlags: ['Sudden severe headache', 'Fainting or loss of consciousness', 'Difficulty speaking or weakness', 'Chest pain or irregular heartbeat'],
    homeCare: ['Sit or lie down immediately', 'Change positions slowly', 'Drink plenty of water', 'Avoid sudden head movements']
  },
  skin_rash: {
    redFlags: ['Rash spreading rapidly', 'Difficulty breathing or facial swelling', 'Fever over 100°F (37.8°C)', 'Blisters or open sores'],
    homeCare: ['Keep the area clean and dry', 'Apply a cool compress', 'Use over-the-counter anti-itch cream', 'Avoid scratching the affected area']
  },
  diarrhea: {
    redFlags: ['Black or bloody stools', 'Severe dehydration (dry mouth, no urination)', 'High fever above 102°F (38.9°C)', 'Severe abdominal pain'],
    homeCare: ['Drink plenty of clear fluids (water, oral rehydration solutions)', 'Eat a BRAT diet (bananas, rice, applesauce, toast)', 'Avoid dairy, caffeine, and greasy foods', 'Rest']
  },
  shoulder_pain: {
    redFlags: ['Pain accompanied by chest tightness or shortness of breath', 'Inability to move the arm', 'Sudden swelling or intense pain', 'Numbness or tingling in the arm'],
    homeCare: ['Rest the shoulder and avoid heavy lifting', 'Apply ice for 15-20 minutes a few times a day', 'Take over-the-counter pain relievers', 'Perform gentle stretches if not too painful']
  }
};

const SYMPTOM_MAP: Record<string, string[]> = {
  headache: ["headache", "migraine", "head pain", "pressure in head", "head hurts", "pounding head"],
  fever: ["fever", "high temperature", "chills", "body heat", "feeling hot", "feverish"],
  diarrhea: ["diarrhea", "loose motion", "loose motions", "loose stools", "watery stool", "running stomach", "the runs"],
  stomach_pain: ["stomach pain", "abdominal pain", "gastric pain", "cramps", "belly ache", "tummy ache", "stomach hurts"],
  chest_pain: ["chest pain", "tight chest", "heart pain", "pressure in chest", "chest tightness", "burning chest"],
  shoulder_pain: ["shoulder pain", "shoulder stiffness", "rotator pain", "stiff shoulder", "shoulder ache"],
  breathing_difficulty: ["shortness of breath", "breathing problem", "can't breathe", "breathless", "gasping", "wheezing", "trouble breathing"],
  dizziness: ["dizzy", "lightheaded", "faint", "vertigo", "spinning", "dizzyness", "passing out"],
  cough: ["cough", "coughing", "hacking", "chesty cough", "dry cough"],
  skin_rash: ["rash", "skin issue", "itchy", "hives", "red spots", "itch"]
};

function normalizeText(text: string): string {
  let normalized = text.toLowerCase();
  normalized = normalized.replace(/[^\w\s]/gi, ''); // Remove punctuation
  normalized = normalized.replace(/\s+/g, ' ').trim(); // Collapse multiple spaces
  
  // Custom normalization for known variations
  normalized = normalized.replace(/\bloose motions\b/g, 'loose motion');
  normalized = normalized.replace(/\bdizzyness\b/g, 'dizziness');
  
  return normalized;
}

export const triageEngine = {
  analyzeText(text: string): { keywords: string[], questions: Question[], isFallback: boolean } {
    const normalized = normalizeText(text);
    const keywordsSet: Set<string> = new Set();
    
    // Priority matching
    for (const [symptomKey, phrases] of Object.entries(SYMPTOM_MAP)) {
      for (const phrase of phrases) {
        if (normalized.includes(phrase)) {
          keywordsSet.add(symptomKey);
        }
      }
    }

    const keywords = Array.from(keywordsSet);
    const isFallback = keywords.length === 0;

    const questions: Question[] = [];
    questions.push({ id: 'duration', text: 'How long have you had these symptoms?', options: ['1 day or less', '1-3 days', 'More than 3 days'] });
    questions.push({ id: 'severity', text: 'How severe is your condition?', options: ['Mild', 'Moderate', 'Severe'] });

    return { keywords, questions, isFallback };
  },

  calculateResult(keywords: string[], answers: Record<string, string>, context: UserContext, isFallback: boolean): TriageResult {
    const duration = answers['duration'] || '1 day or less';
    const severity = answers['severity'] || 'Mild';
    
    const age = parseInt(context.age) || 30;
    const history = (context.history || '').toLowerCase();
    const hasExistingCondition = history.length > 3 && history !== 'none' && history !== 'no';

    // Contextual Weighting Engine
    let score = 0;

    if (severity === 'Severe') score += 2;
    if (severity === 'Moderate') score += 1;
    if (duration === 'More than 3 days') score += 2;
    if (age > 50) score += 1;
    if (hasExistingCondition) score += 2;
    if (keywords.length > 1) score += 1; // Multi-symptom risk

    // Hard overrides for critical symptoms
    if (keywords.includes('chest_pain') || keywords.includes('breathing_difficulty')) {
      score = Math.max(score, 9); // Force to Red
    }

    let urgencyLevel = 0; // 0=Green, 1=Yellow, 2=Orange, 3=Red
    if (score >= 9) urgencyLevel = 3;
    else if (score >= 6) urgencyLevel = 2;
    else if (score >= 3) urgencyLevel = 1;
    else urgencyLevel = 0;

    // Fallback Mode Safety
    let alertText = '';
    if (isFallback) {
      urgencyLevel = Math.max(urgencyLevel, 1); // Fallback never gives Green
      alertText = "We couldn't fully identify your symptoms from the text. Please consult a doctor for a precise diagnosis.";
    }

    let levelTitle: 'Emergency' | 'Urgent' | 'Moderate' | 'Low' = 'Low';
    let colorClass: 'red' | 'orange' | 'yellow' | 'green' = 'green';
    let actionObj: { type: 'maps' | 'book' | 'home'; text: string } = { type: 'home', text: 'Home care sufficient' };

    if (urgencyLevel === 3) {
      levelTitle = 'Emergency';
      colorClass = 'red';
      actionObj = { type: 'maps', text: 'Go to nearest hospital immediately' };
    } else if (urgencyLevel === 2) {
      levelTitle = 'Urgent';
      colorClass = 'orange';
      actionObj = { type: 'book', text: 'Book Doctor (Today)' };
    } else if (urgencyLevel === 1) {
      levelTitle = 'Moderate';
      colorClass = 'yellow';
      actionObj = { type: 'book', text: 'Book Doctor (2-3 Days)' };
    } else {
      levelTitle = 'Low';
      colorClass = 'green';
      actionObj = { type: 'home', text: 'Home care sufficient' };
    }

    // Dynamic Differential Diagnosis
    const conditions: Condition[] = [];

    if (isFallback) {
      conditions.push({ name: 'Unspecified Medical Condition', confidence: 'Possible', confidenceValue: 50, description: 'Symptom matching was inconclusive. Please describe your symptoms directly to a healthcare professional.' });
    } else {
      // Loop through all detected symptoms to build possible conditions
      if (keywords.includes('headache')) {
        conditions.push({ name: 'Tension Headache', confidence: 'Possible', confidenceValue: severity === 'Severe' ? 50 : 70, description: 'Common diffuse, mild to moderate pain in your head.' });
        if (severity === 'Severe') conditions.push({ name: 'Migraine', confidence: 'Possible', confidenceValue: 65, description: 'A severe throbbing pain or pulsing sensation.' });
      }
      if (keywords.includes('fever') && keywords.includes('diarrhea')) {
        conditions.push({ name: 'Gastroenteritis (Stomach Flu)', confidence: 'Possible', confidenceValue: 75, description: 'Intestinal infection causing inflammation, fever, and diarrhea.' });
      } else if (keywords.includes('fever')) {
        conditions.push({ name: 'Viral Infection', confidence: 'Possible', confidenceValue: 60, description: 'Common viral illness or flu.' });
      } else if (keywords.includes('diarrhea')) {
        conditions.push({ name: 'Food Poisoning', confidence: 'Less likely', confidenceValue: 45, description: 'Illness caused by eating contaminated food.' });
      }
      if (keywords.includes('shoulder_pain')) {
        if (keywords.includes('chest_pain')) {
          conditions.push({ name: 'Referred Cardiac Pain', confidence: 'Possible', confidenceValue: 80, description: 'Pain originating from the heart felt in the shoulder.' });
        } else {
          conditions.push({ name: 'Frozen Shoulder / Muscle Strain', confidence: 'Possible', confidenceValue: 65, description: 'Stiffness and pain in your shoulder joint.' });
        }
      }
      if (keywords.includes('dizziness')) {
        if (history.includes('hypertension') || history.includes('blood pressure')) {
          conditions.push({ name: 'Blood Pressure Fluctuation', confidence: 'Possible', confidenceValue: 70, description: 'Changes in systemic blood pressure.' });
        } else {
          conditions.push({ name: 'Vertigo / Dehydration', confidence: 'Less likely', confidenceValue: 50, description: 'Balance disorder or lack of sufficient bodily fluids.' });
        }
      }
      if (keywords.includes('chest_pain')) {
        conditions.push({ name: 'Angina or Cardiac Event', confidence: 'Possible', confidenceValue: 70, description: 'Reduced blood flow to the heart muscle. Requires immediate evaluation.' });
        conditions.push({ name: 'Acid Reflux / GERD', confidence: 'Less likely', confidenceValue: 40, description: 'Stomach acid flowing back into the esophagus.' });
      }
      
      if (conditions.length === 0) {
        conditions.push({ name: 'General Medical Condition', confidence: 'Possible', confidenceValue: 50, description: 'Further evaluation is needed to determine the exact cause.' });
      }
    }

    // Merge red flags and home care from multiple symptoms
    const allRedFlags = new Set<string>();
    const allHomeCare = new Set<string>();
    
    keywords.forEach(kw => {
      if (SYMPTOM_DATA[kw]) {
        SYMPTOM_DATA[kw].redFlags.forEach(f => allRedFlags.add(f));
        SYMPTOM_DATA[kw].homeCare.forEach(h => allHomeCare.add(h));
      }
    });

    return { 
      level: levelTitle, 
      color: colorClass, 
      conditions: conditions.sort((a,b)=> b.confidenceValue - a.confidenceValue).slice(0, 4), 
      alert: alertText || undefined,
      redFlags: Array.from(allRedFlags).slice(0, 5),
      homeCare: Array.from(allHomeCare).slice(0, 5),
      action: actionObj,
      parsedContext: {
        symptoms: keywords.length > 0 ? keywords.map(k => k.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())) : ['Unspecified'],
        duration: duration,
        severity: severity
      },
      isFallback
    };
  }
};
