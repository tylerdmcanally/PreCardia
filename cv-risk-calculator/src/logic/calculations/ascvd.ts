/**
 * ASCVD Risk Calculator
 * Based on 2013 ACC/AHA Pooled Cohort Equations
 * Reference: Circulation. 2014;129:S49-S73
 */

interface ASCVDInputs {
  age: number;
  sex: 'male' | 'female';
  race: 'white' | 'black' | 'hispanic' | 'asian' | 'other';
  totalCholesterol: number;
  hdl: number;
  systolicBP: number;
  onBPMeds: boolean;
  diabetic: boolean;
  smoker: boolean;
}

export function calculateASCVDRisk(inputs: ASCVDInputs): number {
  const { age, sex, race, totalCholesterol, hdl, systolicBP, onBPMeds, diabetic, smoker } = inputs;

  if (age < 40 || age > 79) {
    return 0;
  }

  const isBlack = race === 'black';
  const isFemale = sex === 'female';

  const lnAge = Math.log(age);
  const lnTotalChol = Math.log(totalCholesterol);
  const lnHDL = Math.log(hdl);
  const lnSBP = onBPMeds ? 0 : Math.log(systolicBP);
  const lnSBPTreated = onBPMeds ? Math.log(systolicBP) : 0;
  const lnAge2 = lnAge * lnAge;
  const lnAgeTotalChol = lnAge * lnTotalChol;
  const lnAgeHDL = lnAge * lnHDL;
  const lnAgeSBP = lnAge * lnSBP;
  const lnAgeSBPTreated = lnAge * lnSBPTreated;
  const lnAgeSmoker = smoker ? lnAge : 0;
  const lnAgeDiabetic = diabetic ? lnAge : 0;

  let coefficients: { [key: string]: number };
  let meanCoefficient: number;
  let baselineSurvival: number;

  if (isFemale && isBlack) {
    coefficients = {
      lnAge: 17.1141,
      lnAge2: 0,
      lnTotalChol: 0.9396,
      lnAgeTotalChol: 0,
      lnHDL: -18.9196,
      lnAgeHDL: 4.4748,
      lnSBPTreated: 29.2907,
      lnAgeSBPTreated: -6.4321,
      lnSBP: 27.8197,
      lnAgeSBP: -6.0873,
      smoker: 0.6908,
      lnAgeSmoker: 0,
      diabetic: 0.8738,
      lnAgeDiabetic: 0,
    };
    meanCoefficient = 86.6081;
    baselineSurvival = 0.95334;
  } else if (isFemale && !isBlack) {
    coefficients = {
      lnAge: -29.799,
      lnAge2: 4.884,
      lnTotalChol: 13.54,
      lnAgeTotalChol: -3.114,
      lnHDL: -13.578,
      lnAgeHDL: 3.149,
      lnSBPTreated: 2.019,
      lnAgeSBPTreated: 0,
      lnSBP: 1.957,
      lnAgeSBP: 0,
      smoker: 7.574,
      lnAgeSmoker: -1.665,
      diabetic: 0.661,
      lnAgeDiabetic: 0,
    };
    meanCoefficient = -29.1817;
    baselineSurvival = 0.96652;
  } else if (!isFemale && isBlack) {
    coefficients = {
      lnAge: 2.469,
      lnAge2: 0,
      lnTotalChol: 0.302,
      lnAgeTotalChol: 0,
      lnHDL: -0.307,
      lnAgeHDL: 0,
      lnSBPTreated: 1.916,
      lnAgeSBPTreated: 0,
      lnSBP: 1.809,
      lnAgeSBP: 0,
      smoker: 0.549,
      lnAgeSmoker: 0,
      diabetic: 0.645,
      lnAgeDiabetic: 0,
    };
    meanCoefficient = 19.5425;
    baselineSurvival = 0.89536;
  } else {
    coefficients = {
      lnAge: 12.344,
      lnAge2: 0,
      lnTotalChol: 11.853,
      lnAgeTotalChol: -2.664,
      lnHDL: -7.99,
      lnAgeHDL: 1.769,
      lnSBPTreated: 1.797,
      lnAgeSBPTreated: 0,
      lnSBP: 1.764,
      lnAgeSBP: 0,
      smoker: 7.837,
      lnAgeSmoker: -1.795,
      diabetic: 0.658,
      lnAgeDiabetic: 0,
    };
    meanCoefficient = 61.1816;
    baselineSurvival = 0.91436;
  }

  const individualSum =
    coefficients.lnAge * lnAge +
    coefficients.lnAge2 * lnAge2 +
    coefficients.lnTotalChol * lnTotalChol +
    coefficients.lnAgeTotalChol * lnAgeTotalChol +
    coefficients.lnHDL * lnHDL +
    coefficients.lnAgeHDL * lnAgeHDL +
    coefficients.lnSBPTreated * lnSBPTreated +
    coefficients.lnAgeSBPTreated * lnAgeSBPTreated +
    coefficients.lnSBP * lnSBP +
    coefficients.lnAgeSBP * lnAgeSBP +
    (smoker ? coefficients.smoker : 0) +
    coefficients.lnAgeSmoker * lnAgeSmoker +
    (diabetic ? coefficients.diabetic : 0) +
    coefficients.lnAgeDiabetic * lnAgeDiabetic;

  const risk = 1 - Math.pow(baselineSurvival, Math.exp(individualSum - meanCoefficient));

  return Math.round(risk * 1000) / 10;
}

export function categorizeASCVDRisk(risk: number): 'low' | 'borderline' | 'intermediate' | 'high' {
  if (risk < 5) return 'low';
  if (risk < 7.5) return 'borderline';
  if (risk < 20) return 'intermediate';
  return 'high';
}
