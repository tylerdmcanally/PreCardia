import { PatientData } from '../../types';

/** Cockcroft–Gault CrCl in mL/min (not indexed eGFR). Confirm weight choice in extremes of body size. */
export function calculateCreatinineClearance(patient: PatientData): number | null {
  const { age, sex, weightLbs } = patient.demographics;
  const creatinine = patient.labs.creatinine;
  if (!creatinine || creatinine <= 0 || age < 18 || age >= 140 || weightLbs <= 0
    || ![creatinine, age, weightLbs].every(Number.isFinite)) return null;
  return ((140-age) * (weightLbs / 2.20462) * (sex === 'female' ? 0.85 : 1)) / (72 * creatinine);
}

/** US nonvalvular-AF dose only. Other indications use different dosing rules. */
export function getApixabanAFDose(patient: PatientData): string | null {
  if (calculateCreatinineClearance(patient) === null) return null;
  const criteria = [patient.demographics.age >= 80, patient.demographics.weightLbs / 2.20462 <= 60,
    patient.labs.creatinine! >= 1.5].filter(Boolean).length;
  return criteria >= 2 ? '2.5mg twice daily' : '5mg twice daily';
}
