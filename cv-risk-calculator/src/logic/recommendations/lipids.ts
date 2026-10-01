import { PatientData, ClinicalCalculations, DomainRecommendation } from '../../types';
import { GUIDELINES } from '../../data/guidelines';
import { getMedicationsByCategory, hasAllergyToCategory } from '../safety/utils';

export function generateLipidRecommendations(patientData: PatientData, calculations: ClinicalCalculations): DomainRecommendation[] {
  const recommendations: DomainRecommendation[] = [];
  const { history, demographics, labs, medications } = patientData;
  const { ascvdRisk, ldlGoal, egfr } = calculations;
  const hasASCVD = history.cad || history.priorMI || history.priorPCI || history.stroke || history.tia || history.pad;
  const ldl = labs.ldl;
  const currentStatin = getMedicationsByCategory(medications, ['Statin'])[0];
  const statinName = currentStatin?.genericName.toLowerCase() ?? '';
  const statinDose = Number.parseFloat(currentStatin?.dose ?? '');
  const highIntensity = (statinName.includes('atorvastatin') && statinDose >= 40)
    || (statinName.includes('rosuvastatin') && statinDose >= 20);
  const hasEzetimibe = medications.some(m => /ezetimibe/i.test(m.genericName));
  const hasPCSK9 = medications.some(m => /evolocumab|alirocumab|inclisiran/i.test(m.genericName));
  const severeLDL = ldl !== undefined && ldl >= 190;
  const diabetesGroup = history.diabetes && demographics.age >= 40 && demographics.age <= 75;
  const ckdGroup = history.ckd && !history.dialysis && egfr !== null && egfr >= 15 && egfr < 60
    && demographics.age >= 40 && demographics.age <= 75;
  const riskBased = !hasASCVD && !history.heartFailure && demographics.age >= 30 && demographics.age <= 79
    && ldl !== undefined && ldl >= 70 && ldl < 190 && ascvdRisk !== null;
  const riskIndication = riskBased && ascvdRisk >= 3;
  const highNeeded = hasASCVD || severeLDL || (diabetesGroup && ldlGoal === 70) || (riskBased && ascvdRisk >= 10);
  const hasIndication = hasASCVD || severeLDL || diabetesGroup || ckdGroup || riskIndication;
  const rationale = hasASCVD ? `Clinical ASCVD: use maximally tolerated statin therapy; LDL-C goal <${ldlGoal} mg/dL.`
    : severeLDL ? 'LDL-C ≥190 mg/dL: assess secondary causes/familial hypercholesterolemia and use maximally tolerated statin therapy without a risk-score prerequisite.'
    : diabetesGroup ? `Diabetes age 40–75: at least moderate-intensity statin; use high intensity with additional ASCVD risk factors. LDL-C goal <${ldlGoal} mg/dL.`
    : ckdGroup ? 'Established CKD stage 3–4, age 40–75: lipid-lowering therapy is recommended without a risk-score prerequisite.'
    : `PREVENT-ASCVD ${ascvdRisk?.toFixed(1)}%: ${ascvdRisk !== null && ascvdRisk < 5 ? 'consider' : 'recommend discussing'} statin therapy after review of risk enhancers and patient preferences. LDL-C goal <${ldlGoal} mg/dL.`;

  if (hasIndication && hasAllergyToCategory(patientData.allergies, 'Statin')) {
    recommendations.push({priority:'HIGH', action:'EVALUATE', medication:'Lipid-lowering strategy', rationale,
      evidence:GUIDELINES.DYSLIPIDEMIA_2026, monitoring:'Clarify statin allergy/intolerance before initiation or escalation. Review tolerated alternatives and nonstatin therapy.'});
  } else if (hasIndication && (!currentStatin || (highNeeded && !highIntensity))) {
    // One mutually exclusive statin decision; never escalate simvastatin/pravastatin
    // to an arbitrary dose and call it high-intensity therapy.
    recommendations.push({priority:highNeeded ? 'HIGH' : 'MODERATE',
      action:currentStatin ? 'SWITCH' : riskBased && !diabetesGroup && !ckdGroup && ascvdRisk! < 5 ? 'CONSIDER' : 'ADD',
      medication:'Atorvastatin', currentDose:currentStatin ? `${currentStatin.genericName} ${currentStatin.dose}` : undefined,
      recommendedDose:highNeeded ? '40mg daily, if tolerated' : '10–20mg daily, if agreed after discussion',
      rationale, evidence:GUIDELINES.DYSLIPIDEMIA_2026,
      monitoring:'Review adherence, prior intolerance, interactions and pregnancy considerations first. Repeat lipids in 4–12 weeks.',
      additionalNotes:currentStatin ? 'Replace the current statin; do not take two statins. Confirm that greater intensity is tolerated.' : 'Individualize treatment in older adults according to function, life expectancy and preferences.'});
  }
  if (currentStatin) {
    recommendations.push({priority:'LOW',action:'MONITOR',medication:currentStatin.genericName,
      rationale:'Review lipid response, adherence and statin tolerability.',evidence:GUIDELINES.DYSLIPIDEMIA_2026,
      monitoring:'Baseline ALT; repeat liver testing or CK when clinically indicated by symptoms. Review muscle symptoms and interactions.'});
  }
  if (hasIndication && currentStatin && highIntensity && ldl !== undefined && ldl >= ldlGoal) {
    recommendations.push({priority:'MODERATE',action:'CONSIDER',medication:hasEzetimibe ? 'Additional nonstatin therapy' : 'Ezetimibe',
      recommendedDose:hasEzetimibe ? undefined : '10mg daily',
      rationale:`LDL-C ${ldl} mg/dL remains above goal <${ldlGoal} on reported high-intensity statin. Confirm adherence and maximally tolerated therapy.`,
      evidence:GUIDELINES.DYSLIPIDEMIA_2026,
      monitoring:'Repeat lipids in 4–12 weeks after an agreed change.',
      additionalNotes:hasEzetimibe ? (hasPCSK9 ? 'Review the full regimen, response and adherence with a lipid specialist.' : 'Select PCSK9 monoclonal antibody or other nonstatin therapy according to the LDL reduction needed, indication and preferences.') : undefined});
  }
  if ((labs.triglycerides ?? 0) >= 500) {
    recommendations.push({priority:'HIGH',action:'EVALUATE',medication:'Severe hypertriglyceridemia',
      rationale:`TG ${labs.triglycerides} mg/dL: confirm fasting/persistent elevation, address secondary causes, alcohol and diet, and evaluate pancreatitis risk.`,
      evidence:GUIDELINES.DYSLIPIDEMIA_2026,
      monitoring:'Consider a fibrate or prescription omega-3 after reviewing kidney function and interactions; very-low-fat dietary management is especially important at TG ≥1000.',
      additionalNotes:'Fenofibrate dose depends on renal function; avoid a blanket 145mg prescription. Abdominal pain or suspected pancreatitis needs prompt evaluation.'});
  } else if ((labs.triglycerides ?? 0) >= 150 && hasASCVD && currentStatin) {
    recommendations.push({priority:'MODERATE',action:'CONSIDER',medication:'Icosapent ethyl',recommendedDose:'2g twice daily if eligible',
      rationale:'Persistent hypertriglyceridemia in selected statin-treated patients with ASCVD may justify additional risk reduction.',
      evidence:GUIDELINES.DYSLIPIDEMIA_2026,monitoring:'Confirm LDL management, persistent fasting TG and eligibility; discuss AF and bleeding risks.'});
  }
  if (ldl === undefined) {
    recommendations.push({priority:'MODERATE',action:'EVALUATE',medication:'Lipid panel',rationale:'LDL-C is not documented. Obtain a recent lipid panel to assess response and treatment goals; established ASCVD indications do not require a risk estimate.',evidence:GUIDELINES.DYSLIPIDEMIA_2026});
  }
  return recommendations.sort((a,b)=>({HIGH:0,MODERATE:1,LOW:2}[a.priority]-{HIGH:0,MODERATE:1,LOW:2}[b.priority]));
}
