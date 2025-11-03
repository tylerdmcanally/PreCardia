import { BPClassification } from '../../types';

export function classifyBloodPressure(systolic: number, diastolic: number): BPClassification {
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
  ascvdRisk?: number;
}): { systolic: number; diastolic: number; rationale: string } {
  const { hasASCVD, hasDiabetes, hasCKD, ascvdRisk } = params;

  if (hasASCVD || hasDiabetes || hasCKD || (ascvdRisk && ascvdRisk >= 10)) {
    return {
      systolic: 130,
      diastolic: 80,
      rationale: 'Target <130/80 per 2017 ACC/AHA (high CV risk or clinical ASCVD)',
    };
  }

  return {
    systolic: 130,
    diastolic: 80,
    rationale: 'Target <130/80 per 2017 ACC/AHA guideline',
  };
}
