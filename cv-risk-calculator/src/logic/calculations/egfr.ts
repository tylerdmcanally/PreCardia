/**
 * eGFR Calculator using CKD-EPI Equation (2021)
 * Reference: NEJM 2021;385:1737-1749
 */

export function calculateEGFR(creatinine: number, age: number, sex: 'male' | 'female'): number {
  const isFemale = sex === 'female';
  const kappa = isFemale ? 0.7 : 0.9;
  const alpha = isFemale ? -0.241 : -0.302;
  const sexFactor = isFemale ? 1.012 : 1;

  const creatinineRatio = creatinine / kappa;
  const minValue = Math.min(creatinineRatio, 1);
  const maxValue = Math.max(creatinineRatio, 1);

  const egfr =
    142 *
    Math.pow(minValue, alpha) *
    Math.pow(maxValue, -1.2) *
    Math.pow(0.9938, age) *
    sexFactor;

  return Math.round(egfr);
}

export function stageCKD(egfr: number): number {
  if (egfr >= 90) return 1;
  if (egfr >= 60) return 2;
  if (egfr >= 30) return 3;
  if (egfr >= 15) return 4;
  return 5;
}
