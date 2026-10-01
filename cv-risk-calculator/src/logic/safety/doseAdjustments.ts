import { PatientData, ClinicalCalculations, SafetyCheckResult } from '../../types';
import { GUIDELINES } from '../../data/guidelines';
import { getDOACMedications, getMetformin } from './utils';
import { calculateCreatinineClearance, getApixabanAFDose } from '../calculations/anticoagulantDosing';

export function getDoseAdjustmentAlerts(patientData: PatientData, calculations: ClinicalCalculations): SafetyCheckResult[] {
  const alerts: SafetyCheckResult[] = [];
  const egfr = calculations.egfr;
  const metformin = getMetformin(patientData.medications);
  if (metformin && !patientData.history.dialysis && egfr !== null && egfr >= 30 && egfr < 45) alerts.push({domain:'DIABETES_CARDIORENAL',source:'DOSE_ADJUSTMENT',recommendation:{
    priority:'HIGH',action:'ADJUST',medication:metformin.genericName,recommendedDose:'Limit existing therapy to 1000mg total per day',
    rationale:`eGFR ${egfr}: review benefit/risk of continuing metformin; ADA/KDIGO recommends 1000mg/day at eGFR 30–44. US labeling does not recommend new initiation in this range.`,
    evidence:`${GUIDELINES.ADA_2026}; ${GUIDELINES.KDIGO_2022}; ${GUIDELINES.DRUG_LABELS}`,monitoring:'Reassess kidney function every 3–6 months and during acute illness; discontinue at eGFR <30.'}});
  const crcl = calculateCreatinineClearance(patientData);
  for (const med of getDOACMedications(patientData.medications)) {
    const afDose = /apixaban/i.test(med.genericName) && patientData.history.atrialFibrillation
      && patientData.history.afValveStatus === 'none' && !patientData.history.dialysis && crcl !== null && crcl >= 15
      ? getApixabanAFDose(patientData) : null;
    alerts.push({domain:'ANTIPLATELET_ANTICOAGULATION',source:'DOSE_ADJUSTMENT',recommendation:{
      priority:crcl === null || crcl < 30 || patientData.history.dialysis ? 'HIGH' : 'LOW',action:'EVALUATE',medication:`${med.genericName} dose / indication`,
      recommendedDose:afDose ? `${afDose} is the usual US AF dose if no interacting-drug adjustment is required` : undefined,
      rationale:crcl === null ? 'Age, weight and serum creatinine are needed for Cockcroft–Gault creatinine clearance; do not substitute missing data or indexed eGFR.'
        : `Estimated Cockcroft–Gault CrCl ${crcl.toFixed(1)} mL/min; verify renal stability and weight choice at extremes of body size. Dosing is agent-, indication- and interaction-specific.`,
      evidence:`${GUIDELINES.AFIB_2023}; ${GUIDELINES.DRUG_LABELS}`,
      monitoring:'Confirm indication (AF versus VTE), valve history, age/weight, renal function and interactions before any dose change. Do not automatically stop apixaban solely for dialysis.',
      additionalNotes:afDose ? 'For nonvalvular AF, apixaban is reduced when at least two apply: age ≥80, weight ≤60kg, serum creatinine ≥1.5mg/dL. eGFR <30 alone is not the US dose-reduction rule.' : 'Consult current US prescribing information; do not use a non-US AF dose or transfer VTE dose criteria to AF.'}});
  }
  return alerts;
}
