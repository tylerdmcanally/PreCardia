import { PatientData, ClinicalCalculations, DomainRecommendation } from '../../types';
import { GUIDELINES } from '../../data/guidelines';
import { getSafetyRecommendationsForDomain } from '../safety';

export function generateDiabetesRecommendations(
  patientData: PatientData,
  calculations: ClinicalCalculations
): DomainRecommendation[] {
  const recommendations: DomainRecommendation[] = [
    ...getSafetyRecommendationsForDomain('DIABETES_CARDIORENAL', patientData, calculations),
  ];
  const { history, labs, medications } = patientData;
  const { egfr, ascvdRisk } = calculations;

  if (!history.diabetes) {
    return recommendations;
  }

  const a1c = labs.a1c || 0;
  const hasMetformin = medications.some((m) => m.genericName.toLowerCase().includes('metformin'));
  const hasSGLT2i = medications.some((m) => m.category === 'Diabetes - SGLT2i');
  const hasGLP1 = medications.some((m) => m.category === 'Diabetes - GLP-1 RA');
  const hasMRA = medications.some((m) => m.category === 'MRA');

  const hasASCVD = history.cad || history.priorMI || history.stroke || history.pad;
  const hasHF = history.heartFailure;
  const hasCKD = history.ckd || egfr < 60;
  const hasAlbuminuria = labs.uacr !== undefined && labs.uacr >= 30;

  const highCVRisk = hasASCVD || hasHF || hasCKD || ascvdRisk >= 15;

  // HIGH PRIORITY: Metformin if not on it
  if (!hasMetformin && egfr >= 30) {
    recommendations.push({
      priority: 'HIGH',
      action: 'ADD',
      medication: 'Metformin',
      recommendedDose: '500mg daily, titrate to 1000mg twice daily',
      rationale: 'First-line agent for type 2 diabetes; improves insulin sensitivity, no hypoglycemia risk, weight neutral',
      evidence: GUIDELINES.ADA_2024,
      monitoring: 'A1c at 3 months; titrate dose as tolerated for GI side effects',
      additionalNotes: egfr >= 30 && egfr < 45 ? 'eGFR 30-45: Use caution, max dose 1000mg BID' : undefined,
    });
  }

  // HIGH PRIORITY: SGLT2i for diabetes + high CV risk
  if (highCVRisk && !hasSGLT2i && egfr >= 20) {
    const indication = hasASCVD
      ? 'established CAD'
      : hasHF
      ? 'heart failure'
      : hasCKD
      ? 'CKD'
      : 'high cardiovascular risk';

    recommendations.push({
      priority: 'HIGH',
      action: 'ADD',
      medication: 'Empagliflozin',
      recommendedDose: '10mg daily',
      rationale: `Type 2 diabetes with ${indication}; SGLT2 inhibitors provide proven cardiovascular mortality reduction (25%) and renal protection`,
      evidence: GUIDELINES.ADA_2024,
      additionalNotes: 'EMPA-REG OUTCOME trial demonstrated CV benefit',
      monitoring:
        'eGFR may transiently dip 3-5 mL/min (expected hemodynamic effect, beneficial long-term); genital mycotic infections (10-15% incidence)',
    });
  }

  // HIGH PRIORITY: Finerenone for diabetic CKD with albuminuria
  if (history.ckd && hasAlbuminuria && egfr >= 25 && !hasMRA) {
    recommendations.push({
      priority: 'HIGH',
      action: 'ADD',
      medication: 'Finerenone',
      recommendedDose: egfr >= 60 ? '20mg daily' : '10mg daily (titrate to 20mg as tolerated)',
      rationale:
        'Type 2 diabetes with CKD and albuminuria qualifies for finerenone (nonsteroidal MRA) to slow renal decline and reduce CV events (FIDELIO/FIGARO).',
      evidence: GUIDELINES.KDIGO_2022,
      monitoring: 'Check potassium and creatinine at baseline, 4 weeks, then quarterly; hold if K+ >5.5.',
      additionalNotes: 'Ensure background ACE-I/ARB therapy is optimized before adding finerenone.',
    });
  }

  // MODERATE PRIORITY: GLP-1 RA for additional benefit
  if (highCVRisk && !hasGLP1 && a1c > 7) {
    recommendations.push({
      priority: 'MODERATE',
      action: 'CONSIDER',
      medication: 'Semaglutide',
      recommendedDose: '0.25mg weekly, titrate to 0.5-1mg weekly',
      rationale:
        'Dual therapy with SGLT2i + GLP-1 RA shows additive CV benefit in high-risk patients; additional A1c reduction 1-1.5% and weight loss 10-15 lbs',
      evidence: GUIDELINES.ADA_2024,
      additionalNotes:
        'SUSTAIN-6 trial demonstrated CV benefit; discuss cost, injection burden, and GI tolerability with patient',
      monitoring: 'Start low dose to minimize nausea; titrate every 4 weeks',
    });
  }

  const unableToUseSGLT2 = egfr > 0 && egfr < 20;
  if (highCVRisk && !hasGLP1 && unableToUseSGLT2) {
    recommendations.push({
      priority: 'MODERATE',
      action: 'ADD',
      medication: 'Semaglutide',
      recommendedDose: '0.25mg weekly, titrate to 1mg weekly as tolerated',
      rationale:
        'SGLT2 inhibitors are not feasible with current renal function; GLP-1 RA still provides ASCVD risk reduction per ACC/ADA guidance.',
      evidence: GUIDELINES.ADA_2024,
      monitoring: 'Review GI tolerance and weight trajectory; caution for medullary thyroid carcinoma history.',
      additionalNotes: 'Consider oral semaglutide if injections are a barrier and renal function allows.',
    });
  }

  return sortByPriority(recommendations);
}

function sortByPriority(recommendations: DomainRecommendation[]): DomainRecommendation[] {
  const priorityOrder = { HIGH: 1, MODERATE: 2, LOW: 3 };
  return recommendations.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
}
