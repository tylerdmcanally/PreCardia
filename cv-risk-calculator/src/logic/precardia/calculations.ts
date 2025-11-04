// PreCardia Calculation Functions

import { PreCardiaData, RCRIResult, DASIResult, FunctionalCapacityInfo } from '../../types/precardia.types';
import { RCRI_HIGH_RISK_SURGERIES, DASI_WEIGHTS } from './constants';

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
export function calculateDASI(data: PreCardiaData): DASIResult {
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
    score: dasiScore,
    vo2peak,
    mets
  };
}

// Calculate eGFR using CKD-EPI equation
export function calculateEGFR(creatinine: number, age: number, sex: string): number | null {
  if (!creatinine || !age || !sex || creatinine <= 0 || age <= 0) {
    return null;
  }

  let egfr: number;

  if (sex === 'female') {
    if (creatinine <= 0.7) {
      egfr = 144 * Math.pow(creatinine / 0.7, -0.329) * Math.pow(0.993, age);
    } else {
      egfr = 144 * Math.pow(creatinine / 0.7, -1.209) * Math.pow(0.993, age);
    }
  } else {
    // Male or other (use male formula)
    if (creatinine <= 0.9) {
      egfr = 141 * Math.pow(creatinine / 0.9, -0.411) * Math.pow(0.993, age);
    } else {
      egfr = 141 * Math.pow(creatinine / 0.9, -1.209) * Math.pow(0.993, age);
    }
  }

  // Cap at maximum of 150
  if (egfr > 150) {
    egfr = 150;
  }

  return Math.round(egfr * 10) / 10; // Round to 1 decimal place
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
  if (data.ischemicHeartDisease) {
    score++;
    riskFactors.push('Ischemic heart disease');
  }
  if (data.heartFailure) {
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
  if (data.renalDysfunction || (data.creatinine && data.creatinine > 2.0)) {
    score++;
    riskFactors.push('Renal dysfunction');
  }

  // High-risk surgery (6th factor)
  if (RCRI_HIGH_RISK_SURGERIES.has(data.surgeryType)) {
    score++;
    riskFactors.push('High-risk surgery (intraperitoneal, intrathoracic, or suprainguinal vascular)');
  }

  // Determine MACE risk based on RCRI score
  let maceRisk: string;
  let riskLevel: string;

  if (score === 0) {
    maceRisk = '0.4%';
    riskLevel = 'Very Low';
  } else if (score === 1) {
    maceRisk = '0.9%';
    riskLevel = 'Low';
  } else if (score === 2) {
    maceRisk = '6.6%';
    riskLevel = 'Moderate';
  } else {
    maceRisk = '11.0%';
    riskLevel = 'High';
  }

  return {
    score,
    riskFactors,
    maceRisk,
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
