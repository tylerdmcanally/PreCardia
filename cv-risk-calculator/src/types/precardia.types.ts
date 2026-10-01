// PreCardia Type Definitions

export interface PreCardiaData {
  // Demographics
  age: number;
  sex: 'male' | 'female' | 'other';
  weight: number;
  height: number;
  unitSystem: 'imperial' | 'metric';

  // Active Cardiac Conditions
  unstableAngina: boolean;
  decompensatedHF: boolean;
  significantArrhythmia: boolean;
  severeValvularDisease: boolean;
  cardiovascularSymptoms?: boolean;
  newOrWorseningDyspnea?: boolean;
  valvularHeartDisease?: boolean;
  valvularType?: 'aortic-stenosis' | 'aortic-regurgitation' | 'mitral-stenosis' | 'mitral-regurgitation' | 'tricuspid' | 'pulmonary' | 'multiple';
  valvularSeverity?: 'mild' | 'moderate' | 'severe';

  // Medical History (RCRI Factors)
  ischemicHeartDisease: boolean;
  heartFailure: boolean;
  cerebrovascularDisease: boolean;
  strokeTiming?: 'lt3mo' | 'ge3mo' | 'unknown';
  diabetesInsulin: boolean;
  renalDysfunction: boolean;

  // Additional History
  hypertension: boolean;
  atrialFibrillation: boolean;
  diabetes: boolean;
  ckd: boolean;
  copd: boolean;
  sleepApnea: boolean;
  obesity: boolean;
  currentSmoker: boolean;
  pulmonaryHypertension?: boolean;
  congenitalHeartDisease?: boolean;

  // Recent Cardiac Interventions
  recentMI: 'yes' | 'no';
  miTiming?: '' | 'lt4w' | '4to8w' | 'gt8w' | 'unknown';
  stentType?: '' | 'bms' | 'des' | 'none';
  stentTiming?: '' | 'lt2w' | '2to4w' | '4to12w' | 'gt12w';
  // Legacy week ranges above are retained for old callers; never infer months from them.
  pciTiming?: 'le30d' | 'gt30d-lt3mo' | '3to6mo' | '6to12mo' | 'ge12mo' | 'unknown';
  pciIndication?: 'acs' | 'ccd' | 'unknown';
  antiplateletInterruption?: 'yes' | 'no' | 'unknown';
  balloonAngioplasty?: boolean;
  balloonTiming?: 'lt14d' | 'ge14d' | 'unknown';
  cabg: 'yes' | 'no';
  cabgTiming?: '' | 'lt6w' | '6wto3mo' | 'gt3mo';
  tavrTavi: 'yes' | 'no';
  tavrTiming?: '' | 'lt4w' | 'gt4w' | 'unknown';
  teer?: 'yes' | 'no';
  teerTiming?: '' | 'lt4w' | 'gt4w' | 'unknown';

  // Lab Values
  creatinine?: number;
  bnp?: number;
  ntproBNP?: number;
  troponin?: number;
  troponinAssay?: string;
  troponinUpperLimit?: number;

  // Medications
  betaBlocker: boolean;
  statin: boolean;
  aceARB: boolean;
  raasIndication?: 'hypertension' | 'hfref' | 'other' | 'unknown';
  bloodPressureControlled?: boolean;
  newBetaBlockerIndication?: boolean;
  sglt2i: boolean;
  anticoagulant: boolean;
  antiplatelet?: boolean;

  // Functional Capacity
  functionalCapacity?: 'excellent' | 'good' | 'moderate' | 'poor' | 'unknown';
  useDASI?: boolean;
  dasiCompleted?: boolean;
  dasi1?: boolean;
  dasi2?: boolean;
  dasi3?: boolean;
  dasi4?: boolean;
  dasi5?: boolean;
  dasi6?: boolean;
  dasi7?: boolean;
  dasi8?: boolean;
  dasi9?: boolean;
  dasi10?: boolean;
  dasi11?: boolean;
  dasi12?: boolean;

  // Surgical Details
  surgeryType: string;
  otherSurgery?: string;
  surgeryUrgency: 'emergency' | 'urgent' | 'time-sensitive' | 'elective';
  otherSurgeryRisk?: 'low' | 'elevated' | 'unknown';
  otherRcriHighRisk?: 'yes' | 'no' | 'unknown';
  estimatedMaceRisk?: number;
  riskCalculator?: 'acs-nsqip' | 'gupta-mica';
  estimatedBloodLoss?: string;
  anesthesiaType?: string;

  // Additional Clinical
  frailtyScore?: number;
  clinicalNotes?: string;
  hasCIED?: boolean;
  pacemaker?: boolean;
  icd?: boolean;
  crt?: boolean;
  ciedInterrogation?: 'recent' | 'needed' | 'not-needed';
  afibType?: 'paroxysmal' | 'persistent' | 'long-standing-persistent' | 'permanent' | 'new-onset';
  afibRateControl?: boolean;
  afibRhythmControl?: boolean;
}

export interface SurgicalRisk {
  level: 'Low' | 'Intermediate' | 'High' | 'Variable';
  risk: string;
  description: string;
}

export interface RCRIResult {
  score: number;
  riskFactors: string[];
  riskLevel: string;
  maxScore: number;
}

export interface DASIResult {
  score: number;
  vo2peak: number;
  mets: number;
}

export interface FunctionalCapacityInfo {
  value: string;
  description: string;
  category: 'excellent' | 'good' | 'moderate' | 'poor' | 'unknown';
}

export interface PreCardiaRecommendations {
  general: string[];
  testing: string[];
  medications: string[];
  testingPrinciples: string[];
}

export interface PreCardiaReport {
  rcri: RCRIResult;
  surgeryRisk: SurgicalRisk;
  functionalCapacity: FunctionalCapacityInfo;
  recommendations: PreCardiaRecommendations;
  egfr?: number;
  bmi?: number;
}
