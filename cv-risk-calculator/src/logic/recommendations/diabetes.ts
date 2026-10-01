import { PatientData, ClinicalCalculations, DomainRecommendation } from '../../types';
import { GUIDELINES } from '../../data/guidelines';
import { getSafetyRecommendationsForDomain } from '../safety';
import { hasMedicationInCategory } from '../safety/utils';

export function generateDiabetesRecommendations(patientData: PatientData, calculations: ClinicalCalculations): DomainRecommendation[] {
  const recommendations = getSafetyRecommendationsForDomain('DIABETES_CARDIORENAL', patientData, calculations);
  const { history, labs, medications } = patientData;
  const { egfr } = calculations;
  if (!history.diabetes) return recommendations;
  const evidence = GUIDELINES.ADA_2026;
  const hasMetformin = hasMedicationInCategory(medications,'Diabetes - Metformin');
  const hasSGLT2i = hasMedicationInCategory(medications,'Diabetes - SGLT2i');
  const hasGLP1 = hasMedicationInCategory(medications,'Diabetes - GLP-1 RA');
  const hasMRA = hasMedicationInCategory(medications,'MRA');
  const hasRaas = hasMedicationInCategory(medications,'ACE Inhibitor') || hasMedicationInCategory(medications,'ARB');
  const hasASCVD = history.cad || history.priorMI || history.priorPCI || history.stroke || history.tia || history.pad;
  const highCVRisk = hasASCVD || history.heartFailure || history.ckd
    || (calculations.preventRisks.totalCVD_10yr !== null && calculations.preventRisks.totalCVD_10yr >= 7.5);

  if (egfr === null) recommendations.push({priority:'HIGH',action:'EVALUATE',medication:'Kidney function before diabetes medication changes',evidence,
    rationale:'Kidney function is unknown. Obtain current renal measurements before selecting or dosing renally dependent therapies.'});
  if (history.dialysis) recommendations.push({priority:'HIGH',action:'EVALUATE',medication:'Diabetes regimen on dialysis',evidence,
    rationale:'Metformin is contraindicated and SGLT2 inhibitors should not be initiated on dialysis. Individualize glucose-lowering therapy with nephrology/endocrinology.'});
  if (!hasMetformin && egfr !== null && egfr >= 45 && !history.dialysis) recommendations.push({priority:'MODERATE',action:'CONSIDER',medication:'Metformin',
    recommendedDose:'500mg daily with food; titrate to glycemic need and tolerability',evidence,
    rationale:'Metformin may be used for glycemic management; treatment should reflect A1c, existing therapy and comorbidities. Cardioprotective therapy is not contingent on metformin use.',
    monitoring:'Review contraindications, renal function and B12; reassess A1c in about 3 months.'});
  if (!hasMetformin && egfr !== null && egfr >= 30 && egfr < 45 && !history.dialysis) recommendations.push({priority:'MODERATE',action:'DEFER',medication:'New metformin initiation',evidence:GUIDELINES.DRUG_LABELS,
    rationale:'US labeling does not recommend initiating metformin at eGFR 30–44. For existing therapy, review benefit/risk and limit total daily dose to 1000mg per ADA/KDIGO guidance.'});
  // HF module handles the HF SGLT2 indication, avoiding two simultaneous starts.
  if (highCVRisk && !history.heartFailure && !hasSGLT2i && egfr !== null && egfr >= 20 && !history.dialysis) recommendations.push({priority:'HIGH',action:'CONSIDER',medication:'Empagliflozin',recommendedDose:'10mg daily if eligible',evidence,
    rationale:'Type 2 diabetes with ASCVD, CKD or elevated cardiovascular risk supports an SGLT2 inhibitor with demonstrated benefit, independent of A1c.',
    monitoring:'Confirm indication-specific renal eligibility, volume status, ketoacidosis risk and contraindications; discuss sick-day and perioperative holds.'});
  if (history.ckd && (labs.uacr ?? 0) >= 30 && !hasMRA && !history.dialysis) {
    const eligible = egfr !== null && egfr >= 25 && labs.potassium !== undefined && labs.potassium <= 5 && hasRaas;
    recommendations.push({priority:'HIGH',action:history.heartFailure ? 'EVALUATE' : eligible ? 'CONSIDER' : 'DEFER',medication:'Finerenone',
      recommendedDose:eligible && !history.heartFailure ? (egfr >= 60 ? '20mg daily if eligible' : '10mg daily if eligible') : undefined,
      rationale:history.heartFailure ? 'Coordinate the HF and diabetic CKD MRA strategy. Do not start finerenone together with spironolactone or eplerenone; select one appropriate agent after confirming EF and indications.' : eligible ? 'T2D with albuminuric CKD: confirm persistent albuminuria despite maximally tolerated ACE-I/ARB before adding finerenone.'
        : 'Do not initiate until eGFR ≥25, potassium ≤5.0, persistent albuminuria and background ACE-I/ARB treatment are confirmed. Missing potassium is not a normal result.',
      evidence:`${GUIDELINES.CKD_2024}; ${GUIDELINES.DRUG_LABELS}`,
      monitoring:'Review interactions. Check potassium/eGFR before initiation and at 4 weeks; additional early potassium monitoring when baseline K is >4.8–5.0.'});
  }
  if (highCVRisk && !hasGLP1) recommendations.push({priority:'MODERATE',action:'CONSIDER',medication:'GLP-1 receptor agonist with demonstrated cardiovascular benefit',
    rationale:'For T2D with ASCVD/high risk or CKD, consider a GLP-1 RA for cardiovascular/kidney benefit independent of current A1c or metformin use.',evidence,
    monitoring:'Select an agent with evidence for the intended outcome; review contraindications, GI tolerance, other glucose-lowering therapy, cost and preferences. Dialysis requires individualized specialist review.'});
  return recommendations;
}
