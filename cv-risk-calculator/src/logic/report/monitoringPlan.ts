import { ClinicalDomain, MonitoringPlan, PatientData, ClinicalCalculations } from '../../types';

export function buildMonitoringPlan(
  domains: ClinicalDomain[],
  patientData: PatientData,
  calculations: ClinicalCalculations
): MonitoringPlan {
  const plan: MonitoringPlan = {
    shortTerm: [],
    mediumTerm: [],
    longTerm: [],
  };

  const allRecs = domains.flatMap((d) => d.recommendations);

  // Short-term monitoring (1-4 weeks)
  const hasACEARB = allRecs.some(
    (r) =>
      (r.action === 'ADD' || r.action === 'INCREASE') &&
      (r.medication.toLowerCase().includes('lisinopril') || r.medication.toLowerCase().includes('losartan'))
  );

  const hasSGLT2i = allRecs.some(
    (r) =>
      r.medication.toLowerCase().includes('empagliflozin') || r.medication.toLowerCase().includes('dapagliflozin')
  );

  if (hasACEARB || hasSGLT2i) {
    plan.shortTerm.push({
      timing: '2 Weeks',
      tests: ['Basic metabolic panel (Cr, eGFR, K+, Na+)'],
      purpose: hasACEARB
        ? 'Safety check after ACE-I/ARB initiation/increase; baseline for SGLT2i'
        : 'Baseline renal function for SGLT2i',
      action: hasACEARB ? 'Hold ACE-I/ARB if K+ >5.5 or Cr increase >30%' : undefined,
    });
  }

  // Home BP monitoring
  const hasBPRecs = domains.some((d) => d.name === 'BLOOD_PRESSURE' && d.recommendations.length > 0);
  if (hasBPRecs) {
    plan.shortTerm.push({
      timing: 'Ongoing',
      tests: ['Home BP monitoring: 2 readings twice daily x 1 week, then weekly'],
      purpose: 'Assess response to BP medication changes',
    });
  }

  // Medium-term monitoring (3 months)
  const hasStatinChange = allRecs.some((r) => r.medication.toLowerCase().includes('statin'));
  if (hasStatinChange) {
    plan.mediumTerm.push({
      timing: '3 Months',
      tests: ['Lipid panel'],
      purpose: 'Assess LDL response to statin therapy',
      action: 'Consider adding ezetimibe if LDL not at goal',
    });
  }

  if (patientData.history.diabetes) {
    plan.mediumTerm.push({
      timing: '3 Months',
      tests: ['Hemoglobin A1c'],
      purpose: 'Assess glucose control (goal <7%)',
    });
  }

  if (hasACEARB || hasSGLT2i) {
    plan.mediumTerm.push({
      timing: '3 Months',
      tests: ['Basic metabolic panel'],
      purpose: 'Monitor renal function',
    });
  }

  // Long-term monitoring
  if (patientData.history.diabetes || patientData.history.ckd || calculations.egfr < 60) {
    plan.longTerm.push({
      timing: '6 Months',
      tests: ['Comprehensive metabolic panel', 'Urine albumin-to-creatinine ratio (UACR)'],
      purpose: 'Monitor proteinuria in CKD/diabetes; guides ACE-I effectiveness',
    });
  }

  plan.longTerm.push({
    timing: 'Annually',
    tests: ['Reassess ASCVD risk, review all risk factors', 'Comprehensive labs (CMP, lipids, A1c, UACR)'],
    purpose: 'Comprehensive cardiovascular risk reassessment',
  });

  return plan;
}
