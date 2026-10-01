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
  const riskCategory = score >= (sex === 'female' ? 3 : 2) ? 'High'
    : score === (sex === 'female' ? 2 : 1) ? 'Moderate' : 'Low';
  return {
    riskCategory,
    // The guideline uses risk strata; do not invent an individualized percentage
    // by multiplying the score. Rates vary substantially across cohorts.
    annualStrokeRisk: riskCategory === 'High' ? '≥2% risk stratum' : riskCategory === 'Moderate' ? '1% to <2% risk stratum' : '<1% risk stratum',
    recommendation: riskCategory === 'Low'
      ? 'Anticoagulation is not routinely indicated by this score alone; aspirin provides no benefit for AF stroke prevention.'
      : riskCategory === 'Moderate' ? 'Oral anticoagulation is reasonable after shared decision-making.'
      : 'Oral anticoagulation is recommended; confirm valve status, bleeding considerations and agent-specific dosing.',
  };
}
