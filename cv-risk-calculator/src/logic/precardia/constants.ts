// PreCardia Constants

import { SurgicalRisk } from '../../types/precardia.types';

export const SURGICAL_RISK: Record<string, SurgicalRisk> = {
  'low-endoscopic': { level: 'Low', risk: '<1%', description: 'Endoscopic procedures' },
  'low-superficial': { level: 'Low', risk: '<1%', description: 'Superficial procedures' },
  'low-cataract': { level: 'Low', risk: '<1%', description: 'Cataract surgery' },
  'low-breast': { level: 'Low', risk: '<1%', description: 'Breast surgery' },
  'intermediate-intraperitoneal': { level: 'Intermediate', risk: '1-5%', description: 'Intraperitoneal surgery' },
  'intermediate-intrathoracic': { level: 'Intermediate', risk: '1-5%', description: 'Intrathoracic surgery' },
  'intermediate-carotid': { level: 'Intermediate', risk: '1-5%', description: 'Carotid endarterectomy' },
  'intermediate-head': { level: 'Intermediate', risk: '1-5%', description: 'Head and neck surgery' },
  'intermediate-orthopedic': { level: 'Intermediate', risk: '1-5%', description: 'Orthopedic surgery' },
  'intermediate-prostate': { level: 'Intermediate', risk: '1-5%', description: 'Prostate surgery' },
  'high-aortic': { level: 'High', risk: '>5%', description: 'Aortic and major vascular surgery' },
  'high-peripheral': { level: 'High', risk: '>5%', description: 'Peripheral vascular surgery' },
  'high-emergency': { level: 'High', risk: '>5%', description: 'Emergency major surgery' },
  'other': { level: 'Variable', risk: 'Variable', description: 'Other surgery' }
};

export const RCRI_HIGH_RISK_SURGERIES = new Set([
  'intermediate-intraperitoneal',
  'intermediate-intrathoracic',
  'high-aortic',
  'high-peripheral'
]);

export const TROPONIN_ASSAY_LIMITS: Record<string, { label: string; neutral: number; female?: number; male?: number }> = {
  'roche-elecsys-hs-ctnt': {
    label: 'Roche Elecsys hs-cTnT',
    neutral: 0.014
  },
  'abbott-alinity-architect-hs-ctni': {
    label: 'Abbott Alinity/Architect hs-cTnI',
    female: 0.016,
    male: 0.034,
    neutral: 0.034
  },
  'siemens-atellica-hs-ctni': {
    label: 'Siemens Atellica IM hs-cTnI',
    female: 0.023,
    male: 0.045,
    neutral: 0.045
  },
  'beckman-access-hs-ctni': {
    label: 'Beckman Coulter Access hs-cTnI',
    female: 0.014,
    male: 0.020,
    neutral: 0.020
  },
  'ortho-vitros-hs-ctni': {
    label: 'Ortho Clinical Diagnostics VITROS hs-cTnI',
    female: 0.010,
    male: 0.011,
    neutral: 0.011
  }
};

export const METS_VALUES: Record<string, { value: string; description: string }> = {
  'excellent': { value: '>10', description: 'Excellent (>10 METs)' },
  'good': { value: '7-10', description: 'Good (7-10 METs)' },
  'moderate': { value: '4-7', description: 'Moderate (4-7 METs)' },
  'poor': { value: '<4', description: 'Poor (<4 METs)' },
  'unknown': { value: 'Unknown', description: 'Unknown / Unable to assess' }
};

export const DASI_WEIGHTS = [2.75, 1.75, 2.75, 5.5, 8.0, 2.7, 3.5, 8.0, 4.5, 5.25, 6.0, 7.5];
