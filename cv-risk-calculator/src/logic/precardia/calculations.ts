// PreCardia Calculation Functions

import { PreCardiaData, RCRIResult, DASIResult, FunctionalCapacityInfo } from '../../types/precardia.types';
import { RCRI_HIGH_RISK_SURGERIES, DASI_WEIGHTS, METS_VALUES } from './constants';
import { calculateEGFR as calculateCKDEPI2021 } from '../calculations/egfr';

// Unit conversions
export function convertPoundsToKg(pounds: number): number {
  return pounds * 0.453592;
}

export function convertInchesToCm(inches: number): number {
  return inches * 2.54;
}

export function convertKgToPounds(kg: number): number {
  return kg / 0.453592;
}

export function convertCmToInches(cm: number): number {
  return cm / 2.54;
}

// Calculate DASI score and METs
export function calculateDASI(data: Partial<PreCardiaData>): DASIResult {
  let dasiScore = 0;

  const dasiResponses = [
    data.dasi1, data.dasi2, data.dasi3, data.dasi4, data.dasi5, data.dasi6,
    data.dasi7, data.dasi8, data.dasi9, data.dasi10, data.dasi11, data.dasi12
  ];

  dasiResponses.forEach((response, index) => {
    if (response) {
      dasiScore += DASI_WEIGHTS[index];
    }
  });

  // Calculate VO2peak = (0.43 × DASI score) + 9.6
  const vo2peak = (0.43 * dasiScore) + 9.6;

  // Calculate METs = VO2peak / 3.5
  const mets = vo2peak / 3.5;

  return {
    score: Math.round(dasiScore * 100) / 100,
    vo2peak,
    mets
  };
}

// Use the same race-free CKD-EPI 2021 equation as CV Optimization.
export function calculateEGFR(creatinine: number, age: number, sex: string): number | null {
  if (!Number.isFinite(creatinine) || !Number.isFinite(age) || creatinine <= 0 || age < 18 || (sex !== 'male' && sex !== 'female')) {
    return null;
  }
  return calculateCKDEPI2021(creatinine, age, sex);
}

// Sections 3.2, 4.3, 4.5: DASI <=34 is a separate criterion from estimated METs.
export function getDASIFunctionalCapacity(result: DASIResult): FunctionalCapacityInfo {
  if (result.score <= 34) {
    return { value: result.mets.toFixed(1), description: 'Poor by DASI (score ≤34)', category: 'poor' };
  }
  return getFunctionalCapacityCategory(result.mets);
}

export function assessFunctionalCapacity(data: PreCardiaData): FunctionalCapacityInfo {
  if (data.useDASI && data.dasiCompleted === true) {
    return getDASIFunctionalCapacity(calculateDASI(data));
  }
  const category = data.useDASI ? 'unknown' : data.functionalCapacity || 'unknown';
  return { ...METS_VALUES[category], category };
}

// Get functional capacity category from METs value
export function getFunctionalCapacityCategory(mets: number): FunctionalCapacityInfo {
  if (mets >= 10) {
    return { value: '>10', description: 'Excellent (>10 METs)', category: 'excellent' };
  } else if (mets >= 7) {
    return { value: mets.toFixed(1), description: `Good (${mets.toFixed(1)} METs)`, category: 'good' };
  } else if (mets >= 4) {
    return { value: mets.toFixed(1), description: `Moderate (${mets.toFixed(1)} METs)`, category: 'moderate' };
  } else if (mets > 0) {
    return { value: mets.toFixed(1), description: `Poor (${mets.toFixed(1)} METs)`, category: 'poor' };
  } else {
    return { value: 'Unknown', description: 'Unknown / Unable to assess', category: 'unknown' };
  }
}

// Calculate Revised Cardiac Risk Index (RCRI)
export function calculateRCRI(data: PreCardiaData): RCRIResult {
  let score = 0;
  const riskFactors: string[] = [];

  // RCRI clinical factors (5 factors)
  if (data.ischemicHeartDisease || data.recentMI === 'yes' || data.unstableAngina) {
    score++;
    riskFactors.push('Ischemic heart disease');
  }
  if (data.heartFailure || data.decompensatedHF) {
    score++;
    riskFactors.push('Heart failure');
  }
  if (data.cerebrovascularDisease) {
    score++;
    riskFactors.push('Cerebrovascular disease');
  }
  if (data.diabetesInsulin) {
    score++;
    riskFactors.push('Diabetes requiring insulin');
  }
  if (data.renalDysfunction || (data.creatinine !== undefined && data.creatinine >= 2.0)) {
    score++;
    riskFactors.push('Serum creatinine ≥2.0 mg/dL (2026 guideline Table 4)');
  }

  // High-risk surgery (6th factor)
  if (RCRI_HIGH_RISK_SURGERIES.has(data.surgeryType) || (data.surgeryType === 'other' && data.otherRcriHighRisk === 'yes')) {
    score++;
    riskFactors.push('High-risk surgery (intraperitoneal, intrathoracic, or suprainguinal vascular)');
  }

  // Table 4 / Figure 1 use RCRI >1. Historical RCRI complication rates are
  // not interchangeable with a contemporary individualized 30-day MACE estimate.
  const riskLevel = score > 1 ? 'Elevated by RCRI (>1)' : 'Lower by RCRI (0-1)';

  return {
    score,
    riskFactors,
    riskLevel,
    maxScore: 6
  };
}

// Calculate BMI
export function calculateBMI(weight: number, height: number, unitSystem: 'imperial' | 'metric'): number {
  if (!weight || !height) {
    return 0;
  }

  let weightKg = weight;
  let heightCm = height;

  if (unitSystem === 'imperial') {
    weightKg = convertPoundsToKg(weight);
    heightCm = convertInchesToCm(height);
  }

  const heightM = heightCm / 100;
  return Number((weightKg / (heightM * heightM)).toFixed(1));
}
