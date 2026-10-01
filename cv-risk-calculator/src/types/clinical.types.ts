export interface ClinicalCalculations {
  bmi: number;
  egfr: number | null;
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
  ascvdRisk: number | null; // PREVENT-ASCVD, never total CVD or a missing-value zero.
  ascvdCategory: 'low' | 'borderline' | 'intermediate' | 'high' | null;
  preventUnavailableReason: string | null;
  ckdStage: number | null;
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
  | 'Not assessed'
  | 'Normal'
  | 'Elevated'
  | 'Stage 1 Hypertension'
  | 'Stage 2 Hypertension'
  | 'Hypertensive Crisis';
