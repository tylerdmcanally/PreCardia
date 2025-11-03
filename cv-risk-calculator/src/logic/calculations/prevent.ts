/**
 * PREVENT Risk Calculator
 * Based on 2023 AHA PREVENT Equations
 * Reference: Khan SS, et al. Circulation. 2023
 *
 * Coefficients extracted from the preventr R package (MIT Licensed)
 * https://github.com/martingmayer/preventr
 *
 * This implementation uses the base_10yr model for all 5 outcomes:
 * - Total CVD
 * - ASCVD (atherosclerotic cardiovascular disease)
 * - Heart Failure
 * - CHD (coronary heart disease / CAD)
 * - Stroke
 */

interface PREVENTInputs {
  age: number;
  sex: 'male' | 'female';
  totalCholesterol: number; // mg/dL
  hdl: number; // mg/dL
  systolicBP: number;
  onBPMeds: boolean;
  diabetic: boolean;
  smoker: boolean;
  bmi: number;
  egfr: number;
  onStatin: boolean;
}

export interface PREVENTRisks {
  totalCVD: number;
  ascvd: number;
  heartFailure: number;
  cad: number;
  stroke: number;
}

// PREVENT Base 10-year coefficients for all 5 outcomes
// Extracted from preventr package v0.11.0
const PREVENT_COEFFICIENTS = {
  female: {
    total_cvd: { age: 0.7939329, nonHDL: 0.0305239, hdl: -0.1606857, sbpLt110: -0.2394003, sbpGte110: 0.3600781, diabetes: 0.8667604, smoking: 0.5360739, bmiLt30: 0, bmiGte30: 0, egfrLt60: 0.6045917, egfrGte60: 0.0433769, bpMeds: 0.3151672, statin: -0.1477655, treatedSBP: -0.0663612, treatedNonHDL: 0.1197879, ageNonHDL: -0.0819715, ageHDL: 0.0306769, ageSBP: -0.0946348, ageDM: -0.27057, ageSmoking: -0.078715, ageBMI30: 0, ageEGFRLt60: -0.1637806, constant: -3.307728 },
    ascvd: { age: 0.719883, nonHDL: 0.1176967, hdl: -0.151185, sbpLt110: -0.0835358, sbpGte110: 0.3592852, diabetes: 0.8348585, smoking: 0.4831078, bmiLt30: 0, bmiGte30: 0, egfrLt60: 0.4864619, egfrGte60: 0.0397779, bpMeds: 0.2265309, statin: -0.0592374, treatedSBP: -0.0395762, treatedNonHDL: 0.0844423, ageNonHDL: -0.0567839, ageHDL: 0.0325692, ageSBP: -0.1035985, ageDM: -0.2417542, ageSmoking: -0.0791142, ageBMI30: 0, ageEGFRLt60: -0.1671492, constant: -3.819975 },
    heart_failure: { age: 0.8998235, nonHDL: 0, hdl: 0, sbpLt110: -0.4559771, sbpGte110: 0.3576505, diabetes: 1.038346, smoking: 0.583916, bmiLt30: -0.0072294, bmiGte30: 0.2997706, egfrLt60: 0.7451638, egfrGte60: 0.0557087, bpMeds: 0.3534442, statin: 0, treatedSBP: -0.0981511, treatedNonHDL: 0, ageNonHDL: 0, ageHDL: 0, ageSBP: -0.0946663, ageDM: -0.3581041, ageSmoking: -0.1159453, ageBMI30: -0.003878, ageEGFRLt60: -0.1884289, constant: -4.310409 },
    chd: { age: 0.7587146, nonHDL: 0.1810949, hdl: -0.2014507, sbpLt110: -0.0881827, sbpGte110: 0.3547731, diabetes: 0.9045358, smoking: 0.5410917, bmiLt30: 0, bmiGte30: 0, egfrLt60: 0.5198725, egfrGte60: 0.0325935, bpMeds: 0.2010642, statin: -0.036195, treatedSBP: -0.0891238, treatedNonHDL: 0.0750716, ageNonHDL: -0.0683256, ageHDL: 0.0484755, ageSBP: -0.0898086, ageDM: -0.2569041, ageSmoking: -0.0786607, ageBMI30: 0, ageEGFRLt60: -0.1597513, constant: -4.608751 },
    stroke: { age: 0.6907849, nonHDL: 0.0534279, hdl: -0.1055109, sbpLt110: -0.113078, sbpGte110: 0.3665217, diabetes: 0.8013721, smoking: 0.4187039, bmiLt30: 0, bmiGte30: 0, egfrLt60: 0.4539767, egfrGte60: 0.0515087, bpMeds: 0.2494624, statin: -0.0798829, treatedSBP: -0.0079039, treatedNonHDL: 0.0833101, ageNonHDL: -0.0409242, ageHDL: 0.016994, ageSBP: -0.1191213, ageDM: -0.2480549, ageSmoking: -0.0998063, ageBMI30: 0, ageEGFRLt60: -0.1759075, constant: -4.409199 },
  },
  male: {
    total_cvd: { age: 0.7688528, nonHDL: 0.0736174, hdl: -0.0954431, sbpLt110: -0.4347345, sbpGte110: 0.3362658, diabetes: 0.7692857, smoking: 0.4386871, bmiLt30: 0, bmiGte30: 0, egfrLt60: 0.5378979, egfrGte60: 0.0164827, bpMeds: 0.288879, statin: -0.1337349, treatedSBP: -0.0475924, treatedNonHDL: 0.150273, ageNonHDL: -0.0517874, ageHDL: 0.0191169, ageSBP: -0.1049477, ageDM: -0.2251948, ageSmoking: -0.0895067, ageBMI30: 0, ageEGFRLt60: -0.1543702, constant: -3.031168 },
    ascvd: { age: 0.7099847, nonHDL: 0.1658663, hdl: -0.1144285, sbpLt110: -0.2837212, sbpGte110: 0.3239977, diabetes: 0.7189597, smoking: 0.3956973, bmiLt30: 0, bmiGte30: 0, egfrLt60: 0.3690075, egfrGte60: 0.0203619, bpMeds: 0.2036522, statin: -0.0865581, treatedSBP: -0.0322916, treatedNonHDL: 0.114563, ageNonHDL: -0.0300005, ageHDL: 0.0232747, ageSBP: -0.0927024, ageDM: -0.2018525, ageSmoking: -0.0970527, ageBMI30: 0, ageEGFRLt60: -0.1217081, constant: -3.500655 },
    heart_failure: { age: 0.8972642, nonHDL: 0, hdl: 0, sbpLt110: -0.6811466, sbpGte110: 0.3634461, diabetes: 0.923776, smoking: 0.5023736, bmiLt30: -0.0485841, bmiGte30: 0.3726929, egfrLt60: 0.6926917, egfrGte60: 0.0251827, bpMeds: 0.2980922, statin: 0, treatedSBP: -0.0497731, treatedNonHDL: 0, ageNonHDL: 0, ageHDL: 0, ageSBP: -0.1289201, ageDM: -0.3040924, ageSmoking: -0.1401688, ageBMI30: 0.0068126, ageEGFRLt60: -0.1797778, constant: -3.946391 },
    chd: { age: 0.7423283, nonHDL: 0.2572109, hdl: -0.1820374, sbpLt110: -0.3174515, sbpGte110: 0.312778, diabetes: 0.7485249, smoking: 0.3912047, bmiLt30: 0, bmiGte30: 0, egfrLt60: 0.376487, egfrGte60: 0.0193687, bpMeds: 0.1588199, statin: -0.0494555, treatedSBP: -0.0577851, treatedNonHDL: 0.0809765, ageNonHDL: -0.0517872, ageHDL: 0.0489033, ageSBP: -0.0850404, ageDM: -0.2107552, ageSmoking: -0.1206397, ageBMI30: 0, ageEGFRLt60: -0.07795, constant: -4.156753 },
    stroke: { age: 0.722513, nonHDL: 0.0263348, hdl: -0.0248959, sbpLt110: -0.268104, sbpGte110: 0.3474634, diabetes: 0.684699, smoking: 0.3874844, bmiLt30: 0, bmiGte30: 0, egfrLt60: 0.3877827, egfrGte60: 0.0201965, bpMeds: 0.232963, statin: -0.1178935, treatedSBP: 0.0120926, treatedNonHDL: 0.155739, ageNonHDL: 0.0141928, ageHDL: -0.0111745, ageSBP: -0.1155391, ageDM: -0.2123743, ageSmoking: -0.0824133, ageBMI30: 0, ageEGFRLt60: -0.180789, constant: -4.20881 },
  },
};

