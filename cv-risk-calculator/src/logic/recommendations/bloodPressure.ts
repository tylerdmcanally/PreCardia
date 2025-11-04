import { PatientData, ClinicalCalculations, DomainRecommendation, Medication, LabValues } from '../../types';
import { GUIDELINES } from '../../data/guidelines';
import { getSafetyRecommendationsForDomain, hasAllergyToAnyCategory, hasRAASSafetyHold } from '../safety';

export function generateBPRecommendations(
  patientData: PatientData,
  calculations: ClinicalCalculations
): DomainRecommendation[] {
  const recommendations: DomainRecommendation[] = [
    ...getSafetyRecommendationsForDomain('BLOOD_PRESSURE', patientData, calculations),
  ];
  const { medications, history, labs, allergies } = patientData;
  const { averageBP, bpClassification, egfr, bpTarget } = calculations;

  const currentBPMeds = medications.filter((m) =>
    ['ACE Inhibitor', 'ARB', 'ARNI', 'Beta Blocker', 'Calcium Channel Blocker', 'Diuretic - Thiazide', 'Diuretic - Loop'].includes(m.category)
  );

  const hasACEI = medications.some((m) => m.category === 'ACE Inhibitor');
  const hasARB = medications.some((m) => m.category === 'ARB');
  const hasARNI = medications.some(
    (m) =>
      m.category === 'ARNI' ||
      m.genericName.toLowerCase().includes('sacubitril') ||
      m.genericName.toLowerCase().includes('entresto')
  );
  const hasCCB = medications.some((m) => m.category === 'Calcium Channel Blocker');
  const hasBetaBlocker = medications.some((m) => m.category === 'Beta Blocker');
  const hasThiazide = medications.some((m) => m.category === 'Diuretic - Thiazide');

  const ejectionFraction = history.ejectionFraction || 0;
  const isHFrEF = history.heartFailure && ejectionFraction > 0 && ejectionFraction <= 40;
  const shouldAvoidRAASTitration = isHFrEF && !hasARNI;
  const raasOnHold = hasRAASSafetyHold(patientData, calculations);

  const bpAboveTarget = averageBP.systolic > bpTarget.systolic || averageBP.diastolic > bpTarget.diastolic;
  const hasClinicalASCVD = history.cad || history.priorMI || history.stroke || history.pad;
  const isHighRiskStage1 =
    bpClassification === 'Stage 1 Hypertension' && (hasClinicalASCVD || calculations.ascvdRisk >= 10 || history.ckd || history.diabetes);

  // HIGH PRIORITY: CKD or Diabetes needs ACE-I/ARB (unless HFrEF patient should get ARNI instead)
  if ((history.ckd || history.diabetes || egfr < 60) && !hasACEI && !hasARB && !hasARNI && !raasOnHold) {
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
          evidence: GUIDELINES.BP_2017,
          monitoring: 'BMP at 2 weeks (check Cr, K+ after initiation)',
          additionalNotes: hasARBAllergy ? 'ARB avoided due to allergy history.' : undefined,
        });
      }
    }
  }

  // CRITICAL: If patient has HFrEF and is on ARB (not ARNI), flag for switch to Entresto
  if (isHFrEF && hasARB && !hasARNI && !hasACEI && egfr >= 30) {
    const arb = medications.find((m) => m.category === 'ARB');
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
    const prefersThiazide = hasAllergyToAnyCategory(allergies, ['ACE Inhibitor']) || shouldAvoidRAASTitration || raasOnHold;
    const preferredAgent = prefersThiazide ? 'Chlorthalidone' : 'Lisinopril';
    const dose = preferredAgent === 'Chlorthalidone' ? '12.5mg daily' : '10mg daily';
    recommendations.push({
      priority: 'HIGH',
      action: 'ADD',
      medication: preferredAgent,
      recommendedDose: dose,
      rationale:
        'Stage 1 hypertension with clinical ASCVD/CKD/diabetes or 10-year ASCVD ≥10% merits antihypertensive therapy per 2017 ACC/AHA guideline.',
      evidence: GUIDELINES.BP_2017,
      monitoring:
        preferredAgent === 'Lisinopril'
          ? 'BMP in 2 weeks to reassess creatinine and potassium after ACE-I initiation.'
          : 'Monitor electrolytes 2-4 weeks after thiazide initiation; counsel on orthostasis and photosensitivity.',
      additionalNotes: shouldAvoidRAASTitration ? 'Choosing thiazide given plan to transition RAAS therapy to ARNI for HFrEF.' : undefined,
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
          'Stage 2 hypertension should be managed with combination therapy; dihydropyridine CCB pairs well with RAAS blockade and is renally safe.',
        evidence: GUIDELINES.BP_2017,
      });
    }
    if (!hasThiazide) {
      targets.push({
        priority: 'HIGH',
        action: 'ADD',
        medication: 'Chlorthalidone',
        recommendedDose: '12.5mg daily',
        rationale:
          'Chlorthalidone preferred thiazide per ACC/AHA for resistant Stage 2 hypertension and provides additional 8-10 mmHg systolic reduction.',
        evidence: GUIDELINES.BP_2017,
        monitoring: 'Check BMP 1-2 weeks after initiation (Na/K). Reinforce AM dosing to limit nocturia.',
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
          evidence: GUIDELINES.BP_2017,
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
