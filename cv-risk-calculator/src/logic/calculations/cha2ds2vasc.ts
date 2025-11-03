/**
 * CHA2DS2-VASc Score Calculator for Atrial Fibrillation
 * Used to assess stroke risk and guide anticoagulation therapy
 */

export interface CHA2DS2VAScInputs {
  age: number;
  sex: 'male' | 'female';
  heartFailure: boolean;
  hypertension: boolean;
  diabetes: boolean;
  priorStroke: boolean;
  priorTIA: boolean;
  vascularDisease: boolean; // Prior MI, PAD, or aortic plaque
}

export function calculateCHA2DS2VASc(inputs: CHA2DS2VAScInputs): number {
  let score = 0;

  // C: Congestive heart failure (1 point)
  if (inputs.heartFailure) score += 1;

  // H: Hypertension (1 point)
  if (inputs.hypertension) score += 1;

  // A2: Age ≥75 years (2 points)
  if (inputs.age >= 75) {
    score += 2;
  }
  // A: Age 65-74 years (1 point)
  else if (inputs.age >= 65) {
    score += 1;
  }

  // D: Diabetes (1 point)
  if (inputs.diabetes) score += 1;

  // S2: Prior stroke or TIA (2 points)
  if (inputs.priorStroke || inputs.priorTIA) score += 2;

  // V: Vascular disease (1 point)
  if (inputs.vascularDisease) score += 1;

  // Sc: Sex category - female (1 point)
  if (inputs.sex === 'female') score += 1;

  return score;
}

export function interpretCHA2DS2VASc(
  score: number,
  sex: 'male' | 'female'
): {
  riskCategory: 'Low' | 'Moderate' | 'High';
  annualStrokeRisk: string;
  recommendation: string;
} {
  // For males: 0 = low, 1 = moderate, ≥2 = high
  // For females: 1 = low (0 points after removing sex point), 2 = moderate, ≥3 = high
  // But we calculate with sex included, so:
  // Males: 0 = low, 1 = moderate, ≥2 = high
  // Females: ≤1 = low, 2 = moderate, ≥3 = high

  if (sex === 'male') {
    if (score === 0) {
      return {
        riskCategory: 'Low',
        annualStrokeRisk: '0-0.2%',
        recommendation: 'No anticoagulation recommended. May consider aspirin.',
      };
    } else if (score === 1) {
      return {
        riskCategory: 'Moderate',
        annualStrokeRisk: '0.6-2.2%',
        recommendation: 'Consider oral anticoagulation based on patient preference and bleeding risk.',
      };
    } else {
      return {
        riskCategory: 'High',
        annualStrokeRisk: score === 2 ? '2.2%' : `${score * 1.5}%`,
        recommendation: 'Oral anticoagulation recommended (DOAC preferred over warfarin).',
      };
    }
  } else {
    // Female
    if (score <= 1) {
      return {
        riskCategory: 'Low',
        annualStrokeRisk: '0-0.6%',
        recommendation: 'No anticoagulation recommended. May consider aspirin.',
      };
    } else if (score === 2) {
      return {
        riskCategory: 'Moderate',
        annualStrokeRisk: '2.2%',
        recommendation: 'Consider oral anticoagulation based on patient preference and bleeding risk.',
      };
    } else {
      return {
        riskCategory: 'High',
        annualStrokeRisk: `${score * 1.5}%`,
        recommendation: 'Oral anticoagulation recommended (DOAC preferred over warfarin).',
      };
    }
  }
}
