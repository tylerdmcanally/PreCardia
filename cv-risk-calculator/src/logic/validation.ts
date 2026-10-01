import { PatientData } from '../types';

export function validateCVPatient(patient: PatientData): string[] {
  const errors: string[] = [];
  const d = patient.demographics;
  if (!Number.isInteger(d.age) || d.age < 18 || d.age > 120) errors.push('Enter an adult age between 18 and 120 years.');
  if (!['male','female'].includes(d.sex)) errors.push('Select sex for the validated equations.');
  const hasHeight = d.heightFeet !== 0 || d.heightInches !== 0;
  if (hasHeight !== (d.weightLbs !== 0)) errors.push('Provide both height and weight, or leave both blank.');
  if (![d.heightFeet,d.heightInches,d.weightLbs].every(Number.isFinite) || d.heightFeet < 0 || d.heightInches < 0 || d.heightInches >= 12 || d.weightLbs < 0) errors.push('Enter valid height and weight values (inches 0–11).');
  for (const [index,bp] of patient.bpReadings.entries()) {
    if (![bp.systolic,bp.diastolic].every(Number.isFinite) || bp.systolic <= 0 || bp.diastolic <= 0 || bp.systolic <= bp.diastolic) errors.push(`BP reading ${index+1}: provide positive systolic and diastolic values, with systolic greater than diastolic.`);
  }
  for (const [label,value] of Object.entries(patient.labs)) {
    if (value === undefined || typeof value === 'string') continue;
    if (!Number.isFinite(value) || (label === 'uacr' ? value < 0 : value <= 0)) errors.push(`Enter a valid ${label} value, or leave it blank.`);
  }
  if (patient.labs.hdl !== undefined && patient.labs.totalCholesterol !== undefined && patient.labs.hdl > patient.labs.totalCholesterol) errors.push('HDL cannot exceed total cholesterol.');
  const ef = patient.history.ejectionFraction;
  if (patient.history.heartFailure && ef !== undefined && (!Number.isFinite(ef) || ef <= 0 || ef > 100)) errors.push('Enter EF greater than 0 and no more than 100%, or leave it unknown.');
  if (patient.medications.some(m=>!m.genericName.trim() || !m.dose.trim() || !m.frequency.trim())) errors.push('Complete medication name, dose and frequency for each entry, or remove the incomplete entry.');
  if (patient.allergies.some(a=>!a.medication.trim() || !a.reaction.trim())) errors.push('Complete each allergy medication and reaction.');
  return errors;
}
