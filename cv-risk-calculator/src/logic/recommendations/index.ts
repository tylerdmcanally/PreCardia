import { PatientData, ClinicalCalculations, ClinicalDomain, DomainName } from '../../types';
import { generateBPRecommendations } from './bloodPressure';
import { generateLipidRecommendations } from './lipids';
import { generateDiabetesRecommendations } from './diabetes';
import { generateHeartFailureRecommendations } from './heartFailure';
import { generateAnticoagulationRecommendations } from './anticoagulation';
import { getSafetyRecommendationsForDomain } from '../safety';
import { guardProposedTherapy } from '../safety/utils';
import { generateLifestyleRecommendations } from './lifestyle';

const DOMAIN_DISPLAY_NAMES: Record<DomainName, string> = {
  BLOOD_PRESSURE: 'BLOOD PRESSURE MANAGEMENT',
  LIPID_MANAGEMENT: 'LIPID MANAGEMENT',
  DIABETES_CARDIORENAL: 'DIABETES & CARDIORENAL PROTECTION',
  HEART_FAILURE: 'HEART FAILURE MANAGEMENT',
  ANTIPLATELET_ANTICOAGULATION: 'ANTIPLATELET & ANTICOAGULATION',
  RISK_FACTOR_MODIFICATION: 'RISK FACTOR MODIFICATION',
};

export function generateAllDomainRecommendations(
  patientData: PatientData,
  calculations: ClinicalCalculations
): ClinicalDomain[] {
  const domains: ClinicalDomain[] = [];

  // Blood Pressure Domain
  const bpRecs = generateBPRecommendations(patientData, calculations);
  if (bpRecs.length > 0) {
    domains.push({
      name: 'BLOOD_PRESSURE',
      displayName: DOMAIN_DISPLAY_NAMES.BLOOD_PRESSURE,
      currentStatus: calculations.bpClassification === 'Not assessed' ? 'BP not assessed' : `Current: ${calculations.averageBP.systolic}/${calculations.averageBP.diastolic} | Target: <${calculations.bpTarget.systolic}/${calculations.bpTarget.diastolic}`,
      recommendations: bpRecs,
      order: 1,
    });
  }

  if (calculations.bpClassification === 'Hypertensive Crisis' || (patientData.labs.potassium ?? 0) >= 6) {
    // Keep actionable safety findings for current drugs while deferring routine starts.
    for (const domain of ['HEART_FAILURE', 'DIABETES_CARDIORENAL', 'ANTIPLATELET_ANTICOAGULATION'] as const) {
      bpRecs.push(...getSafetyRecommendationsForDomain(domain, patientData, calculations)
        .filter(rec => rec.priority === 'HIGH' && ['HOLD', 'DISCONTINUE', 'ADJUST'].includes(rec.action)));
    }
    return domains;
  }

  // Lipid Domain
  const lipidRecs = generateLipidRecommendations(patientData, calculations);
  if (lipidRecs.length > 0) {
    domains.push({
      name: 'LIPID_MANAGEMENT',
      displayName: DOMAIN_DISPLAY_NAMES.LIPID_MANAGEMENT,
      currentStatus: `Current LDL: ${patientData.labs.ldl || 'N/A'} mg/dL | Goal: <${calculations.ldlGoal} mg/dL`,
      recommendations: lipidRecs,
      order: 2,
    });
  }

  // Diabetes Domain
  const diabetesRecs = generateDiabetesRecommendations(patientData, calculations);
  if (diabetesRecs.length > 0) {
    domains.push({
      name: 'DIABETES_CARDIORENAL',
      displayName: DOMAIN_DISPLAY_NAMES.DIABETES_CARDIORENAL,
      currentStatus: `A1c: ${patientData.labs.a1c || 'N/A'}% (goal <${calculations.a1cGoal}%) | eGFR: ${
        calculations.egfr ?? 'Unknown'
      } mL/min/1.73m2`,
      recommendations: diabetesRecs,
      order: 3,
    });
  }

  // Heart Failure Domain
  const hfRecs = generateHeartFailureRecommendations(patientData, calculations);
  if (hfRecs.length > 0) {
    const efStatus = patientData.history.ejectionFraction
      ? `EF: ${patientData.history.ejectionFraction}%`
      : 'EF: Not documented';
    domains.push({
      name: 'HEART_FAILURE',
      displayName: DOMAIN_DISPLAY_NAMES.HEART_FAILURE,
      currentStatus: efStatus,
      recommendations: hfRecs,
      order: 4,
    });
  }

  // Anticoagulation & Antiplatelet Domain (Atrial Fibrillation and/or CAD/MI)
  const anticoagRecs = generateAnticoagulationRecommendations(patientData, calculations);
  if (anticoagRecs.length > 0) {
    let currentStatus = '';

    // Build status based on what's relevant
    if (calculations.cha2ds2vasc && (patientData.history.cad || patientData.history.priorMI)) {
      // Patient has BOTH AF and CAD/MI
      const { score, riskCategory, annualStrokeRisk } = calculations.cha2ds2vasc;
      currentStatus = `AF: CHA2DS2-VASc ${score} (${riskCategory} risk, ${annualStrokeRisk} annual stroke risk) | CAD/MI: Review combined antithrombotic plan`;
    } else if (calculations.cha2ds2vasc) {
      // Patient has AF only
      const { score, riskCategory, annualStrokeRisk } = calculations.cha2ds2vasc;
      currentStatus = `CHA2DS2-VASc: ${score} (${riskCategory} risk, ${annualStrokeRisk} annual stroke risk)`;
    } else if (patientData.history.cad || patientData.history.priorMI) {
      // Patient has CAD/MI only (no AF)
      currentStatus = patientData.history.priorMI
        ? 'Prior MI: confirm event timing and antiplatelet plan'
        : 'Stable CAD: review secondary-prevention antiplatelet therapy';
    }

    domains.push({
      name: 'ANTIPLATELET_ANTICOAGULATION',
      displayName: DOMAIN_DISPLAY_NAMES.ANTIPLATELET_ANTICOAGULATION,
      currentStatus,
      recommendations: anticoagRecs,
      order: 5,
    });
  }

  // Lifestyle Domain
  const lifestyleRecs = generateLifestyleRecommendations(patientData, calculations);
  if (lifestyleRecs.length > 0) {
    domains.push({
      name: 'RISK_FACTOR_MODIFICATION',
      displayName: DOMAIN_DISPLAY_NAMES.RISK_FACTOR_MODIFICATION,
      currentStatus: '',
      recommendations: lifestyleRecs,
      order: 6,
    });
  }

  return domains.map(domain => ({ ...domain, recommendations: domain.recommendations.map(rec => guardProposedTherapy(rec, patientData.allergies)) })).sort((a, b) => a.order - b.order);
}

export * from './bloodPressure';
export * from './lipids';
export * from './diabetes';
export * from './heartFailure';
export * from './anticoagulation';
export * from './lifestyle';
