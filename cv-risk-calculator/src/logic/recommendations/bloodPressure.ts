import { PatientData, ClinicalCalculations, DomainRecommendation, Medication, LabValues } from '../../types';
import { GUIDELINES } from '../../data/guidelines';
import { getSafetyRecommendationsForDomain, hasAllergyToAnyCategory, hasRAASSafetyHold } from '../safety';
import { getMedicationsByCategory, hasMedicationInCategory } from '../safety/utils';

export function generateBPRecommendations(
  patientData: PatientData,
  calculations: ClinicalCalculations
): DomainRecommendation[] {
  const recommendations: DomainRecommendation[] = [
    ...getSafetyRecommendationsForDomain('BLOOD_PRESSURE', patientData, calculations),
  ];
  const { medications, history, labs, allergies } = patientData;
  const { averageBP, bpClassification, egfr, bpTarget } = calculations;
  const onDialysis = Boolean(history.dialysis);

  const currentBPMeds = getMedicationsByCategory(medications, [
    'ACE Inhibitor',
    'ARB',
    'ARNI',
    'Beta Blocker',
    'Calcium Channel Blocker',
    'Diuretic - Thiazide',
    'Diuretic - Loop',
  ]);

  const hasACEI = hasMedicationInCategory(medications, 'ACE Inhibitor');
  const hasARB = hasMedicationInCategory(medications, 'ARB');
  const hasARNI = hasMedicationInCategory(medications, 'ARNI');
  const hasCCB = hasMedicationInCategory(medications, 'Calcium Channel Blocker');
  const hasBetaBlocker = hasMedicationInCategory(medications, 'Beta Blocker');
  const hasThiazide = hasMedicationInCategory(medications, 'Diuretic - Thiazide');

  const ejectionFraction = history.ejectionFraction || 0;
  const isHFrEF = history.heartFailure && ejectionFraction > 0 && ejectionFraction <= 40;
  const shouldAvoidRAASTitration = isHFrEF && !hasARNI;
  const raasOnHold = hasRAASSafetyHold(patientData, calculations);

  const bpAboveTarget = averageBP.systolic > bpTarget.systolic || averageBP.diastolic > bpTarget.diastolic;
  const hasClinicalASCVD = history.cad || history.priorMI || history.stroke || history.pad;
  const highRiskThreshold = 7.5; // PREVENT 10-year CVD risk threshold per 2025 HTN guideline
  const isHighRiskStage1 =
    bpClassification === 'Stage 1 Hypertension' &&
    !onDialysis &&
    (hasClinicalASCVD || calculations.ascvdRisk >= highRiskThreshold || history.ckd || history.diabetes);
  const isLowRiskStage1 = bpClassification === 'Stage 1 Hypertension' && !isHighRiskStage1 && !onDialysis;

  if (onDialysis && bpAboveTarget) {
    recommendations.push({
      priority: 'HIGH',
      action: 'ADJUST',
      medication: 'Dialysis BP plan',
      recommendedDose: 'Prioritize dry-weight optimization + long-acting CCB or beta blocker',
      rationale:
        'In dialysis patients, KDIGO emphasizes volume control first; RAAS purely for nephroprotection is not indicated once dialysis-dependent. Use non-RAAS agents and coordinate pre/post-dialysis BP goals.',
      evidence: GUIDELINES.KDIGO_BP_2021,
      monitoring: 'Review intradialytic hypotension and potassium; time antihypertensives to avoid pre-dialysis hypotension.',
    });
  }

  // HIGH PRIORITY: CKD or Diabetes needs ACE-I/ARB (unless HFrEF patient should get ARNI instead)
  const needsRenalRAAS = (history.ckd || history.diabetes || egfr < 60) && !onDialysis;
  if (needsRenalRAAS && !hasACEI && !hasARB && !hasARNI && !raasOnHold) {
    // SKIP if patient has HFrEF - they should get Entresto (ARNI) from heart failure recommendations
    // Entresto contains valsartan (an ARB), so don't recommend separate ARB for HFrEF patients
    if (!isHFrEF) {
      const hasACEAllergy = hasAllergyToAnyCategory(allergies, ['ACE Inhibitor']);
      const hasARBAllergy = hasAllergyToAnyCategory(allergies, ['ARB']);

      if (!(hasACEAllergy && hasARBAllergy)) {
        const medicationName = hasACEAllergy ? 'Losartan' : 'Lisinopril';
        const startingDose = hasACEAllergy ? '50mg daily' : '10mg daily';
        recommendations.push({
          priority: 'HIGH',
          action: 'ADD',
          medication: medicationName,
          recommendedDose: startingDose,
          rationale: `${history.ckd ? 'CKD' : 'Diabetes'} requires ${
            hasACEAllergy ? 'ARB' : 'ACE-I'
          } for renoprotection and BP control${hasACEAllergy ? '; ACE-I allergy documented' : ''}`,
          evidence: GUIDELINES.BP_2025,
          monitoring: 'BMP at 2 weeks (check Cr, K+ after initiation)',
          additionalNotes: hasARBAllergy ? 'ARB avoided due to allergy history.' : undefined,
        });
      }
    }
  }

  // CRITICAL: If patient has HFrEF and is on ARB (not ARNI), flag for switch to Entresto
  if (isHFrEF && hasARB && !hasARNI && !hasACEI && egfr >= 30) {
    const arb = getMedicationsByCategory(medications, ['ARB'])[0];
    recommendations.push({
      priority: 'HIGH',
      action: 'EVALUATE',
      medication: `${arb?.genericName || 'ARB'} (current medication)`,
      recommendedDose: 'N/A',
      rationale: `HFrEF patient on ARB: Consider switching to Entresto (ARNI) which is superior per 2022 guidelines and also provides ARB effect (Entresto contains valsartan).`,
      evidence: GUIDELINES.HF_2022,
      monitoring: 'See Heart Failure recommendations for Entresto switch guidance.',
      additionalNotes: 'ARB can be stopped and Entresto started next day (no 36-hour washout needed for ARB, only for ACE-I).',
    });
  }

  // HIGH PRIORITY: Stage 1 hypertension with elevated ASCVD risk warrants pharmacologic therapy
  if (isHighRiskStage1 && currentBPMeds.length === 0) {
    const prefersCCB =
      onDialysis ||
      hasAllergyToAnyCategory(allergies, ['ACE Inhibitor']) ||
      shouldAvoidRAASTitration ||
      raasOnHold;
    const preferredAgent = prefersCCB ? 'Amlodipine' : 'Lisinopril';
    const dose = preferredAgent === 'Amlodipine' ? '5mg daily' : '10mg daily';
    recommendations.push({
      priority: 'HIGH',
      action: 'ADD',
      medication: preferredAgent,
      recommendedDose: dose,
      rationale:
        prefersCCB
          ? 'Stage 1 hypertension with clinical CVD/CKD/diabetes or PREVENT 10-year CVD risk ≥7.5%; in dialysis/RAAS-constrained patients, use non-RAAS first-line (dihydropyridine CCB).'
          : 'Stage 1 hypertension with clinical CVD/CKD/diabetes or PREVENT 10-year CVD risk ≥7.5% warrants antihypertensive therapy per 2025 AHA/ACC guideline.',
      evidence: GUIDELINES.BP_2025,
      monitoring:
        preferredAgent === 'Lisinopril'
          ? 'BMP in 2 weeks to reassess creatinine and potassium after ACE-I initiation.'
          : 'Monitor for edema/orthostasis; recheck BP trend in 2-4 weeks.',
      additionalNotes: prefersCCB
        ? 'RAAS pathway on hold (dialysis, hyperkalemia risk, or planned ARNI transition); start with non-RAAS agent.'
        : undefined,
    });
  }

  // MODERATE PRIORITY: Stage 1 HTN with lower PREVENT risk - reinforce lifestyle and timeline to add meds
  if (isLowRiskStage1 && currentBPMeds.length === 0) {
    recommendations.push({
      priority: 'MODERATE',
      action: 'ADD',
      medication: 'Lifestyle-first plan',
      recommendedDose: '',
      rationale:
        'Stage 1 hypertension with PREVENT 10-year CVD risk <7.5%: implement intensive lifestyle therapy and reassess in 3-6 months; start medication if average BP remains ≥130/80 mm Hg.',
      evidence: GUIDELINES.BP_2025,
      additionalNotes: 'Confirm average BP with HBPM/ABPM when feasible; reinforce sodium restriction, weight loss, activity, and alcohol moderation.',
    });
  }

  // HIGH PRIORITY: Stage 2 HTN requires combination therapy (≥2 drugs from complementary classes)
  if (bpClassification === 'Stage 2 Hypertension' && bpAboveTarget) {
    const targets: DomainRecommendation[] = [];
    if (!hasCCB) {
      targets.push({
        priority: 'HIGH',
        action: 'ADD',
        medication: 'Amlodipine',
        recommendedDose: '5mg daily',
        rationale:
          'Stage 2 hypertension should be managed with 2 first-line agents; dihydropyridine CCB pairs well with RAAS blockade and is renally safe.',
        evidence: GUIDELINES.BP_2025,
      });
    }
    if (!hasThiazide && egfr >= 30 && !onDialysis) {
      targets.push({
        priority: 'HIGH',
        action: 'ADD',
        medication: 'Chlorthalidone',
        recommendedDose: '12.5mg daily',
        rationale:
          'Chlorthalidone preferred thiazide per AHA/ACC for Stage 2/resistant hypertension; adds ~8-10 mmHg systolic reduction.',
        evidence: GUIDELINES.BP_2025,
        monitoring: 'Check BMP 1-2 weeks after initiation (Na/K). Reinforce AM dosing to limit nocturia.',
        additionalNotes: 'Prefer single-pill, fixed-dose combinations when available to improve adherence.',
      });
    }

    const availableSlots = Math.max(0, 2 - currentBPMeds.length);
    if (availableSlots > 0) {
      targets.slice(0, availableSlots).forEach((rec) => recommendations.push(rec));
    } else if (targets.length > 0) {
      targets.forEach((rec) =>
        recommendations.push({
          ...rec,
          priority: rec.priority === 'HIGH' ? 'MODERATE' : rec.priority,
          additionalNotes: 'Already on multi-drug regimen—consider staged additions if BP remains uncontrolled.',
        })
      );
    }
  }

  // HIGH PRIORITY: Post-MI requires beta-blocker
  if (history.priorMI && !hasBetaBlocker) {
    recommendations.push({
      priority: 'HIGH',
      action: 'ADD',
      medication: 'Metoprolol succinate',
      recommendedDose: '25mg daily, titrate to 100-200mg',
      rationale: 'Post-MI patients require beta-blocker for secondary prevention; reduces mortality by 20-30%',
      evidence: GUIDELINES.STEMI_2013,
      monitoring: 'Monitor heart rate (goal 50-60 bpm) and BP',
    });
  }

  // MODERATE PRIORITY: Uptitrate existing BP meds
  if (bpAboveTarget) {
    currentBPMeds.forEach((med) => {
      if ((shouldAvoidRAASTitration || raasOnHold) && ['ACE Inhibitor', 'ARB'].includes(med.category)) {
        return;
      }
      const titration = canTitrateBPMed(med, labs, egfr);
      if (titration.possible) {
        recommendations.push({
          priority: 'MODERATE',
          action: 'INCREASE',
          medication: med.genericName,
          currentDose: med.dose,
          recommendedDose: titration.newDose,
          rationale: `BP ${averageBP.systolic}/${averageBP.diastolic} mmHg, well above target <${bpTarget.systolic}/${bpTarget.diastolic}; currently tolerating ${med.dose} without adverse effects`,
          evidence: GUIDELINES.BP_2025,
          monitoring: titration.monitoring,
        });
      }
    });
  }

  return sortByPriority(recommendations);
}

