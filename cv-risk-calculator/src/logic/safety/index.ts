import { ClinicalCalculations, DomainName, DomainRecommendation, PatientData } from '../../types';
import { getContraindicationAlerts } from './contraindications';
import { getInteractionAlerts } from './interactions';
import { getDoseAdjustmentAlerts } from './doseAdjustments';
import { SafetyCheckResult } from '../../types';

export function getSafetyRecommendationsForDomain(
  domain: DomainName,
  patientData: PatientData,
  calculations: ClinicalCalculations
): DomainRecommendation[] {
  const alerts: SafetyCheckResult[] = [
    ...getContraindicationAlerts(patientData, calculations),
    ...getInteractionAlerts(patientData),
    ...getDoseAdjustmentAlerts(patientData, calculations),
  ];

  return alerts
    .filter((alert) => alert.domain === domain)
    .map((alert) => alert.recommendation);
}

export { hasAllergyToAnyCategory, hasAllergyToCategory } from './utils';

export { hasRAASSafetyHold, hasMRASafetyHold } from './contraindications';
