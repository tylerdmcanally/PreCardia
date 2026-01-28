import { PatientData, ClinicalCalculations } from '../../types';
import { GUIDELINES } from '../../data/guidelines';
import { SafetyCheckResult } from '../../types';
import {
  describeMedicationList,
  formatMedicationLabel,
  findMedicationByKeywords,
  getDOACMedications,
  getMetformin,
  poundsToKilograms,
} from './utils';

export function getDoseAdjustmentAlerts(
  patientData: PatientData,
  calculations: ClinicalCalculations
): SafetyCheckResult[] {
  const alerts: SafetyCheckResult[] = [];
  const onDialysis = Boolean(patientData.history.dialysis);
  const egfr = calculations.egfr;
  const metformin = getMetformin(patientData.medications);

  if (onDialysis) {
    return alerts;
  }

  if (metformin && egfr >= 30 && egfr < 45) {
    alerts.push({
      domain: 'DIABETES_CARDIORENAL',
      source: 'DOSE_ADJUSTMENT',
      recommendation: {
        priority: 'HIGH',
        action: 'ADJUST',
        medication: `${metformin.genericName} ${metformin.dose}`.trim(),
        recommendedDose: 'Max 1000mg twice daily',
        rationale: `eGFR ${egfr.toFixed(0)} mL/min/1.73m2 requires metformin dose limitation to mitigate lactic acidosis risk.`,
        evidence: GUIDELINES.ADA_2024,
        monitoring: 'Limit total daily dose to ≤2000mg. Reassess renal function every 3-6 months.',
        additionalNotes: 'Hold metformin before iodinated contrast procedures; resume 48 hours later if renal function stable.',
      },
    });
  }

  const doacMedications = getDOACMedications(patientData.medications);
  const handledDoacIds = new Set<string>();

  const apixaban = findMedicationByKeywords(patientData.medications, ['apixaban']);
  if (apixaban && egfr >= 15 && egfr < 30) {
    alerts.push({
      domain: 'ANTIPLATELET_ANTICOAGULATION',
      source: 'DOSE_ADJUSTMENT',
      recommendation: {
        priority: 'HIGH',
        action: 'ADJUST',
        medication: formatMedicationLabel(apixaban, 'Apixaban'),
        recommendedDose: '2.5mg twice daily',
        rationale: `Renal impairment (eGFR ${egfr.toFixed(0)} mL/min/1.73m2) requires apixaban dose reduction per labeling (CrCl 15-29 or if ≥2 of age ≥80, weight ≤60kg, Cr ≥1.5).`,
        evidence: GUIDELINES.AFIB_2019,
        monitoring:
          'Monitor renal function every 3-6 months and assess for bleeding. Consider HAS-BLED score to reassess risk-benefit.',
        additionalNotes: 'Ensure patient meets dose-reduction criteria; if renal function declines <15, transition to warfarin or non-pharmacologic stroke prevention.',
      },
    });
    handledDoacIds.add(apixaban.id);
  }

  const rivaroxaban = findMedicationByKeywords(patientData.medications, ['rivaroxaban']);
  if (rivaroxaban && egfr >= 15 && egfr < 30) {
    alerts.push({
      domain: 'ANTIPLATELET_ANTICOAGULATION',
      source: 'DOSE_ADJUSTMENT',
      recommendation: {
        priority: 'HIGH',
        action: 'SWITCH',
        medication: formatMedicationLabel(rivaroxaban, 'Rivaroxaban'),
        recommendedDose: 'Consider apixaban 2.5mg BID or warfarin',
        rationale: `Rivaroxaban is not recommended when eGFR/CrCl <30 (current ${egfr.toFixed(
          0
        )}). Alternative anticoagulant preferred to avoid accumulation and bleeding.`,
        evidence: GUIDELINES.AFIB_2019,
        monitoring: 'Transition with minimal interruption; monitor INR closely if switching to warfarin.',
        additionalNotes: 'ROCKET-AF excluded CrCl <30. Use apixaban with dose adjustment or warfarin for severe CKD.',
      },
    });
    handledDoacIds.add(rivaroxaban.id);
  }

  const edoxaban = findMedicationByKeywords(patientData.medications, ['edoxaban']);
  if (edoxaban) {
    const weightKg = poundsToKilograms(patientData.demographics.weightLbs);
    if (egfr >= 15 && egfr <= 50) {
      alerts.push({
        domain: 'ANTIPLATELET_ANTICOAGULATION',
        source: 'DOSE_ADJUSTMENT',
        recommendation: {
          priority: 'HIGH',
          action: 'ADJUST',
          medication: formatMedicationLabel(edoxaban, 'Edoxaban'),
          recommendedDose: '30mg once daily',
          rationale: `Edoxaban requires dose reduction to 30mg once daily when eGFR/CrCl is between 15-50 mL/min (current ${egfr.toFixed(0)}).`,
          evidence: GUIDELINES.AFIB_2019,
          monitoring: 'Reassess renal function every 3 months. If CrCl >95, avoid edoxaban due to reduced efficacy.',
          additionalNotes: 'ENGAGE AF-TIMI 48 trial utilized reduced dose 30mg for CrCl 30-50 or weight ≤60kg.',
        },
      });
      handledDoacIds.add(edoxaban.id);
    } else if (weightKg > 0 && weightKg <= 60) {
      alerts.push({
        domain: 'ANTIPLATELET_ANTICOAGULATION',
        source: 'DOSE_ADJUSTMENT',
        recommendation: {
          priority: 'MODERATE',
          action: 'ADJUST',
          medication: formatMedicationLabel(edoxaban, 'Edoxaban'),
          recommendedDose: '30mg once daily',
          rationale: 'Weight ≤60 kg requires edoxaban dose reduction to 30mg daily to avoid bleeding (per FDA labeling).',
          evidence: GUIDELINES.AFIB_2019,
          monitoring: 'Monitor for bleeding and reassess weight/renal function annually.',
          additionalNotes: 'Ensure patient not receiving full-dose 60mg while ≤60kg. Consider apixaban if adherence to weight-based dosing uncertain.',
        },
      });
      handledDoacIds.add(edoxaban.id);
    }
  }

  const dabigatran = findMedicationByKeywords(patientData.medications, ['dabigatran']);
  if (dabigatran && egfr >= 15 && egfr <= 50) {
    const age = patientData.demographics.age;
    let recommendedDose = '';
    let rationale = '';
    let priority: 'HIGH' | 'MODERATE' = 'MODERATE';

    if (egfr >= 15 && egfr <= 30) {
      recommendedDose = '75mg twice daily';
      rationale = `Renal impairment (eGFR ${egfr.toFixed(0)} mL/min/1.73m2) requires dabigatran 75mg BID to avoid accumulation (per FDA label).`;
      priority = 'HIGH';
    } else if (egfr > 30 && egfr <= 50 && age > 75) {
      recommendedDose = 'Consider 110mg twice daily';
      rationale = `Elderly patient (age >75) with eGFR ${egfr.toFixed(0)} has higher bleeding risk; consider 110mg BID (EMA-approved, RE-LY data).`;
    }

    if (recommendedDose) {
      alerts.push({
        domain: 'ANTIPLATELET_ANTICOAGULATION',
        source: 'DOSE_ADJUSTMENT',
        recommendation: {
          priority,
          action: 'ADJUST',
          medication: formatMedicationLabel(dabigatran, 'Dabigatran'),
          recommendedDose,
          rationale,
          evidence: GUIDELINES.AFIB_2019,
          monitoring: 'Monitor renal function every 3 months and watch for dyspepsia/bleeding. Contraindicated if CrCl <15.',
          additionalNotes: 'RE-LY trial utilized 110mg BID outside US. Discuss risks/benefits with cardiology if considering lower dose in elderly.',
        },
      });
      handledDoacIds.add(dabigatran.id);
    }
  }

  const remainingDoacs = doacMedications.filter((med) => !handledDoacIds.has(med.id));
  if (remainingDoacs.length > 0 && egfr >= 15 && egfr < 30) {
    const medicationList = describeMedicationList(remainingDoacs, 'DOAC');
    alerts.push({
      domain: 'ANTIPLATELET_ANTICOAGULATION',
      source: 'DOSE_ADJUSTMENT',
      recommendation: {
        priority: 'HIGH',
        action: 'ADJUST',
        medication: medicationList,
        recommendedDose: 'Review agent-specific renal dosing or switch to warfarin',
        rationale: `Moderate renal impairment (eGFR ${egfr.toFixed(0)} mL/min/1.73m2) requires DOAC dose adjustment or alternative therapy.`,
        evidence: GUIDELINES.AFIB_2019,
        monitoring:
          'Monitor renal function every 3 months and assess bleeding risk. Consult cardiology/hematology for complex anticoagulation scenarios.',
        additionalNotes:
          'Ensure dosing aligns with FDA labeling. Consider apixaban (with renal dose) or warfarin if uncertainty exists.',
      },
    });
  }

  return alerts;
}
