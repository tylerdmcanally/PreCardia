import { PatientData, ClinicalCalculations } from '../../types';
import { GUIDELINES } from '../../data/guidelines';
import { SafetyCheckResult } from '../../types';
import {
  describeMedicationList,
  findFirstMedicationByCategory,
  findMedicationByKeywords,
  formatMedicationLabel,
  getDOACMedications,
  getMedicationsByCategory,
  getMetformin,
  getMRAMedications,
  getRAASMedications,
  getNSAIDMedications,
  poundsToKilograms,
  RAAS_CATEGORIES,
  hasAllergyToAnyCategory,
} from './utils';

export function getContraindicationAlerts(
  patientData: PatientData,
  calculations: ClinicalCalculations
): SafetyCheckResult[] {
  const alerts: SafetyCheckResult[] = [];
  const onDialysis = Boolean(patientData.history.dialysis);
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
        evidence: GUIDELINES.BP_2025,
        monitoring:
          'Promptly assess and confirm hyperkalemia, including ECG/urgent treatment when indicated. Review reversible causes and the RAAS plan; do not defer severe hyperkalemia to routine follow-up.',
        additionalNotes:
          'Consider potassium binder (patiromer or SZC) and nephrology consultation to maintain GDMT once potassium is controlled.',
      },
    });
  }

  if (raasMedications.length > 0 && egfr !== null && egfr < 30) {
    alerts.push({ domain: 'BLOOD_PRESSURE', source: 'CONTRAINDICATION', recommendation: {
      priority: 'HIGH', action: 'EVALUATE', medication: formatMedicationLabel(firstRAASMedication, 'RAAS inhibitor'),
      rationale: `eGFR ${egfr.toFixed(0)} on RAAS therapy: review renal trajectory, potassium and tolerability. A low eGFR alone is not a reason to stop established ACE-I/ARB therapy.`,
      evidence: GUIDELINES.CKD_2024,
      monitoring: 'Assess acute kidney injury, symptomatic hypotension or uncontrolled hyperkalemia. Review a creatinine rise >30% within 4 weeks of initiation/increase and reversible causes before changing treatment; individualize follow-up with nephrology.',
    } });
  }

  const metformin = getMetformin(patientData.medications);
  if (metformin && (onDialysis || (egfr !== null && egfr < 30))) {
    alerts.push({
      domain: 'DIABETES_CARDIORENAL',
      source: 'CONTRAINDICATION',
      recommendation: {
        priority: 'HIGH',
        action: 'DISCONTINUE',
        medication: formatMedicationLabel(metformin, 'Metformin'),
        recommendedDose: 'N/A',
        rationale: `CONTRAINDICATED: Metformin with ${onDialysis ? 'dialysis-dependent CKD' : `eGFR ${egfr?.toFixed(0) ?? 'unknown'} mL/min/1.73m2`}. Elevated risk of lactic acidosis.`,
        evidence: GUIDELINES.ADA_2026,
        monitoring:
          'Discontinue immediately. Recheck renal function in 1 week. Transition to alternate therapy (consider insulin, GLP-1 RA, or DPP-4 inhibitor).',
        additionalNotes: 'Metformin is contraindicated when eGFR <30 or once dialysis is initiated. Reassess only after recovery and review current US initiation criteria; new initiation is not recommended below eGFR 45.',
      },
    });
  }

  const sglt2Medications = getMedicationsByCategory(patientData.medications, ['Diabetes - SGLT2i']);
  if (onDialysis && sglt2Medications.length > 0) {
    alerts.push({
      domain: 'DIABETES_CARDIORENAL',
      source: 'CONTRAINDICATION',
      recommendation: {
        priority: 'HIGH',
        action: 'DISCONTINUE',
        medication: describeMedicationList(sglt2Medications, 'SGLT2 inhibitor'),
        recommendedDose: 'N/A',
        rationale:
          'SGLT2 inhibitors are not recommended once a patient is dialysis-dependent; benefit and safety on dialysis are not established.',
        evidence: `${GUIDELINES.KDIGO_2022}; ${GUIDELINES.CKD_2024}`,
        monitoring: 'Stop agent and monitor volume status/glucose. Reassess regimen with nephrology/endocrinology.',
        additionalNotes: 'KDIGO/ADA recommend stopping SGLT2i when dialysis starts.',
      },
    });
  }

  const finerenone = findMedicationByKeywords(patientData.medications, ['finerenone', 'kerendia']);
  if (finerenone && onDialysis) {
    alerts.push({
      domain: 'DIABETES_CARDIORENAL',
      source: 'CONTRAINDICATION',
      recommendation: {
        priority: 'HIGH',
        action: 'DISCONTINUE',
        medication: formatMedicationLabel(finerenone, 'Finerenone'),
        recommendedDose: 'N/A',
        rationale: 'Finerenone has not been studied in ESKD on dialysis and is not recommended due to hyperkalemia risk.',
        evidence: GUIDELINES.KDIGO_2022,
        monitoring: 'Coordinate with nephrology for alternative albuminuria management and monitor potassium if recently dosed.',
        additionalNotes: 'Restart only if kidney function recovers off dialysis and albuminuric CKD persists with eGFR ≥25.',
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
        evidence: GUIDELINES.BP_2025,
        monitoring: 'If NSAID necessary, use lowest dose short-term; monitor BMP (Cr/K+) within 1 week and reassess BP control.',
        additionalNotes: 'Consider PPI for GI protection if NSAID absolutely required. Educate patient to avoid OTC NSAIDs.',
      },
      });
    }

    const onAntithrombotic =
      getDOACMedications(patientData.medications).length > 0 ||
      getMedicationsByCategory(patientData.medications, ['Antiplatelet']).length > 0 ||
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

  const mraMedications = getMRAMedications(patientData.medications).filter(m => !/finerenone/i.test(m.genericName));
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
            'Hold MRA and promptly assess hyperkalemia; determine reassessment timing from severity and clinical/ECG findings. Resume only when K+ <5.0 and underlying factors addressed.',
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

    if (egfr !== null && egfr < 30) {
      alerts.push({
        domain: 'HEART_FAILURE',
        source: 'CONTRAINDICATION',
        recommendation: {
          priority: 'HIGH',
          action: 'DISCONTINUE',
          medication: targetMeds,
          recommendedDose: 'N/A',
          rationale: `CONTRAINDICATED: eGFR ${egfr?.toFixed(0) ?? 'unknown'} mL/min/1.73m2 on MRA therapy. High risk of life-threatening hyperkalemia.`,
          evidence: GUIDELINES.HF_2022,
          monitoring:
            'Discontinue MRA. Monitor renal function and potassium periodically. Reassess candidacy if renal function improves above threshold.',
          additionalNotes: 'Consider nephrology referral for advanced CKD management.',
        },
      });
    }
  }

  const doacMedications = getDOACMedications(patientData.medications);
  if (doacMedications.length > 0 && ((egfr !== null && egfr < 15) || onDialysis)) {
    alerts.push({domain: 'ANTIPLATELET_ANTICOAGULATION', source: 'CONTRAINDICATION', recommendation: {
      priority: 'HIGH', action: 'EVALUATE', medication: describeMedicationList(doacMedications, 'Anticoagulant'),
      rationale: 'Severe kidney disease/dialysis requires an individualized, agent-specific anticoagulation plan. Warfarin or evidence-based apixaban may be reasonable for selected AF patients; do not automatically stop all DOACs.',
      evidence: GUIDELINES.AFIB_2023,
      monitoring: 'Confirm indication, renal trajectory, dose, interactions and bleeding risk with the treating team. Avoid unplanned interruption of stroke-prevention therapy.',
    }});
  }
  if (finerenone && potassium > 5.5) alerts.push({domain:'DIABETES_CARDIORENAL',source:'CONTRAINDICATION',recommendation:{
    priority:'HIGH', action:'HOLD', medication:'Finerenone', rationale:'Potassium >5.5 on finerenone requires withholding treatment and reassessment per US labeling.',
    evidence:GUIDELINES.DRUG_LABELS, monitoring:'Assess the hyperkalemia promptly and follow the indication-specific restart criteria after correction.',
  }});

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
  const potassium = patientData.labs.potassium;
  if (potassium === undefined || !Number.isFinite(potassium) || calculations.egfr === null) return true;
  if (patientData.history.dialysis || potassium >= 5.0) return true;
  if (hasAllergyToAnyCategory(patientData.allergies, ['ACE Inhibitor', 'ARB', 'ARNI'])) return true;
  return calculations.egfr < 30;
}

export function hasMRASafetyHold(patientData: PatientData, calculations: ClinicalCalculations): boolean {
  const potassium = patientData.labs.potassium;
  if (potassium === undefined || !Number.isFinite(potassium) || calculations.egfr === null) return true;
  return Boolean(patientData.history.dialysis) || potassium >= 5.0 || calculations.egfr <= 30
    || hasAllergyToAnyCategory(patientData.allergies, ['MRA']);
}
