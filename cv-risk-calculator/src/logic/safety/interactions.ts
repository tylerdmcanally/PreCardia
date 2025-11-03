import { PatientData, ClinicalCalculations } from '../../types';
import { GUIDELINES } from '../../data/guidelines';
import { SafetyCheckResult } from '../../types';
import {
  describeMedicationList,
  findFirstMedicationByCategory,
  findMedicationByKeywords,
  formatMedicationLabel,
  getMedicationsByCategory,
  getRAASMedications,
  getQTMedications,
  getDiureticMedications,
} from './utils';

export function getInteractionAlerts(
  patientData: PatientData,
  _calculations: ClinicalCalculations
): SafetyCheckResult[] {
  const alerts: SafetyCheckResult[] = [];
  const medications = patientData.medications;

  const aceInhibitor = findFirstMedicationByCategory(medications, ['ACE Inhibitor']);
  const arb = findFirstMedicationByCategory(medications, ['ARB']);
  const arni = findFirstMedicationByCategory(medications, ['ARNI']);
  const raasMedications = getRAASMedications(medications);
  
  // QT-prolonging medications in our formulary
  const qtProlongingMedsList = getQTMedications(medications);

  if (aceInhibitor && arni) {
    alerts.push({
      domain: 'HEART_FAILURE',
      source: 'INTERACTION',
      recommendation: {
        priority: 'HIGH',
        action: 'DISCONTINUE',
        medication: `${formatMedicationLabel(aceInhibitor, 'ACE Inhibitor')} + ${formatMedicationLabel(arni, 'ARNI')}`,
        recommendedDose: 'N/A',
        rationale:
          'CONTRAINDICATED COMBINATION: ACE inhibitor plus Entresto (ARNI) dramatically increases angioedema risk.',
        evidence: GUIDELINES.HF_2022,
        monitoring: 'Immediately discontinue ACE inhibitor. Ensure 36-hour washout before (re)starting Entresto.',
        additionalNotes: 'Concurrent ACE inhibitor and ARNI therapy is a medication error and can cause fatal angioedema.',
      },
    });
  }

  if (aceInhibitor && arb) {
    alerts.push({
      domain: 'HEART_FAILURE',
      source: 'INTERACTION',
      recommendation: {
        priority: 'HIGH',
        action: 'DISCONTINUE',
        medication: `${formatMedicationLabel(aceInhibitor, 'ACE Inhibitor')} + ${formatMedicationLabel(arb, 'ARB')}`,
        recommendedDose: 'N/A',
        rationale:
          'CONTRAINDICATED COMBINATION: Simultaneous ACE inhibitor and ARB provides no added benefit and raises risk of hypotension, hyperkalemia, and renal failure.',
        evidence: GUIDELINES.HF_2022,
        monitoring: 'Discontinue one RAAS agent. Prefer switching to ARNI or keeping single ACE-I/ARB based on tolerance.',
        additionalNotes: 'ONTARGET trial demonstrated harm with dual ACE-I/ARB therapy.',
      },
    });
  }

  if (arni && arb) {
    alerts.push({
      domain: 'HEART_FAILURE',
      source: 'INTERACTION',
      recommendation: {
        priority: 'HIGH',
        action: 'EVALUATE',
        medication: `${formatMedicationLabel(arni, 'ARNI')} + ${formatMedicationLabel(arb, 'ARB')}`,
        recommendedDose: 'N/A',
        rationale:
          'POTENTIAL DUPLICATION: Entresto already contains valsartan (an ARB). Additional ARB likely unnecessary and increases hypotension/hyperkalemia risk.',
        evidence: GUIDELINES.HF_2022,
        monitoring: 'Verify medication list and discontinue duplicate ARB unless explicitly instructed by cardiology.',
        additionalNotes: 'ARNI therapy replaces separate ARB therapy for heart failure with reduced EF.',
      },
    });
  }

  const duplicateRAASAgents = raasMedications.length > 2;
  if (duplicateRAASAgents) {
    alerts.push({
      domain: 'BLOOD_PRESSURE',
      source: 'INTERACTION',
      recommendation: {
        priority: 'HIGH',
        action: 'EVALUATE',
        medication: describeMedicationList(raasMedications, 'RAAS inhibitor'),
        recommendedDose: 'N/A',
        rationale:
          'Multiple concurrent RAAS inhibitors identified. Combination therapy raises risk for hypotension, renal injury, and hyperkalemia.',
        evidence: GUIDELINES.BP_2017,
        monitoring: 'Rationalize RAAS therapy to a single agent (or ARNI). Review indication for each agent and adjust promptly.',
        additionalNotes: 'Avoid overlapping ACE-I, ARB, and ARNI therapy outside of specialist-directed transitions.',
      },
    });
  }

  const statins = getMedicationsByCategory(medications, ['Statin']);
  const gemfibrozil = findMedicationByKeywords(medications, ['gemfibrozil']);
  if (statins.length > 0 && gemfibrozil) {
    alerts.push({
      domain: 'LIPID_MANAGEMENT',
      source: 'INTERACTION',
      recommendation: {
        priority: 'HIGH',
        action: 'DISCONTINUE',
        medication: `${formatMedicationLabel(gemfibrozil, 'Gemfibrozil')} + ${formatMedicationLabel(
          statins[0],
          'Statin'
        )}`,
        recommendedDose: 'N/A',
        rationale:
          'CONTRAINDICATED: Gemfibrozil dramatically increases statin levels via glucuronidation inhibition (10-fold myopathy risk). Combination should be avoided.',
        evidence: GUIDELINES.CHOLESTEROL_2018,
        monitoring: 'Stop gemfibrozil (preferred) or switch statin to alternative therapy. If fibrate needed, use fenofibrate with CK monitoring.',
        additionalNotes: 'Consider switching to fenofibrate 145mg daily with statin if triglyceride lowering required.',
      },
    });
  }

  if (statins.length > 0) {
    const cyp3a4Inhibitor = findMedicationByKeywords(medications, [
      'diltiazem',
      'verapamil',
      'amiodarone',
      'itraconazole',
      'ketoconazole',
      'clarithromycin',
    ]);

    if (cyp3a4Inhibitor) {
      statins.forEach((statin) => {
        const generic = statin.genericName.toLowerCase();
        if (generic.includes('simvastatin') || generic.includes('lovastatin')) {
          alerts.push({
            domain: 'LIPID_MANAGEMENT',
            source: 'INTERACTION',
            recommendation: {
              priority: 'HIGH',
              action: 'ADJUST',
              medication: `${formatMedicationLabel(statin, 'Statin')} + ${formatMedicationLabel(
                cyp3a4Inhibitor,
                'CYP3A4 inhibitor'
              )}`,
              recommendedDose: 'Limit statin dose (Simvastatin ≤10-20mg; Lovastatin ≤20mg) or switch to pravastatin/rosuvastatin',
              rationale:
                'Strong CYP3A4 inhibitors (e.g., diltiazem, verapamil, amiodarone, azoles, macrolides) raise simvastatin/lovastatin levels causing rhabdomyolysis.',
              evidence: GUIDELINES.CHOLESTEROL_2018,
              monitoring: 'Assess for myalgias, CK elevation, dark urine. Switch to non-CYP3A4 statin (pravastatin, rosuvastatin) when possible.',
              additionalNotes:
                'FDA labeling limits simvastatin to ≤10mg with verapamil/diltiazem and contraindicates >20mg with amiodarone. Prefer alternative statin.',
            },
          });
        } else if (generic.includes('atorvastatin')) {
          alerts.push({
            domain: 'LIPID_MANAGEMENT',
            source: 'INTERACTION',
            recommendation: {
              priority: 'MODERATE',
              action: 'ADJUST',
              medication: `${formatMedicationLabel(statin, 'Atorvastatin')} + ${formatMedicationLabel(
                cyp3a4Inhibitor,
                'CYP3A4 inhibitor'
              )}`,
              recommendedDose: 'Avoid doses >40mg or switch to pravastatin/rosuvastatin',
              rationale:
                'CYP3A4 inhibitors increase atorvastatin exposure. Limit dose to mitigate myopathy risk or choose non-CYP metabolized statin.',
              evidence: GUIDELINES.CHOLESTEROL_2018,
              monitoring: 'Monitor for muscle symptoms and CK if symptomatic. Counsel patient on rhabdomyolysis warning signs.',
              additionalNotes: 'Consider rosuvastatin 20mg or pravastatin 40-80mg for high-intensity effect without CYP3A4 interactions.',
            },
          });
        }
      });
    }
  }

  // QT PROLONGATION INTERACTION CHECKS
  if (qtProlongingMedsList.length > 0) {
    // Check for loop/thiazide diuretics that can cause hypokalemia
    const diureticsList = getDiureticMedications(medications);

    // Check potassium level if available
    const potassium = patientData.labs.potassium;

    if (diureticsList.length > 0 && potassium !== undefined) {
      const diureticsLabel = describeMedicationList(diureticsList, 'Diuretic');
      const qtMedsLabel = describeMedicationList(qtProlongingMedsList, 'QT-prolonging medication');

      if (potassium < 3.5) {
        alerts.push({
          domain: 'HEART_FAILURE',
          source: 'INTERACTION',
          recommendation: {
            priority: 'HIGH',
            action: 'ADJUST',
            medication: `${diureticsLabel} + ${qtMedsLabel}`,
            recommendedDose: 'Replete potassium to ≥4.0mEq/L',
            rationale:
              'QT PROLONGATION RISK: Hypokalemia (K+ <3.5mEq/L) combined with QT-prolonging medication increases risk of torsades de pointes.',
            evidence: GUIDELINES.HF_2022,
            monitoring: 'ECG for QT interval. Replete K+ and Mg++ to high normal (K+ ≥4.5, Mg++ ≥2.5) before continuing QT-prolonging agents.',
            additionalNotes: 'Severe hypokalemia (<3.0) is an emergent contraindication to QT-prolonging drugs.',
          },
        });
      } else if (potassium >= 3.5 && potassium < 4.0) {
        alerts.push({
          domain: 'HEART_FAILURE',
          source: 'INTERACTION',
          recommendation: {
            priority: 'MODERATE',
            action: 'ADJUST',
            medication: `${diureticsLabel} + ${qtMedsLabel}`,
            recommendedDose: 'Optimize K+ to ≥4.0mEq/L',
            rationale:
              'QT PROLONGATION RISK: Borderline hypokalemia (K+ 3.5-4.0) with QT-prolonging medication increases torsades risk.',
            evidence: GUIDELINES.HF_2022,
            monitoring: 'Consider ECG for baseline QT. Optimize K+ and Mg++ to high normal.',
            additionalNotes: 'Aim for K+ ≥4.5 and Mg++ ≥2.5 when on QT-prolonging medications with diuretics.',
          },
        });
      }
    }

    // Check for digoxin-specific interactions with diuretics
    const digoxin = qtProlongingMedsList.find(med => med.genericName.toLowerCase().includes('digoxin'));
    if (digoxin && diureticsList.length > 0 && potassium !== undefined && potassium < 4.0) {
      alerts.push({
        domain: 'HEART_FAILURE',
        source: 'INTERACTION',
        recommendation: {
          priority: 'HIGH',
          action: 'MONITOR',
          medication: `${describeMedicationList(diureticsList, 'Diuretic')} + Digoxin`,
          recommendedDose: 'N/A',
          rationale:
            'DIGOXIN TOXICITY RISK: Hypokalemia potentiates digoxin toxicity, increasing arrhythmia risk including ventricular tachycardia.',
          evidence: GUIDELINES.HF_2022,
          monitoring: 'Check digoxin level if symptomatic. Replete K+ immediately to ≥4.5mEq/L. Consider holding digoxin if K+ <3.0.',
          additionalNotes: 'Symptoms: nausea, fatigue, vision changes, new arrhythmias. Target K+ 4.5-5.0 for patients on digoxin.',
        },
      });
    }
  }

  return alerts;
}
