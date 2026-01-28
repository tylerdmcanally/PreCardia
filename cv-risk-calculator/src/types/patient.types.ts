export interface PatientDemographics {
  age: number;
  sex: 'male' | 'female';
  race: 'white' | 'black' | 'hispanic' | 'asian' | 'other';
  heightFeet: number;
  heightInches: number;
  weightLbs: number;
  smokingStatus: 'current' | 'former' | 'never';
}

export interface MedicalHistory {
  hypertension: boolean;
  hypertensionYears?: number;
  diabetes: boolean;
  diabetesYears?: number;
  ckd: boolean;
  dialysis?: boolean;
  ckdStage?: 1 | 2 | 3 | 4 | 5;
  cad: boolean;
  priorMI: boolean;
  priorPCI: boolean;
  pciTiming?: '<3 months' | '3-6 months' | '6-12 months' | '>12 months';
  stroke: boolean;
  tia: boolean;
  pad: boolean;
  hyperlipidemia: boolean;
  heartFailure: boolean;
  ejectionFraction?: number;
  atrialFibrillation: boolean;
}

export type MedicationCategory =
  | 'ACE Inhibitor'
  | 'ARB'
  | 'ARNI'
  | 'Beta Blocker'
  | 'Calcium Channel Blocker'
  | 'Diuretic - Thiazide'
  | 'Diuretic - Loop'
  | 'MRA'
  | 'Statin'
  | 'Antiplatelet'
  | 'Anticoagulant'
  | 'Diabetes - Metformin'
  | 'Diabetes - SGLT2i'
  | 'Diabetes - GLP-1 RA'
  | 'GI Protection - PPI'
  | 'Other';

export interface Medication {
  id: string;
  genericName: string;
  dose: string;
  frequency: string;
  category: MedicationCategory;
}

export interface Allergy {
  id: string;
  medication: string;
  reaction: string;
}

export interface LabValues {
  creatinine?: number;
  egfr?: number;
  creatinineDate?: string;
  potassium?: number;
  sodium?: number;
  totalCholesterol?: number;
  ldl?: number;
  hdl?: number;
  triglycerides?: number;
  lipidDate?: string;
  a1c?: number;
  a1cDate?: string;
  uacr?: number;
  uacrDate?: string;
}

export interface BPReading {
  systolic: number;
  diastolic: number;
  date?: string;
}

export interface PatientData {
  demographics: PatientDemographics;
  history: MedicalHistory;
  medications: Medication[];
  allergies: Allergy[];
  labs: LabValues;
  bpReadings: BPReading[];
}
