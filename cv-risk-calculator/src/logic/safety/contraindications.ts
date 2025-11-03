import { PatientData, ClinicalCalculations, DomainRecommendation } from '../../types';
import { GUIDELINES } from '../../data/guidelines';
import { SafetyCheckResult } from '../../types';
import {
  describeMedicationList,
  findFirstMedicationByCategory,
  findMedicationByKeywords,
  formatMedicationLabel,
  getDOACMedications,
  getMetformin,
  getMRAMedications,
  getRAASMedications,
  getNSAIDMedications,
  poundsToKilograms,
  RAAS_CATEGORIES,
} from './utils';

export function getContraindicationAlerts(
  patientData: PatientData,
  calculations: ClinicalCalculations
): SafetyCheckResult[] {
  const alerts: SafetyCheckResult[] = [];
  const potassium = patientData.labs.potassium ?? 0;
  const egfr = calculations.egfr;
  const raasMedications = getRAASMedications(patientData.medications);
  const firstRAASMedication = findFirstMedicationByCategory(patientData.medications, RAAS_CATEGORIES);

  if (raasMedications.length > 0 && potassium > 5.5) {
    alerts.push({
      domain: 'BLOOD_PRESSURE',
      source: 'CONTRAINDICATION',
      recommendation: {
        priority: 'HIGH',
        action: 'HOLD',
        medication: formatMedicationLabel(firstRAASMedication, 'RAAS inhibitor'),
        recommendedDose: 'N/A',
        rationale: `SEVERE HYPERKALEMIA: K+ ${potassium.toFixed(1)} mEq/L while on RAAS inhibition. Risk of life-threatening arrhythmia.`,
        evidence: GUIDELINES.BP_2017,
        monitoring:
          'HOLD all ACE-I/ARB/ARNI agents. Recheck BMP in 3-5 days after addressing reversible causes (diet, K+ supplements, renal function).',
        additionalNotes:
          'Consider potassium binder (patiromer or SZC) and nephrology consultation to maintain GDMT once potassium is controlled.',
      },
    });
  }

  if (raasMedications.length > 0 && egfr > 0 && egfr < 30) {
    alerts.push({
      domain: 'BLOOD_PRESSURE',
      source: 'CONTRAINDICATION',
      recommendation: {
        priority: 'HIGH',
        action: 'ADJUST',
        medication: formatMedicationLabel(firstRAASMedication, 'RAAS inhibitor'),
        recommendedDose: 'N/A',
        rationale: `ADVANCED CKD: eGFR ${egfr.toFixed(0)} mL/min/1.73m2 on RAAS inhibition. High risk of acute kidney injury and hyperkalemia.`,
        evidence: GUIDELINES.BP_2017,
        monitoring:
          'Close monitoring required: check BMP weekly for 1 month, then monthly. Hold if creatinine increases >30% from baseline or potassium >5.5.',
        additionalNotes:
          'Evaluate for nephrology referral and potassium binder support. Consider lower dosing or alternative strategies if renal function declines further.',
      },
    });
  }

  const metformin = getMetformin(patientData.medications);
  if (metformin && egfr > 0 && egfr < 30) {
    alerts.push({
      domain: 'DIABETES_CARDIORENAL',
      source: 'CONTRAINDICATION',
      recommendation: {
        priority: 'HIGH',
        action: 'DISCONTINUE',
        medication: formatMedicationLabel(metformin, 'Metformin'),
        recommendedDose: 'N/A',
        rationale: `CONTRAINDICATED: Metformin with eGFR ${egfr.toFixed(0)} mL/min/1.73m2. Elevated risk of lactic acidosis.`,
        evidence: GUIDELINES.ADA_2024,
        monitoring:
          'Discontinue immediately. Recheck renal function in 1 week. Transition to alternate therapy (consider insulin, SGLT2i if eGFR ≥20, or DPP-4 inhibitor).',
        additionalNotes: 'Metformin is contraindicated when eGFR <30. If eGFR improves to ≥30, reassess candidacy at reduced dosing.',
      },
    });
  }

  const nsaids = getNSAIDMedications(patientData.medications);
  if (nsaids.length > 0) {
    const nsaidList = describeMedicationList(nsaids, 'NSAID');

    if (patientData.history.heartFailure) {
      alerts.push({
        domain: 'HEART_FAILURE',
        source: 'CONTRAINDICATION',
        recommendation: {
          priority: 'HIGH',
          action: 'DISCONTINUE',
          medication: nsaidList,
          recommendedDose: 'N/A',
          rationale:
            'NSAIDs promote sodium/water retention and blunt diuretic response, precipitating HF decompensation. Avoid in patients with heart failure.',
          evidence: GUIDELINES.HF_2022,
          monitoring: 'Stop NSAID and monitor weight, edema, and symptoms. Emphasize acetaminophen or topical agents for pain control.',
          additionalNotes: 'Chronic NSAID use doubles HF hospitalization risk. Engage PCP/pain management for alternative therapy.',
        },
      });
    }

    if (getRAASMedications(patientData.medications).length > 0 || getMRAMedications(patientData.medications).length > 0) {
      alerts.push({
        domain: 'BLOOD_PRESSURE',
        source: 'CONTRAINDICATION',
        recommendation: {
          priority: 'MODERATE',
          action: 'ADJUST',
          medication: nsaidList,
          recommendedDose: 'Minimize dose/duration; consider discontinuation',
          rationale:
            'NSAIDs + RAAS blockade +/- diuretics increase risk of acute kidney injury, hyperkalemia, and loss of BP control ("triple whammy").',
          evidence: GUIDELINES.BP_2017,
          monitoring: 'If NSAID necessary, use lowest dose short-term; monitor BMP (Cr/K+) within 1 week and reassess BP control.',
          additionalNotes: 'Consider PPI for GI protection if NSAID absolutely required. Educate patient to avoid OTC NSAIDs.',
        },
      });
    }

    const onAntithrombotic =
      getDOACMedications(patientData.medications).length > 0 ||
      patientData.medications.some((med) => med.category === 'Antiplatelet') ||
      Boolean(findMedicationByKeywords(patientData.medications, ['warfarin'])) ||
      Boolean(findMedicationByKeywords(patientData.medications, ['aspirin']));

    if (onAntithrombotic) {
      alerts.push({
        domain: 'ANTIPLATELET_ANTICOAGULATION',
        source: 'CONTRAINDICATION',
        recommendation: {
          priority: 'HIGH',
          action: 'ADJUST',
          medication: nsaidList,
          recommendedDose: 'Avoid chronic NSAID use',
          rationale: 'NSAIDs substantially increase GI bleeding risk when combined with anticoagulants or antiplatelet therapy.',
          evidence: GUIDELINES.AFIB_PCI_2020,
          monitoring: 'Use acetaminophen or topical agents instead. If NSAID unavoidable, add PPI and limit to shortest course.',
          additionalNotes: 'Discuss bleeding warning signs (melena, hematemesis, anemia) and ensure gastroprotection strategy.',
        },
      });
    }
  }

  const mraMedications = getMRAMedications(patientData.medications);
  if (mraMedications.length > 0) {
    const targetMeds = describeMedicationList(mraMedications, 'MRA');
    if (potassium >= 5.5) {
      alerts.push({
        domain: 'HEART_FAILURE',
        source: 'CONTRAINDICATION',
        recommendation: {
          priority: 'HIGH',
          action: 'HOLD',
          medication: targetMeds,
          recommendedDose: 'N/A',
          rationale: `SEVERE HYPERKALEMIA: K+ ${potassium.toFixed(1)} mEq/L on MRA therapy.`,
          evidence: GUIDELINES.HF_2022,
          monitoring:
            'Hold MRA immediately. Reassess potassium within 48-72 hours. Resume only when K+ <5.0 and underlying factors addressed.',
          additionalNotes:
            'Evaluate diet, diuretic regimen, and consider potassium binder therapy. Persistent hyperkalemia warrants cardiology/nephrology input.',
        },
      });
    } else if (potassium >= 5.0) {
      alerts.push({
        domain: 'HEART_FAILURE',
        source: 'CONTRAINDICATION',
        recommendation: {
          priority: 'HIGH',
          action: 'ADJUST',
          medication: targetMeds,
          recommendedDose: 'N/A',
          rationale: `HYPERKALEMIA RISK: K+ ${potassium.toFixed(1)} mEq/L on MRA therapy.`,
          evidence: GUIDELINES.HF_2022,
          monitoring:
            'Check potassium within 3 days, then weekly until stable. Reduce dose or hold if potassium continues to rise or exceeds 5.5.',
          additionalNotes: 'Consider potassium binder to maintain MRA therapy when clinically indicated.',
        },
      });
    }

    if (egfr > 0 && egfr < 30) {
      alerts.push({
        domain: 'HEART_FAILURE',
        source: 'CONTRAINDICATION',
        recommendation: {
          priority: 'HIGH',
          action: 'DISCONTINUE',
          medication: targetMeds,
          recommendedDose: 'N/A',
          rationale: `CONTRAINDICATED: eGFR ${egfr.toFixed(0)} mL/min/1.73m2 on MRA therapy. High risk of life-threatening hyperkalemia.`,
          evidence: GUIDELINES.HF_2022,
          monitoring:
            'Discontinue MRA. Monitor renal function and potassium periodically. Reassess candidacy if renal function improves above threshold.',
          additionalNotes: 'Consider nephrology referral for advanced CKD management.',
        },
      });
    }
  }

  const doacMedications = getDOACMedications(patientData.medications);
  if (doacMedications.length > 0 && egfr > 0 && egfr < 15) {
    const medicationList = describeMedicationList(doacMedications, 'DOAC');
    alerts.push({
      domain: 'ANTIPLATELET_ANTICOAGULATION',
      source: 'CONTRAINDICATION',
      recommendation: {
        priority: 'HIGH',
        action: 'DISCONTINUE',
        medication: medicationList,
        recommendedDose: 'N/A',
        rationale: `CONTRAINDICATED: DOAC with eGFR ${egfr.toFixed(0)} mL/min/1.73m2. Drug accumulation leads to life-threatening bleeding risk.`,
        evidence: GUIDELINES.AFIB_2019,
        monitoring:
          'Stop DOAC immediately. Consider transition to warfarin with INR monitoring or left atrial appendage closure. Consult cardiology/hematology.',
        additionalNotes:
          'Apixaban, rivaroxaban, edoxaban, and dabigatran all require renal clearance and are not recommended in severe renal failure.',
      },
    });
  }

  const prasugrel = findMedicationByKeywords(patientData.medications, ['prasugrel']);
  if (prasugrel) {
    const { history, demographics } = patientData;
    const age = demographics.age;
    const weightKg = poundsToKilograms(demographics.weightLbs);

    if (history.stroke || history.tia) {
      alerts.push({
        domain: 'ANTIPLATELET_ANTICOAGULATION',
        source: 'CONTRAINDICATION',
        recommendation: {
          priority: 'HIGH',
          action: 'DISCONTINUE',
          medication: formatMedicationLabel(prasugrel, 'Prasugrel'),
          recommendedDose: 'N/A',
          rationale:
            'CONTRAINDICATED: Prasugrel is contraindicated in patients with prior stroke or TIA due to markedly increased fatal/intracranial bleeding risk.',
          evidence: GUIDELINES.AFIB_PCI_2020,
          monitoring:
            'Switch to clopidogrel 75mg daily or ticagrelor 90mg BID depending on PCI indication. Document contraindication clearly in EMR.',
          additionalNotes: 'TRITON-TIMI 38 trial showed net harm when prasugrel used after prior stroke/TIA.',
        },
      });
    } else if (age > 75 || (weightKg > 0 && weightKg < 60)) {
      alerts.push({
        domain: 'ANTIPLATELET_ANTICOAGULATION',
        source: 'CONTRAINDICATION',
        recommendation: {
          priority: 'MODERATE',
          action: 'ADJUST',
          medication: formatMedicationLabel(prasugrel, 'Prasugrel'),
          recommendedDose: '5mg daily or switch to clopidogrel',
          rationale: `Bleeding risk elevated with prasugrel in ${
            age > 75 ? 'patients >75 years' : 'weight <60 kg'
          }. Reduced dosing (5mg) or alternative agent is recommended.`,
          evidence: GUIDELINES.AFIB_PCI_2020,
          monitoring: 'Closely monitor for bleeding (GI, bruising, hematuria). Reassess need for prasugrel at cardiology follow-up.',
          additionalNotes:
            'Consider clopidogrel for most patients unless very high ischemic risk (e.g., large thrombus, diabetes) and bleeding risk acceptable.',
        },
      });
    }
  }

  return alerts;
}

export function hasRAASSafetyHold(patientData: PatientData, calculations: ClinicalCalculations): boolean {
  const potassium = patientData.labs.potassium ?? 0;
  const egfr = calculations.egfr;
  if (potassium > 5.5) return true;
  if (egfr > 0 && egfr < 30) return true;
  return false;
}

export function hasMRASafetyHold(patientData: PatientData, calculations: ClinicalCalculations): boolean {
  const potassium = patientData.labs.potassium ?? 0;
  const egfr = calculations.egfr;
  if (potassium >= 5.0) return true;
  if (egfr > 0 && egfr < 30) return true;
  return false;
}