function canTitrateBPMed(
  med: Medication,
  labs: LabValues,
  egfr: number
): { possible: boolean; newDose: string; monitoring?: string } {
  const genericLower = med.genericName.toLowerCase();

  if (genericLower.includes('lisinopril')) {
    const currentDose = parseInt(med.dose, 10);
    if (currentDose < 40 && (!labs.potassium || labs.potassium < 5.5) && egfr > 30) {
      return {
        possible: true,
        newDose: `${Math.min(currentDose * 2, 40)}mg daily`,
        monitoring: 'BMP at 2 weeks (check Cr, K+ after dose increase)',
      };
    }
  }

  if (genericLower.includes('amlodipine')) {
    const currentDose = parseFloat(med.dose);
    if (currentDose < 10) {
      return {
        possible: true,
        newDose: `${Math.min(currentDose + 2.5, 10)}mg daily`,
      };
    }
  }

  if (genericLower.includes('losartan')) {
    const currentDose = parseInt(med.dose, 10);
    if (currentDose < 100 && (!labs.potassium || labs.potassium < 5.5) && egfr > 30) {
      return {
        possible: true,
        newDose: `${Math.min(currentDose * 2, 100)}mg daily`,
        monitoring: 'BMP at 2 weeks (check Cr, K+ after dose increase)',
      };
    }
  }

  return { possible: false, newDose: med.dose };
}

function sortByPriority(recommendations: DomainRecommendation[]): DomainRecommendation[] {
  const priorityOrder = { HIGH: 1, MODERATE: 2, LOW: 3 };
  return recommendations.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
}
