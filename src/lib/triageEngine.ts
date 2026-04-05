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
    symptom: string;
    duration: string;
    severity: string;
  };
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
  }
};

export const triageEngine = {
  analyzeText(text: string): { keywords: string[], questions: Question[] } {
    const t = text.toLowerCase();
    const keywords: string[] = [];
    const questions: Question[] = [];

    // Map to normalized categories
    if (t.includes('head') || t.includes('headache') || t.includes('migraine')) keywords.push('headache');
    else if (t.includes('fever') || t.includes('temperature') || t.includes('hot')) keywords.push('fever');
    else if (t.includes('chest') || t.includes('heart')) keywords.push('chest_pain');
    else if (t.includes('cough')) keywords.push('cough');
    else if (t.includes('breathe') || t.includes('breath') || t.includes('shortness')) keywords.push('breathing_difficulty');
    else if (t.includes('stomach') || t.includes('belly') || t.includes('abdomen') || t.includes('pain')) keywords.push('stomach_pain');
    else if (t.includes('dizz') || t.includes('lightheaded') || t.includes('faint')) keywords.push('dizziness');
    else if (t.includes('rash') || t.includes('skin') || t.includes('itch')) keywords.push('skin_rash');

    // Always ask generic questions to ensure we have duration and severity
    questions.push({ id: 'duration', text: 'How long have you had these symptoms?', options: ['1 day', '1-3 days', 'More than 3 days'] });
    questions.push({ id: 'severity', text: 'How severe is your condition?', options: ['Mild', 'Moderate', 'Severe'] });

    return { keywords, questions };
  },

  calculateResult(keywords: string[], answers: Record<string, string>, context: UserContext): TriageResult {
    const symptom = keywords[0] || 'Unknown';
    const duration = answers['duration'] || '1 day';
    const severity = answers['severity'] || 'Mild';
    
    const age = parseInt(context.age) || 30;
    const history = (context.history || '').toLowerCase();
    const hasExistingCondition = history.length > 3 && history !== 'none' && history !== 'no';
    const hasHypertension = history.includes('hypertension') || history.includes('blood pressure');
    const hasDiabetes = history.includes('diabetes');

    let urgencyLevel = 0; // 0=Green, 1=Yellow, 2=Orange, 3=Red

    // A. Triage Logic (MANDATORY RULES)
    const isRed = 
      symptom === 'chest_pain' || 
      symptom === 'breathing_difficulty' || 
      (symptom === 'dizziness' && age > 50 && hasHypertension) ||
      (severity === 'Severe' && hasExistingCondition);

    const isOrange = 
      !isRed && 
      ((['Moderate', 'Severe'].includes(severity) && hasExistingCondition) || duration === 'More than 3 days');

    const isYellow = 
      !isRed && !isOrange && 
      (['Mild', 'Moderate'].includes(severity) && !hasExistingCondition && ['1 day', '1-3 days'].includes(duration));

    const isGreen = 
      !isRed && !isOrange && !isYellow && 
      (severity === 'Mild' && duration === '1 day' && !hasExistingCondition);

    if (isRed) urgencyLevel = 3;
    else if (isOrange) urgencyLevel = 2;
    else if (isYellow) urgencyLevel = 1;
    else if (isGreen) urgencyLevel = 0; // fallback is Green/Yellow depending on inputs. We will assign 0 for green.
    else urgencyLevel = 1; // Default fallback to yellow

    // Alert Generation
    let alert = '';
    if (symptom === 'dizziness' && hasHypertension && duration !== '1 day') {
      alert = 'You have a history of hypertension. Dizziness for multiple days may indicate blood pressure fluctuation. Check BP immediately.';
    } else if (hasDiabetes && symptom === 'fever') {
      alert = 'Fever in diabetic patients can affect blood sugar levels. Monitor your glucose closely.';
    }

    // B. Condition Mapping
    const conditions: Condition[] = [];

    if (symptom === 'headache') {
      if (severity === 'Severe') {
        conditions.push({ name: 'Migraine', confidence: 'Most likely', confidenceValue: 80, description: 'A severe throbbing pain or pulsing sensation.' });
        conditions.push({ name: 'Tension Headache', confidence: 'Possible', confidenceValue: 60, description: 'Mild to moderate pain, often described as a tight band.' });
        if (hasHypertension) conditions.push({ name: 'Hypertensive Crisis', confidence: 'Less likely', confidenceValue: 45, description: 'Severe elevation in blood pressure causing headache.' });
        else conditions.push({ name: 'Sinusitis', confidence: 'Less likely', confidenceValue: 40, description: 'Inflammation of the sinuses causing facial pain and headache.' });
      } else {
        conditions.push({ name: 'Tension Headache', confidence: 'Most likely', confidenceValue: 75, description: 'Common diffuse, mild to moderate pain in your head.' });
        conditions.push({ name: 'Dehydration', confidence: 'Possible', confidenceValue: 65, description: 'Lack of adequate fluids leading to headache.' });
        conditions.push({ name: 'Sinusitis', confidence: 'Less likely', confidenceValue: 45, description: 'Inflammation of the sinuses causing facial pain.' });
      }
    } else if (symptom === 'chest_pain') {
      if (hasDiabetes || hasHypertension || age > 50) {
        conditions.push({ name: 'Angina or Ischemia', confidence: 'Most likely', confidenceValue: 80, description: 'Reduced blood flow to the heart muscle.' });
        conditions.push({ name: 'Acid Reflux / GERD', confidence: 'Possible', confidenceValue: 55, description: 'Stomach acid flowing back into the esophagus.' });
        conditions.push({ name: 'Muscle Strain', confidence: 'Less likely', confidenceValue: 35, description: 'Strain of the muscles in the chest wall.' });
      } else {
        conditions.push({ name: 'Muscle Strain', confidence: 'Most likely', confidenceValue: 75, description: 'Strain of the muscles in the chest wall.' });
        conditions.push({ name: 'Acid Reflux / GERD', confidence: 'Possible', confidenceValue: 65, description: 'Stomach acid flowing back into the esophagus.' });
        conditions.push({ name: 'Angina', confidence: 'Less likely', confidenceValue: 30, description: 'Reduced blood flow to the heart muscle.' });
      }
    } else if (symptom === 'fever') {
      conditions.push({ name: 'Viral Infection', confidence: 'Most likely', confidenceValue: 80, description: 'Common cold or seasonal viral illness.' });
      conditions.push({ name: 'Influenza (Flu)', confidence: 'Possible', confidenceValue: 60, description: 'A common viral infection that can be severe.' });
      if (duration === 'More than 3 days') {
        conditions.push({ name: 'Bacterial Infection', confidence: 'Less likely', confidenceValue: 45, description: 'Infection requiring antibiotic treatment.' });
      } else {
        conditions.push({ name: 'Infection-related illness', confidence: 'Less likely', confidenceValue: 35, description: 'Body fighting off a mild pathogen.' });
      }
    } else if (symptom === 'dizziness') {
      if (hasHypertension) {
        conditions.push({ name: 'Blood Pressure Fluctuation', confidence: 'Most likely', confidenceValue: 85, description: 'Changes in systemic blood pressure.' });
        conditions.push({ name: 'Medication Side Effect', confidence: 'Possible', confidenceValue: 65, description: 'Adverse reaction to prescribed drugs.' });
        conditions.push({ name: 'Dehydration', confidence: 'Less likely', confidenceValue: 40, description: 'Lack of sufficient bodily fluids.' });
      } else {
        conditions.push({ name: 'Vertigo / Inner Ear Issue', confidence: 'Most likely', confidenceValue: 75, description: 'Balance disorder originating in the inner ear.' });
        conditions.push({ name: 'Dehydration', confidence: 'Possible', confidenceValue: 60, description: 'Lack of sufficient bodily fluids.' });
        conditions.push({ name: 'Hypoglycemia', confidence: 'Less likely', confidenceValue: 45, description: 'Low blood sugar levels.' });
      }
    } else if (symptom === 'stomach_pain') {
      conditions.push({ name: 'Gastroenteritis', confidence: 'Most likely', confidenceValue: 75, description: 'Intestinal infection causing inflammation.' });
      conditions.push({ name: 'Indigestion / Acid Reflux', confidence: 'Possible', confidenceValue: 60, description: 'Discomfort in the upper abdomen.' });
      conditions.push({ name: 'Food Poisoning', confidence: 'Less likely', confidenceValue: 45, description: 'Illness caused by eating contaminated food.' });
    } else if (symptom === 'breathing_difficulty') {
      conditions.push({ name: 'Asthma Exacerbation', confidence: 'Most likely', confidenceValue: 70, description: 'Airways narrow and swell, producing extra mucus.' });
      conditions.push({ name: 'Respiratory Infection', confidence: 'Possible', confidenceValue: 65, description: 'Infection of the lungs or airways.' });
      conditions.push({ name: 'Anxiety / Panic Attack', confidence: 'Less likely', confidenceValue: 40, description: 'Sudden episode of intense fear triggering severe physical reactions.' });
    } else if (symptom === 'cough') {
      conditions.push({ name: 'Upper Respiratory Infection', confidence: 'Most likely', confidenceValue: 80, description: 'Common cold or upper airway viral infection.' });
      conditions.push({ name: 'Bronchitis', confidence: 'Possible', confidenceValue: 60, description: 'Inflammation of the lining of your bronchial tubes.' });
      conditions.push({ name: 'Allergies', confidence: 'Less likely', confidenceValue: 40, description: 'Immune system reaction to an allergen.' });
    } else if (symptom === 'skin_rash') {
      conditions.push({ name: 'Contact Dermatitis', confidence: 'Most likely', confidenceValue: 75, description: 'Red, itchy rash caused by direct contact with a substance.' });
      conditions.push({ name: 'Allergic Reaction', confidence: 'Possible', confidenceValue: 60, description: 'Systemic or local reaction to an allergen.' });
      conditions.push({ name: 'Viral Exanthem', confidence: 'Less likely', confidenceValue: 45, description: 'Rash caused by a viral infection.' });
    }

    // Assembly
    const baseSymptomData = SYMPTOM_DATA[symptom] || { redFlags: [], homeCare: [] };
    const readableSymptom = symptom.replace('_', ' ');

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

    return { 
      level: levelTitle, 
      color: colorClass, 
      conditions: conditions.slice(0, 3).sort((a,b)=> b.confidenceValue - a.confidenceValue), 
      alert: alert || undefined,
      redFlags: baseSymptomData.redFlags,
      homeCare: baseSymptomData.homeCare,
      action: actionObj,
      parsedContext: {
        symptom: readableSymptom.charAt(0).toUpperCase() + readableSymptom.slice(1),
        duration: duration,
        severity: severity
      }
    };
  }
};

