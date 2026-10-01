import { PatientData, ClinicalCalculations, DomainRecommendation } from '../../types';
import { GUIDELINES } from '../../data/guidelines';
import { getSafetyRecommendationsForDomain, hasAllergyToAnyCategory, hasRAASSafetyHold } from '../safety';
import { getMedicationsByCategory, hasMedicationInCategory } from '../safety/utils';

export function generateBPRecommendations(patientData: PatientData, calculations: ClinicalCalculations): DomainRecommendation[] {
  const recommendations = getSafetyRecommendationsForDomain('BLOOD_PRESSURE', patientData, calculations);
  const { medications, history, labs, allergies } = patientData;
  const { averageBP, bpClassification, egfr } = calculations;
  const evidence = GUIDELINES.BP_2025;
  if (bpClassification === 'Hypertensive Crisis' || (labs.potassium !== undefined && labs.potassium >= 6)) {
    recommendations.unshift({priority:'HIGH',action:'EVALUATE',medication:'Urgent clinical assessment',evidence,
      rationale:[
        bpClassification === 'Hypertensive Crisis' ? `BP ${averageBP.systolic}/${averageBP.diastolic}: repeat promptly with correct technique and assess for acute target-organ injury.` : '',
        (labs.potassium ?? 0) >= 6 ? `Potassium ${labs.potassium} mEq/L requires urgent assessment and confirmation; assess symptoms, ECG and reversible causes.` : '',
      ].filter(Boolean).join(' '),
      monitoring:'Assess now. Emergency evaluation for chest pain, dyspnea, neurologic symptoms, acute organ injury or concerning ECG findings. Severe asymptomatic hypertension requires timely clinician-directed treatment, not routine follow-up.',
      additionalNotes:'Routine optimization recommendations are deferred pending this assessment.'});
    return recommendations;
  }
  if (bpClassification === 'Not assessed') {
    recommendations.push({priority:'MODERATE',action:'EVALUATE',medication:'Blood pressure assessment',evidence,
      rationale:'No complete blood pressure readings are available. Obtain reliable readings before selecting or titrating antihypertensive therapy.'});
    return recommendations;
  }
  const currentBPMeds = getMedicationsByCategory(medications, ['ACE Inhibitor','ARB','ARNI','Beta Blocker','Calcium Channel Blocker','Diuretic - Thiazide','Diuretic - Loop','MRA']);
  const hasRAAS = ['ACE Inhibitor','ARB','ARNI'].some(c => hasMedicationInCategory(medications,c as 'ACE Inhibitor'|'ARB'|'ARNI'));
  const hasCCB = hasMedicationInCategory(medications,'Calcium Channel Blocker');
  const hasThiazide = hasMedicationInCategory(medications,'Diuretic - Thiazide');
  const hasASCVD = history.cad || history.priorMI || history.priorPCI || history.stroke || history.tia || history.pad;
  const isHFrEF = history.heartFailure && (history.ejectionFraction ?? 0) > 0 && history.ejectionFraction! <= 40;
  const aboveTarget = averageBP.systolic >= 130 || averageBP.diastolic >= 80;
  const totalCVDRisk = calculations.preventRisks.totalCVD_10yr;
  const clinicalIndication = hasASCVD || history.heartFailure || history.diabetes || history.ckd;
  const highRisk = clinicalIndication || (totalCVDRisk !== null && totalCVDRisk >= 7.5);
  const raasHold = hasRAASSafetyHold(patientData, calculations);
  const canStartRaas = !raasHold && !isHFrEF;
  const renalIndication = (history.ckd && (labs.uacr ?? 0) >= 30)
    || (history.diabetes && aboveTarget && ((labs.uacr ?? 0) >= 30 || (history.ckd && egfr !== null && egfr < 60)));

  if (history.dialysis) {
    if (aboveTarget) recommendations.push({priority:'HIGH',action:'EVALUATE',medication:'Dialysis BP plan',evidence:GUIDELINES.KDIGO_BP_2021,
      rationale:'Individualize BP management with the dialysis team; assess volume/dry weight, home readings and intradialytic hypotension before medication changes.'});
    return recommendations;
  }
  if (renalIndication && !hasRAAS && !isHFrEF) {
    if (canStartRaas && !hasAllergyToAnyCategory(allergies,['ACE Inhibitor','ARB'])) {
      recommendations.push({priority:'HIGH',action:'CONSIDER',medication:'Lisinopril',recommendedDose:'10mg daily if BP and clinical status permit',
        rationale:'Albuminuric CKD or diabetes with hypertension and kidney disease supports ACE-I/ARB therapy; confirm the indication and tolerability.',
        evidence:GUIDELINES.CKD_2024,monitoring:'Check BP, creatinine and potassium within 2–4 weeks; do not combine ACE-I with ARB/ARNI.'});
    } else recommendations.push({priority:'MODERATE',action:'EVALUATE',medication:'Renal-protective therapy',evidence:GUIDELINES.CKD_2024,
      rationale:'Review current creatinine, potassium, BP and allergy history before selecting ACE-I/ARB therapy. Do not initiate from missing safety data.'});
  }
  if (bpClassification === 'Stage 1 Hypertension' && currentBPMeds.length === 0 && !renalIndication && !isHFrEF) {
    if (highRisk) {
      const preferRaas = canStartRaas && !hasAllergyToAnyCategory(allergies,['ACE Inhibitor']);
      recommendations.push({priority:'HIGH',action:'CONSIDER',medication:preferRaas ? 'Lisinopril' : 'Amlodipine',recommendedDose:preferRaas ? '10mg daily' : '5mg daily',evidence,
        rationale:'Confirmed stage 1 hypertension with clinical CVD, diabetes, CKD or PREVENT total-CVD risk ≥7.5% supports medication in addition to lifestyle therapy.',
        monitoring:preferRaas ? 'Confirm baseline safety labs; repeat BMP in 2 weeks.' : 'Review edema, orthostasis and BP response in 2–4 weeks.'});
    } else {
      recommendations.push({priority:'MODERATE',action:totalCVDRisk === null ? 'EVALUATE' : 'MONITOR',medication:'Stage 1 hypertension plan',evidence,
        rationale:totalCVDRisk === null ? 'Risk is unavailable; do not assume low risk. Complete eligible PREVENT inputs or individualize treatment if outside the validated population.'
          : 'PREVENT total-CVD risk <7.5%: lifestyle therapy for 3–6 months; add medication if confirmed average BP remains ≥130/80.',
        monitoring:'Confirm the BP pattern with home/ambulatory readings and review adherence.'});
    }
  }
  if (bpClassification === 'Stage 2 Hypertension' && !isHFrEF) {
    const options: DomainRecommendation[] = [];
    if (!hasCCB) options.push({priority:'HIGH',action:'CONSIDER',medication:'Amlodipine',recommendedDose:'5mg daily',evidence,rationale:'Confirmed stage 2 hypertension generally supports two complementary first-line agents; review the full regimen and tolerability.'});
    if (!hasThiazide && egfr !== null && egfr >= 30 && labs.potassium !== undefined) options.push({priority:'HIGH',action:'CONSIDER',medication:'Chlorthalidone',recommendedDose:'12.5mg daily',evidence,rationale:'A thiazide-like diuretic is an option for confirmed stage 2 hypertension.',monitoring:'Review sodium, potassium, kidney function, gout and volume status first; check BMP 1–2 weeks after initiation.'});
    const plannedRaas = recommendations.some(r => r.medication === 'Lisinopril');
    const slots = Math.max(0, 2 - currentBPMeds.length - Number(plannedRaas));
    recommendations.push(...options.slice(0,slots));
    if (currentBPMeds.length >= 2) recommendations.push({priority:'MODERATE',action:'EVALUATE',medication:'Uncontrolled hypertension',evidence,rationale:'Review home readings, adherence, tolerated doses, secondary causes and complementary drug classes before staged intensification.'});
  }
  if (aboveTarget && !isHFrEF) {
    for (const medication of currentBPMeds) {
      const name = medication.genericName.toLowerCase();
      const dose = Number.parseFloat(medication.dose);
      const nextDose = name === 'amlodipine' && dose > 0 && dose < 10 ? '10mg daily'
        : !raasHold && name === 'lisinopril' && dose > 0 && dose < 40 ? `${Math.min(dose * 2, 40)}mg daily`
        : !raasHold && name === 'losartan' && dose > 0 && dose < 100 ? `${Math.min(dose * 2, 100)}mg daily` : null;
      if (nextDose) recommendations.push({
        priority: 'MODERATE', action: 'CONSIDER', medication: medication.genericName,
        recommendedDose: nextDose, evidence,
        rationale: 'If confirmed BP remains above goal, review adherence, current total daily dose and tolerability before staged titration. Choose titration versus an additional agent; these are options, not simultaneous orders.',
        monitoring: name === 'amlodipine' ? 'Monitor BP, orthostasis and edema.' : 'Check creatinine and potassium within 2 weeks of an agreed dose increase.',
      });
    }
  }
  if (history.priorMI && !hasMedicationInCategory(medications,'Beta Blocker')) recommendations.push({priority:'MODERATE',action:'EVALUATE',medication:'Beta-blocker indication after MI',evidence:GUIDELINES.CCD_2023,
    rationale:'Confirm MI timing, LVEF, angina, arrhythmia and other indications. A remote MI alone does not establish a lifelong beta-blocker indication.',monitoring:'Review HR, BP and stability before starting therapy; see HF recommendations if reduced EF.'});
  return recommendations;
}
