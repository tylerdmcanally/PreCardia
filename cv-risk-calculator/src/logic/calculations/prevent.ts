/**
 * PREVENT Risk Calculator
 * Based on 2023 AHA PREVENT Equations
 * Reference: Khan SS, et al. Circulation. 2023
 *
 * Coefficients extracted from the preventr R package (MIT Licensed)
 * https://github.com/martingmayer/preventr
 *
 * This implementation uses the base_10yr model for Total CVD risk prediction
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

// PREVENT Base 10-year coefficients for Total CVD
// Extracted from preventr package v0.11.0
const PREVENT_COEFFICIENTS = {
  female: {
    age: 0.7939329,
    nonHDL: 0.0305239,
    hdl: -0.1606857,
    sbpLt110: -0.2394003,
    sbpGte110: 0.3600781,
    diabetes: 0.8667604,
    smoking: 0.5360739,
    bmiLt30: 0,
    bmiGte30: 0,
    egfrLt60: 0.6045917,
    egfrGte60: 0.0433769,
    bpMeds: 0.3151672,
    statin: -0.1477655,
    treatedSBP: -0.0663612,
    treatedNonHDL: 0.1197879,
    ageNonHDL: -0.0819715,
    ageHDL: 0.0306769,
    ageSBP: -0.0946348,
    ageDM: -0.27057,
    ageSmoking: -0.078715,
    ageBMI30: 0,
    ageEGFRLt60: -0.1637806,
    constant: -3.307728,
  },
  male: {
    age: 0.7688528,
    nonHDL: 0.0736174,
    hdl: -0.0954431,
    sbpLt110: -0.4347345,
    sbpGte110: 0.3362658,
    diabetes: 0.7692857,
    smoking: 0.4386871,
    bmiLt30: 0,
    bmiGte30: 0,
    egfrLt60: 0.5378979,
    egfrGte60: 0.0164827,
    bpMeds: 0.288879,
    statin: -0.1337349,
    treatedSBP: -0.0475924,
    treatedNonHDL: 0.150273,
    ageNonHDL: -0.0517874,
    ageHDL: 0.0191169,
    ageSBP: -0.1049477,
    ageDM: -0.2251948,
    ageSmoking: -0.0895067,
    ageBMI30: 0,
    ageEGFRLt60: -0.1543702,
    constant: -3.031168,
  },
};

/**
 * Convert cholesterol from mg/dL to mmol/L
 */
function mgdlToMmol(mgdl: number): number {
  return mgdl / 38.67;
}

/**
 * Calculate PREVENT 10-year Total CVD risk
 */
export function calculatePREVENTRisk(inputs: PREVENTInputs): number {
  const { age, sex, totalCholesterol, hdl, systolicBP, onBPMeds, diabetic, smoker, bmi, egfr, onStatin } = inputs;

  // Age must be between 30-79 for PREVENT equations
  if (age < 30 || age > 79) {
    return 0;
  }

  // Select sex-specific coefficients
  const coef = sex === 'female' ? PREVENT_COEFFICIENTS.female : PREVENT_COEFFICIENTS.male;

  // Convert cholesterol values to mmol/L
  const totalCholMmol = mgdlToMmol(totalCholesterol);
  const hdlMmol = mgdlToMmol(hdl);

  // Calculate non-HDL cholesterol
  const nonHDLMmol = totalCholMmol - hdlMmol;

  // ===== Transform/center all predictor variables =====

  // Age: centered at 55, per 10 years
  const ageCentered = (age - 55) / 10;

  // non-HDL-C: centered at 3.5 mmol/L
  const nonHDLCentered = nonHDLMmol - 3.5;

  // HDL-C: centered at 1.3 mmol/L, per 0.3 mmol/L
  const hdlCentered = (hdlMmol - 1.3) / 0.3;

  // SBP: Piecewise with knot at 110 mmHg
  // SBP <110: centered at 110, per 20 mmHg
  // SBP ≥110: centered at 130, per 20 mmHg
  const sbpLt110 = systolicBP < 110 ? (systolicBP - 110) / 20 : 0;
  const sbpGte110 = systolicBP >= 110 ? (systolicBP - 130) / 20 : 0;

  // BMI: Piecewise with knot at 30 kg/m²
  // BMI <30: centered at 25, per 5 kg/m²
  // BMI ≥30: centered at 30, per 5 kg/m²
  const bmiLt30 = bmi < 30 ? (bmi - 25) / 5 : 0;
  const bmiGte30 = bmi >= 30 ? (bmi - 30) / 5 : 0;

  // eGFR: Piecewise with knot at 60 mL/min/1.73m²
  // eGFR <60: per -15 mL (so we reverse: (60 - egfr) / 15)
  // eGFR ≥60: centered at 90, per -15 mL (so: (90 - egfr) / 15)
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

  // ===== Calculate log odds by multiplying coefficients × predictors =====

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

  // ===== Apply logistic function to convert log odds to probability =====
  // Risk = exp(log_odds) / (1 + exp(log_odds))
  const risk = Math.exp(logOdds) / (1 + Math.exp(logOdds));

  // Return as percentage, rounded to 1 decimal
  return Math.round(risk * 1000) / 10;
}

/**
 * Categorize PREVENT risk
 * Note: PREVENT uses different risk categories than Pooled Cohort
 * Based on European SCORE2 categories adapted for US population
 */
export function categorizePREVENTRisk(risk: number): 'low' | 'borderline' | 'intermediate' | 'high' {
  if (risk < 5) return 'low';
  if (risk < 7.5) return 'borderline';
  if (risk < 20) return 'intermediate';
  return 'high';
}