/**
 * Convert cholesterol from mg/dL to mmol/L
 */
function mgdlToMmol(mgdl: number): number {
  return mgdl / 38.67;
}

/**
 * Calculate PREVENT risk for a specific outcome type
 */
function calculateRiskForOutcome(inputs: PREVENTInputs, outcome: string): number {
  const { age, sex, totalCholesterol, hdl, systolicBP, onBPMeds, diabetic, smoker, bmi, egfr, onStatin } = inputs;

  // Age must be between 30-79 for PREVENT equations
  if (age < 30 || age > 79) {
    return 0;
  }

  // Select sex-specific coefficients for this outcome
  const coef = (PREVENT_COEFFICIENTS[sex] as any)[outcome];

  // Convert cholesterol values to mmol/L
  const totalCholMmol = mgdlToMmol(totalCholesterol);
  const hdlMmol = mgdlToMmol(hdl);
  const nonHDLMmol = totalCholMmol - hdlMmol;

  // ===== Transform/center all predictor variables =====

  // Age: centered at 55, per 10 years
  const ageCentered = (age - 55) / 10;

  // non-HDL-C: centered at 3.5 mmol/L
  const nonHDLCentered = nonHDLMmol - 3.5;

  // HDL-C: centered at 1.3 mmol/L, per 0.3 mmol/L
  const hdlCentered = (hdlMmol - 1.3) / 0.3;

  // SBP: Piecewise with knot at 110 mmHg
  const sbpLt110 = systolicBP < 110 ? (systolicBP - 110) / 20 : 0;
  const sbpGte110 = systolicBP >= 110 ? (systolicBP - 130) / 20 : 0;

  // BMI: Piecewise with knot at 30 kg/m²
  const bmiLt30 = bmi < 30 ? (bmi - 25) / 5 : 0;
  const bmiGte30 = bmi >= 30 ? (bmi - 30) / 5 : 0;

  // eGFR: Piecewise with knot at 60 mL/min/1.73m²
  const egfrLt60 = egfr < 60 ? (60 - egfr) / 15 : 0;
  const egfrGte60 = egfr >= 60 ? (90 - egfr) / 15 : 0;

  // Binary variables
  const diabetesVal = diabetic ? 1 : 0;
  const smokingVal = smoker ? 1 : 0;
  const bpMedsVal = onBPMeds ? 1 : 0;
  const statinVal = onStatin ? 1 : 0;

  // Interaction terms
  const treatedSBP = onBPMeds ? sbpGte110 : 0;
  const treatedNonHDL = onStatin ? nonHDLCentered : 0;
  const ageNonHDL = ageCentered * nonHDLCentered;
  const ageHDL = ageCentered * hdlCentered;
  const ageSBP = ageCentered * sbpGte110;
  const ageDM = ageCentered * diabetesVal;
  const ageSmoking = ageCentered * smokingVal;
  const ageBMI30 = ageCentered * bmiGte30;
  const ageEGFRLt60 = ageCentered * egfrLt60;

  // ===== Calculate log odds =====
  const logOdds =
    coef.constant +
    coef.age * ageCentered +
    coef.nonHDL * nonHDLCentered +
    coef.hdl * hdlCentered +
    coef.sbpLt110 * sbpLt110 +
    coef.sbpGte110 * sbpGte110 +
    coef.diabetes * diabetesVal +
    coef.smoking * smokingVal +
    coef.bmiLt30 * bmiLt30 +
    coef.bmiGte30 * bmiGte30 +
    coef.egfrLt60 * egfrLt60 +
    coef.egfrGte60 * egfrGte60 +
    coef.bpMeds * bpMedsVal +
    coef.statin * statinVal +
    coef.treatedSBP * treatedSBP +
    coef.treatedNonHDL * treatedNonHDL +
    coef.ageNonHDL * ageNonHDL +
    coef.ageHDL * ageHDL +
    coef.ageSBP * ageSBP +
    coef.ageDM * ageDM +
    coef.ageSmoking * ageSmoking +
    coef.ageBMI30 * ageBMI30 +
    coef.ageEGFRLt60 * ageEGFRLt60;

  // ===== Apply logistic function =====
  const risk = Math.exp(logOdds) / (1 + Math.exp(logOdds));

  // Return as percentage, rounded to 1 decimal
  return Math.round(risk * 1000) / 10;
}

/**
 * Calculate all 5 PREVENT risk outcomes
 */
export function calculateAllPREVENTRisks(inputs: PREVENTInputs): PREVENTRisks {
  return {
    totalCVD: calculateRiskForOutcome(inputs, 'total_cvd'),
    ascvd: calculateRiskForOutcome(inputs, 'ascvd'),
    heartFailure: calculateRiskForOutcome(inputs, 'heart_failure'),
    cad: calculateRiskForOutcome(inputs, 'chd'),
    stroke: calculateRiskForOutcome(inputs, 'stroke'),
  };
}

/**
 * Calculate PREVENT 10-year Total CVD risk (backward compatibility)
 */
export function calculatePREVENTRisk(inputs: PREVENTInputs): number {
  return calculateRiskForOutcome(inputs, 'total_cvd');
}

/**
 * Categorize PREVENT risk
 */
export function categorizePREVENTRisk(risk: number): 'low' | 'borderline' | 'intermediate' | 'high' {
  if (risk < 5) return 'low';
  if (risk < 7.5) return 'borderline';
  if (risk < 20) return 'intermediate';
  return 'high';
}
