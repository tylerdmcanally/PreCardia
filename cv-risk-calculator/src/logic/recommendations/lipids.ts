import { PatientData, ClinicalCalculations, DomainRecommendation } from '../../types';
import { GUIDELINES } from '../../data/guidelines';
import { getMedicationsByCategory } from '../safety/utils';

export function generateLipidRecommendations(
  patientData: PatientData,
  calculations: ClinicalCalculations
): DomainRecommendation[] {
  const recommendations: DomainRecommendation[] = [];
  const { history, demographics, labs, medications } = patientData;
  const { ascvdRisk, ldlGoal } = calculations;

  const hasASCVD = history.cad || history.priorMI || history.stroke || history.pad;
  const hasDiabetes = history.diabetes;
  const ldl = labs.ldl || 0;
  const triglycerides = labs.triglycerides || 0;

  const currentStatin = getMedicationsByCategory(medications, ['Statin'])[0];
  const hasEzetimibe = medications.some((m) => m.genericName.toLowerCase().includes('ezetimibe'));
  const hasPCSK9 = medications.some((m) =>
    ['evolocumab', 'alirocumab', 'inclisiran'].some((agent) =>
      m.genericName.toLowerCase().includes(agent)
    )
  );

  const highIntensityStatins = ['atorvastatin 40', 'atorvastatin 80', 'rosuvastatin 20', 'rosuvastatin 40'];

  const isHighIntensity =
    currentStatin &&
    highIntensityStatins.some((s) => `${currentStatin.genericName.toLowerCase()} ${currentStatin.dose}`.includes(s));

  // SAFETY NOTE: Add statin monitoring guidance if patient is on a statin
  if (currentStatin) {
    recommendations.push({
      priority: 'LOW',
      action: 'MONITOR',
      medication: currentStatin.genericName,
      recommendedDose: 'N/A',
      rationale: 'Statin therapy requires periodic monitoring for adverse effects including myopathy and hepatotoxicity.',
      evidence: GUIDELINES.CHOLESTEROL_2018,
      monitoring: 'Monitor for muscle pain, weakness, or dark urine (myopathy/rhabdomyolysis). Check CK if symptomatic. Baseline and follow-up ALT/AST (consider if symptoms develop).',
      additionalNotes: 'STOP STATIN and check CK if severe muscle pain. Avoid in pregnancy. Drug interactions: avoid strong CYP3A4 inhibitors with atorvastatin/simvastatin.',
    });
  }

  // HIGH PRIORITY: Clinical ASCVD needs high-intensity statin
  if (hasASCVD && !currentStatin) {
    recommendations.push({
      priority: 'HIGH',
      action: 'ADD',
      medication: 'Atorvastatin',
      recommendedDose: '40mg daily',
      rationale: `Clinical ASCVD (secondary prevention) requires high-intensity statin therapy with LDL goal <${ldlGoal} mg/dL per 2018 ACC/AHA`,
      evidence: GUIDELINES.CHOLESTEROL_2018,
      monitoring: 'Lipid panel at 4-12 weeks to assess LDL response',
      additionalNotes: 'High-intensity statin expected to achieve ≥50% LDL reduction.',
    });
  }

  // HIGH PRIORITY: Upgrade to high-intensity if on moderate
  if (hasASCVD && currentStatin && !isHighIntensity) {
    const isRosuvastatin = currentStatin.genericName.toLowerCase().includes('rosuvastatin');

    let newDose = '40mg daily';
    if (isRosuvastatin) newDose = '20mg daily';

    recommendations.push({
      priority: 'HIGH',
      action: 'INCREASE',
      medication: currentStatin.genericName,
      currentDose: currentStatin.dose,
      recommendedDose: newDose,
      rationale: `Clinical ASCVD requires high-intensity statin therapy with LDL goal <${ldlGoal} mg/dL for secondary prevention per 2018 ACC/AHA. Aim for ≥50% LDL reduction.`,
      evidence: GUIDELINES.CHOLESTEROL_2018,
      monitoring: 'Lipid panel at 4-12 weeks to assess LDL response and titrate as needed',
    });
  }

  // MODERATE-HIGH PRIORITY: Add ezetimibe if LDL not at goal
  if (hasASCVD && isHighIntensity && ldl >= ldlGoal) {
    if (!hasEzetimibe) {
      const priority = ldl >= 70 ? 'HIGH' : 'MODERATE'; // Elevated risk if LDL still >70
      recommendations.push({
        priority,
        action: 'ADD',
        medication: 'Ezetimibe',
        recommendedDose: '10mg daily',
        rationale: `LDL ${ldl} mg/dL on high-intensity statin remains above goal <${ldlGoal} mg/dL. Consider adding ezetimibe per 2022 ACC Expert Consensus; lowers LDL an additional 15–20%.`,
        evidence: GUIDELINES.CHOLESTEROL_2018,
        monitoring: 'Lipid panel at 4-12 weeks to assess response',
        additionalNotes: 'IMPROVE-IT: ezetimibe + simvastatin reduced CV events post-ACS by 6.4% over 7 years.',
      });
    } else if (!hasPCSK9 && ldl >= ldlGoal && hasASCVD) {
      // PCSK9 criteria based on 2022 ACC Expert Consensus
      const hasRecurrentEvents = [history.priorMI, history.stroke, history.tia].filter(Boolean).length >= 2;
      const hasPolyvascularDisease = [history.cad, history.priorMI, history.pad, history.stroke].filter(Boolean).length >= 2;
      const isVeryHighRisk = hasRecurrentEvents || hasPolyvascularDisease;

      recommendations.push({
        priority: isVeryHighRisk ? 'HIGH' : 'MODERATE',
        action: 'CONSIDER',
        medication: 'PCSK9 inhibitor (evolocumab or alirocumab)',
        recommendedDose: 'Evolocumab 140mg SC every 2 weeks or 420mg monthly; Alirocumab 75-150mg SC every 2 weeks',
        rationale: `Very high-risk ASCVD with LDL ${ldl} mg/dL despite maximally tolerated statin plus ezetimibe. PCSK9 inhibitor per 2022 ACC Expert Consensus can achieve additional 50-60% LDL reduction.`,
        evidence: GUIDELINES.CHOLESTEROL_2018,
        monitoring: 'Arrange prior authorization; repeat lipid panel 4-12 weeks after initiation to assess achievement of LDL goal.',
        additionalNotes: 'FOURIER/ODYSSEY OUTCOMES demonstrated 15% relative risk reduction in CV events with PCSK9 inhibition.',
      });
    }
  }

  // MODERATE PRIORITY: Diabetes 40-75 needs statin
  if (hasDiabetes && demographics.age >= 40 && demographics.age <= 75 && !currentStatin) {
    const needsHighIntensity = ascvdRisk >= 20;

    recommendations.push({
      priority: 'MODERATE',
      action: 'ADD',
      medication: 'Atorvastatin',
      recommendedDose: needsHighIntensity ? '40mg daily' : '10mg daily',
      rationale: `Diabetes age 40-75 with ASCVD risk ${ascvdRisk.toFixed(1)}% requires ${
        needsHighIntensity ? 'high' : 'moderate'
      }-intensity statin for primary prevention per 2018 ACC/AHA Cholesterol Guideline`,
      evidence: GUIDELINES.CHOLESTEROL_2018,
      monitoring: 'Lipid panel at 4-12 weeks to assess LDL response',
    });
  }

  // HIGH PRIORITY: LDL ≥190 needs high-intensity statin
  if (ldl >= 190 && !isHighIntensity) {
    recommendations.push({
      priority: 'HIGH',
      action: currentStatin ? 'INCREASE' : 'ADD',
      medication: 'Atorvastatin',
      currentDose: currentStatin?.dose,
      recommendedDose: '40mg daily',
      rationale:
        'LDL ≥190 mg/dL (severe primary hypercholesterolemia) represents high cardiovascular risk requiring high-intensity statin regardless of other risk factors per 2018 ACC/AHA',
      evidence: GUIDELINES.CHOLESTEROL_2018,
      monitoring: 'Lipid panel at 4-12 weeks; consider adding ezetimibe if LDL remains >190 mg/dL',
    });
  }

  // Handle hypertriglyceridemia
  if (triglycerides >= 500) {
    recommendations.push({
      priority: 'HIGH',
      action: 'ADD',
      medication: 'Fenofibrate or omega-3 (icosapent ethyl)',
      recommendedDose: 'Fenofibrate 145mg daily or Icosapent ethyl 2g twice daily',
      rationale: `Severe hypertriglyceridemia (TG ${triglycerides} mg/dL): reduce pancreatitis risk with fibrate or high-dose omega-3 in addition to statin per 2018 ACC/AHA.`,
      evidence: GUIDELINES.CHOLESTEROL_2018,
      monitoring: 'Recheck lipid panel in 6-12 weeks; monitor hepatic function and myalgia when combined with statin.',
    });
  } else if (triglycerides >= 150 && hasASCVD && currentStatin) {
    recommendations.push({
      priority: 'MODERATE',
      action: 'CONSIDER',
      medication: 'Icosapent ethyl',
      recommendedDose: '2g twice daily',
      rationale: `Persistent triglycerides ${triglycerides} mg/dL despite statin; REDUCE-IT trial supports Icosapent ethyl for additional ASCVD risk reduction.`,
      evidence: GUIDELINES.CHOLESTEROL_2018,
      monitoring: 'Assess adherence and monitor for atrial fibrillation or bleeding risk when combined with antithrombotics.',
      additionalNotes: 'REDUCE-IT: 25% relative risk reduction in CV events with icosapent ethyl 4g/day vs placebo.',
    });
  }

  // Patients >75 years with ASCVD benefit from at least moderate-intensity statin if not already receiving therapy
  if (hasASCVD && demographics.age > 75 && !currentStatin) {
    recommendations.push({
      priority: 'HIGH',
      action: 'ADD',
      medication: 'Rosuvastatin',
      recommendedDose: '10mg daily',
      rationale: 'Age >75 with clinical ASCVD: initiate moderate- to high-intensity statin after shared decision-making per 2018 ACC/AHA (secondary prevention).',
      evidence: GUIDELINES.CHOLESTEROL_2018,
      monitoring: 'Lipid panel at 6-12 weeks; assess for myalgias or functional decline.',
    });
  }

  return sortByPriority(recommendations);
}

function sortByPriority(recommendations: DomainRecommendation[]): DomainRecommendation[] {
  const priorityOrder = { HIGH: 1, MODERATE: 2, LOW: 3 };
  return recommendations.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
}
