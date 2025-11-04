export interface ClinicalCalculations {
  bmi: number;
  egfr: number;
  averageBP: { systolic: number; diastolic: number };
  bpClassification: BPClassification;
  bpTarget: { systolic: number; diastolic: number; rationale: string };
  preventRisks: {
    // 10-year risks
    totalCVD_10yr: number | null;
    ascvd_10yr: number | null;
    heartFailure_10yr: number | null;
    // 30-year risks (only for ages 30-59)
    totalCVD_30yr: number | null;
    ascvd_30yr: number | null;
    heartFailure_30yr: number | null;
  };
  ascvdRisk: number; // Kept for backward compatibility - equals preventRisks.totalCVD_10yr || 0
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
