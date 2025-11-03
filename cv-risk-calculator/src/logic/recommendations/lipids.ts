import { PatientData, ClinicalCalculations, DomainRecommendation } from '../../types';
import { GUIDELINES } from '../../data/guidelines';

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

  const currentStatin = medications.find((m) => m.category === 'Statin');
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
      rationale: 'Clinical ASCVD (secondary prevention) requires high-intensity statin therapy with LDL goal <70 mg/dL',
      evidence: GUIDELINES.CHOLESTEROL_2018,
      monitoring: 'Lipid panel at 3 months to assess LDL response',
    });
  }

  // HIGH PRIORITY: Upgrade to high-intensity if on moderate
  if (hasASCVD && currentStatin && !isHighIntensity) {
    const isAtorvastatin = currentStatin.genericName.toLowerCase().includes('atorvastatin');
    const isRosuvastatin = currentStatin.genericName.toLowerCase().includes('rosuvastatin');

    let newDose = '40mg daily';
    if (isRosuvastatin) newDose = '20mg daily';

    recommendations.push({
      priority: 'HIGH',
      action: 'INCREASE',
      medication: currentStatin.genericName,
      currentDose: currentStatin.dose,
      recommendedDose: newDose,
      rationale: `Clinical ASCVD requires high-intensity statin therapy with LDL goal <${ldlGoal} mg/dL for secondary prevention`,
      evidence: GUIDELINES.CHOLESTEROL_2018,
      monitoring: 'Lipid panel at 3 months to assess LDL response',
    });
  }

  // MODERATE PRIORITY: Add ezetimibe if LDL not at goal
  if (hasASCVD && isHighIntensity && ldl >= ldlGoal) {
    if (!hasEzetimibe) {
      recommendations.push({
        priority: 'MODERATE',
        action: 'ADD',
        medication: 'Ezetimibe',
        recommendedDose: '10mg daily',
        rationale: `LDL ${ldl} mg/dL on maximally tolerated statin remains above goal <${ldlGoal}; ezetimibe lowers LDL an additional 15–20%.`,
        evidence: GUIDELINES.CHOLESTEROL_2018,
        additionalNotes: 'IMPROVE-IT: ezetimibe + simvastatin reduced CV events post-ACS.',
      });
    } else if (!hasPCSK9 && ldl >= 70 && hasASCVD) {
      const veryHighRiskMajorEvents = [history.priorMI, history.stroke, history.pad].filter(Boolean).length;
      const veryHighRiskConditions = [
        history.diabetes,
        history.ckd,
        history.hypertension,
        demographics.age >= 65,
        demographics.smokingStatus !== 'never',
      ].filter(Boolean).length;
      const isVeryHighRisk = veryHighRiskMajorEvents >= 2 || (veryHighRiskMajorEvents === 1 && veryHighRiskConditions >= 2);

      if (isVeryHighRisk) {
        recommendations.push({
          priority: 'HIGH',
          action: 'CONSIDER',
          medication: 'PCSK9 inhibitor (evolocumab or alirocumab)',
          recommendedDose: 'Evolocumab 140mg SC every 2 weeks or 420mg monthly; Alirocumab 75-150mg SC every 2 weeks',
          rationale: `Very-high-risk ASCVD with LDL ${ldl} mg/dL despite maximally tolerated statin plus ezetimibe. PCSK9 inhibitor recommended to achieve LDL <55-70 mg/dL per ACC guidance.`,
          evidence: GUIDELINES.CHOLESTEROL_2018,
          monitoring: 'Arrange prior authorization; repeat lipid panel 4-12 weeks after initiation.',
          additionalNotes: 'FOURIER/ODYSSEY OUTCOMES demonstrated CV event reduction with PCSK9 inhibition.',
        });
      }
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
      }-intensity statin for primary prevention`,
      evidence: GUIDELINES.CHOLESTEROL_2018,
      monitoring: 'Lipid panel at 3 months',
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
        'LDL ≥190 mg/dL (severe hypercholesterolemia) requires high-intensity statin regardless of ASCVD risk',
      evidence: GUIDELINES.CHOLESTEROL_2018,
      monitoring: 'Lipid panel at 3 months; consider adding ezetimibe if LDL remains >190',
    });
  }

  // Handle hypertriglyceridemia
  if (triglycerides >= 500) {
    recommendations.push({
      priority: 'HIGH',
      action: 'ADD',
      medication: 'Fenofibrate or omega-3 (icosapent ethyl)',
      recommendedDose: 'Fenofibrate 145mg daily or Icosapent ethyl 2g twice daily',
      rationale: `Triglycerides ${triglycerides} mg/dL: reduce pancreatitis risk with fibrate or high-dose omega-3 in addition to statin.`,
      evidence: GUIDELINES.CHOLESTEROL_2018,
      monitoring: 'Recheck lipid panel in 6-12 weeks; monitor hepatic function and myalgia when combined with statin.',
    });
  } else if (triglycerides >= 150 && hasASCVD && currentStatin) {
    recommendations.push({
      priority: 'MODERATE',
      action: 'CONSIDER',
      medication: 'Icosapent ethyl',
      recommendedDose: '2g twice daily',
      rationale: `Persistent triglycerides ${triglycerides} mg/dL despite statin; REDUCE-IT supports Icosapent ethyl for ASCVD risk reduction.`,
      evidence: GUIDELINES.CHOLESTEROL_2018,
      monitoring: 'Assess adherence and monitor for atrial fibrillation or bleeding risk when combined with antithrombotics.',
    });
  }

  // Patients >75 years with ASCVD benefit from at least moderate-intensity statin if not already receiving therapy
  if (hasASCVD && demographics.age > 75 && !currentStatin) {
    recommendations.push({
      priority: 'HIGH',
      action: 'ADD',
      medication: 'Rosuvastatin',
      recommendedDose: '10mg daily',
      rationale: 'Age >75 with clinical ASCVD: initiate moderate- to high-intensity statin after shared decision-making per ACC/AHA.',
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
