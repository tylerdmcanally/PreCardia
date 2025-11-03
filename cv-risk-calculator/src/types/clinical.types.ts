export interface ClinicalCalculations {
  bmi: number;
  egfr: number;
  averageBP: { systolic: number; diastolic: number };
  bpClassification: BPClassification;
  bpTarget: { systolic: number; diastolic: number; rationale: string };
  ascvdRisk: number;
  ascvdCategory: 'low' | 'borderline' | 'intermediate' | 'high';
  ckdStage: number;
  ldlGoal: number;
  a1cGoal: number;
  cha2ds2vasc?: {
    score: number;
    riskCategory: 'Low' | 'Moderate' | 'High';
    annualStrokeRisk: string;
    recommendation: string;
  };
}

export type BPClassification =
  | 'Normal'
  | 'Elevated'
  | 'Stage 1 Hypertension'
  | 'Stage 2 Hypertension'
  | 'Hypertensive Crisis';
