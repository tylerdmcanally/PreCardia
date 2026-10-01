import { BPClassification } from '../../types';

export function classifyBloodPressure(systolic: number, diastolic: number): BPClassification {
  if (!Number.isFinite(systolic) || !Number.isFinite(diastolic) || systolic <= 0 || diastolic <= 0) return 'Not assessed';
  if (systolic >= 180 || diastolic >= 120) {
    return 'Hypertensive Crisis';
  }
  if (systolic >= 140 || diastolic >= 90) {
    return 'Stage 2 Hypertension';
  }
  if (systolic >= 130 || diastolic >= 80) {
    return 'Stage 1 Hypertension';
  }
  if (systolic >= 120 && diastolic < 80) {
    return 'Elevated';
  }
  return 'Normal';
}

export function calculateAverageBP(readings: { systolic: number; diastolic: number }[]): {
  systolic: number;
  diastolic: number;
} {
  if (readings.length === 0) {
    return { systolic: 0, diastolic: 0 };
  }

  const sum = readings.reduce(
    (acc, reading) => ({
      systolic: acc.systolic + reading.systolic,
      diastolic: acc.diastolic + reading.diastolic,
    }),
    { systolic: 0, diastolic: 0 }
  );

  return {
    systolic: Math.round(sum.systolic / readings.length),
    diastolic: Math.round(sum.diastolic / readings.length),
  };
}

export function determineBPTarget(params: {
  hasASCVD: boolean;
  hasDiabetes: boolean;
  hasCKD: boolean;
  totalCVDRisk?: number | null;
}): { systolic: number; diastolic: number; rationale: string } {
  const { hasASCVD, hasDiabetes, hasCKD, totalCVDRisk } = params;
  const isHighRiskByPREVENT = typeof totalCVDRisk === 'number' && totalCVDRisk >= 7.5;
  const highRiskOrClinical = hasASCVD || hasDiabetes || hasCKD || isHighRiskByPREVENT;

  return {
    systolic: 130,
    diastolic: 80,
    rationale: highRiskOrClinical
      ? 'Target <130/80 per 2025 AHA/ACC HTN guideline (clinical CVD/diabetes/CKD or PREVENT 10-year CVD risk ≥7.5%).'
      : 'Target <130/80 per 2025 AHA/ACC HTN guideline for all adults; individualize if frailty/limited life expectancy.',
  };
}
