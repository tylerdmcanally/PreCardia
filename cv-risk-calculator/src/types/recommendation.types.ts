export type Priority = 'HIGH' | 'MODERATE' | 'LOW';
export type Action = 'ADD' | 'INCREASE' | 'DECREASE' | 'DISCONTINUE' | 'CONTINUE' | 'CONSIDER' | 'HOLD' | 'ADJUST' | 'SWITCH' | 'EVALUATE' | 'MONITOR' | 'DEFER';

export interface DomainRecommendation {
  priority: Priority;
  action: Action;
  medication: string;
  currentDose?: string;
  recommendedDose?: string;
  rationale: string;
  evidence: string;
  monitoring?: string;
  additionalNotes?: string;
}

export type SafetyCheckSource = 'CONTRAINDICATION' | 'INTERACTION' | 'DOSE_ADJUSTMENT';

export interface SafetyCheckResult {
  domain: DomainName;
  recommendation: DomainRecommendation;
  source: SafetyCheckSource;
}

export type DomainName =
  | 'BLOOD_PRESSURE'
  | 'LIPID_MANAGEMENT'
  | 'DIABETES_CARDIORENAL'
  | 'HEART_FAILURE'
  | 'ANTIPLATELET_ANTICOAGULATION'
  | 'RISK_FACTOR_MODIFICATION';

export interface ClinicalDomain {
  name: DomainName;
  displayName: string;
  currentStatus: string;
  recommendations: DomainRecommendation[];
  order: number;
}

export interface MedicationReviewItem {
  medication: string;
  status: string;
}

export interface MedicationReview {
  continue: MedicationReviewItem[];
  optimize: MedicationReviewItem[];
  discontinue: MedicationReviewItem[];
}

export interface MonitoringItem {
  timing: string;
  tests: string[];
  purpose: string;
  action?: string;
}

export interface MonitoringPlan {
  shortTerm: MonitoringItem[];
  mediumTerm: MonitoringItem[];
  longTerm: MonitoringItem[];
}

export interface ClinicalReport {
  header: string;
  riskProfile: string;
  medicationReview: MedicationReview;
  domains: ClinicalDomain[];
  monitoringPlan: MonitoringPlan;
  followUpPlan: string;
  references: string;
}
