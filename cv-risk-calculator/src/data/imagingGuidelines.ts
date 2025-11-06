/**
 * 2024 ACC/AHA/ASE/ASNC/HFSA/HRS/SCAI/SCCT/SCMR/STS
 * Appropriate Use Criteria for Multimodality Imaging in Cardiovascular Evaluation
 * of Patients Undergoing Nonemergent, Noncardiac Surgery
 * 
 * Reference: JACC 2024;84(15):1455-1491. doi:10.1016/j.jacc.2024.07.022
 */

export type ImagingModality = 
  | 'Echo' 
  | 'Stress Echo' 
  | 'ECG Stress' 
  | 'Nuclear Stress' 
  | 'PET Stress' 
  | 'CMR Stress'
  | 'CCTA';

export type AppropriatenessRating = 'A' | 'M' | 'R' | 'N/A';

export interface ImagingRecommendation {
  modality: ImagingModality;
  rating: AppropriatenessRating;
  median: number; // Median appropriateness score (1-9)
}

export interface ClinicalScenario {
  id: string;
  description: string;
  recommendations: ImagingRecommendation[];
}

/**
 * Surgical Risk Stratification
 * Based on 30-day risk of MACE (death or MI)
 */
export const SURGICAL_RISK_CATEGORIES = {
  LOW: {
    name: 'Low-risk',
    description: '<1% risk of MACE',
    examples: [
      'Breast surgery',
      'Dental procedures',
      'Endocrine (thyroid)',
      'Eye surgery',
      'Gynecologic minor',
      'Orthopedic minor (meniscectomy)',
      'Plastic/reconstructive',
      'Urologic minor (TURP)'
    ]
  },
  INTERMEDIATE: {
    name: 'Intermediate-risk',
    description: '1-5% risk of MACE',
    examples: [
      'Carotid endarterectomy (CEA)',
      'Endovascular AAA repair',
      'Head and neck surgery',
      'Intraperitoneal (splenectomy, hiatal hernia)',
      'Intrathoracic (nonmajor)',
      'Neurologic/orthopedic major (hip/spine)',
      'Peripheral arterial angioplasty',
      'Renal transplant'
    ]
  },
  HIGH: {
    name: 'High-risk nonvascular',
    description: '>5% risk of MACE',
    examples: [
      'Adrenal resection',
      'Bladder cystectomy',
      'Pancreatic/liver resection',
      'Esophagectomy',
      'Pneumonectomy',
      'Liver transplant',
      'Lung transplant'
    ]
  },
  HIGH_VASCULAR: {
    name: 'High-risk vascular',
    description: '>5% risk of MACE',
    examples: [
      'Aortic and major vascular surgery',
      'Open AAA repair',
      'Lower extremity revascularization'
    ]
  },
  TRANSPLANT: {
    name: 'Solid organ transplant',
    description: 'Kidney, liver, lung, pancreas, heart transplant evaluation',
    examples: [
      'Kidney transplant evaluation',
      'Liver transplant evaluation',
      'Lung transplant evaluation',
      'Pancreas transplant evaluation'
    ]
  }
} as const;

/**
 * Heart Failure Severity Classification
 */
export const HF_SEVERITY = {
  MILD: {
    name: 'Mild HF',
    criteria: 'NYHA Class I-II, no recent hospitalization'
  },
  MODERATE: {
    name: 'Moderate HF',
    criteria: 'NYHA Class III or hospitalization within 6 months'
  },
  SEVERE: {
    name: 'Severe HF',
    criteria: 'NYHA Class IV or hospitalization within 30 days'
  }
} as const;

/**
 * Section 1: No Known or Suspected Heart Disease and No Prior Testing Within 90-220 Days
 * 
 * Table 1.1: No New or Worsening Symptoms AND Functional Status ≥4 METs
 */
export const SECTION_1_TABLE_1: Record<string, ClinicalScenario> = {
  'low_risk': {
    id: '1.1.1',
    description: 'Low-risk surgery, no known heart disease, ≥4 METs, asymptomatic',
    recommendations: [
      { modality: 'Echo', rating: 'R', median: 1 },
      { modality: 'Stress Echo', rating: 'R', median: 1 },
      { modality: 'ECG Stress', rating: 'R', median: 1 },
      { modality: 'Nuclear Stress', rating: 'R', median: 1 },
      { modality: 'PET Stress', rating: 'R', median: 1 },
      { modality: 'CMR Stress', rating: 'R', median: 1 },
      { modality: 'CCTA', rating: 'R', median: 1 }
    ]
  },
  'intermediate_risk': {
    id: '1.1.2',
    description: 'Intermediate-risk surgery, no known heart disease, ≥4 METs, asymptomatic',
    recommendations: [
      { modality: 'Echo', rating: 'R', median: 2 },
      { modality: 'Stress Echo', rating: 'R', median: 1 },
      { modality: 'ECG Stress', rating: 'R', median: 1 },
      { modality: 'Nuclear Stress', rating: 'R', median: 1 },
      { modality: 'PET Stress', rating: 'R', median: 1 },
      { modality: 'CMR Stress', rating: 'R', median: 1 },
      { modality: 'CCTA', rating: 'R', median: 1 }
    ]
  },
  'high_risk_nonvascular': {
    id: '1.1.3',
    description: 'High-risk nonvascular surgery, no known heart disease, ≥4 METs, asymptomatic',
    recommendations: [
      { modality: 'Echo', rating: 'M', median: 5 },
      { modality: 'Stress Echo', rating: 'R', median: 3 },
      { modality: 'ECG Stress', rating: 'R', median: 2 },
      { modality: 'Nuclear Stress', rating: 'R', median: 2 },
      { modality: 'PET Stress', rating: 'R', median: 2 },
      { modality: 'CMR Stress', rating: 'R', median: 2 },
      { modality: 'CCTA', rating: 'R', median: 2 }
    ]
  },
  'high_risk_vascular': {
    id: '1.1.4',
    description: 'High-risk vascular surgery, no known heart disease, ≥4 METs, asymptomatic',
    recommendations: [
      { modality: 'Echo', rating: 'M', median: 6 },
      { modality: 'Stress Echo', rating: 'M', median: 4 },
      { modality: 'ECG Stress', rating: 'M', median: 4 },
      { modality: 'Nuclear Stress', rating: 'R', median: 3 },
      { modality: 'PET Stress', rating: 'R', median: 3 },
      { modality: 'CMR Stress', rating: 'R', median: 3 },
      { modality: 'CCTA', rating: 'R', median: 3 }
    ]
  },
  'transplant': {
    id: '1.1.5',
    description: 'Solid organ transplant evaluation, no known heart disease, ≥4 METs, asymptomatic',
    recommendations: [
      { modality: 'Echo', rating: 'A', median: 7 },
      { modality: 'Stress Echo', rating: 'M', median: 6 },
      { modality: 'ECG Stress', rating: 'M', median: 6 },
      { modality: 'Nuclear Stress', rating: 'M', median: 6 },
      { modality: 'PET Stress', rating: 'M', median: 6 },
      { modality: 'CMR Stress', rating: 'M', median: 5 },
      { modality: 'CCTA', rating: 'M', median: 5 }
    ]
  }
};

/**
 * Table 1.2: No New or Worsening Symptoms AND Functional Status <4 METs
 */
export const SECTION_1_TABLE_2: Record<string, ClinicalScenario> = {
  'low_risk': {
    id: '1.2.1',
    description: 'Low-risk surgery, no known heart disease, <4 METs, asymptomatic',
    recommendations: [
      { modality: 'Echo', rating: 'R', median: 2 },
      { modality: 'Stress Echo', rating: 'R', median: 1 },
      { modality: 'ECG Stress', rating: 'R', median: 1 },
      { modality: 'Nuclear Stress', rating: 'R', median: 1 },
      { modality: 'PET Stress', rating: 'R', median: 1 },
      { modality: 'CMR Stress', rating: 'R', median: 1 },
      { modality: 'CCTA', rating: 'R', median: 1 }
    ]
  },
  'intermediate_risk': {
    id: '1.2.2',
    description: 'Intermediate-risk surgery, no known heart disease, <4 METs, asymptomatic',
    recommendations: [
      { modality: 'Echo', rating: 'M', median: 4 },
      { modality: 'Stress Echo', rating: 'M', median: 4 },
      { modality: 'ECG Stress', rating: 'M', median: 4 },
      { modality: 'Nuclear Stress', rating: 'R', median: 3 },
      { modality: 'PET Stress', rating: 'R', median: 3 },
      { modality: 'CMR Stress', rating: 'R', median: 3 },
      { modality: 'CCTA', rating: 'R', median: 3 }
    ]
  },
  'high_risk_nonvascular': {
    id: '1.2.3',
    description: 'High-risk nonvascular surgery, no known heart disease, <4 METs, asymptomatic',
    recommendations: [
      { modality: 'Echo', rating: 'M', median: 6 },
      { modality: 'Stress Echo', rating: 'M', median: 5 },
      { modality: 'ECG Stress', rating: 'M', median: 5 },
      { modality: 'Nuclear Stress', rating: 'M', median: 4 },
      { modality: 'PET Stress', rating: 'M', median: 4 },
      { modality: 'CMR Stress', rating: 'M', median: 4 },
      { modality: 'CCTA', rating: 'M', median: 4 }
    ]
  },
  'high_risk_vascular': {
    id: '1.2.4',
    description: 'High-risk vascular surgery, no known heart disease, <4 METs, asymptomatic',
    recommendations: [
      { modality: 'Echo', rating: 'A', median: 7 },
      { modality: 'Stress Echo', rating: 'M', median: 6 },
      { modality: 'ECG Stress', rating: 'M', median: 6 },
      { modality: 'Nuclear Stress', rating: 'M', median: 5 },
      { modality: 'PET Stress', rating: 'M', median: 5 },
      { modality: 'CMR Stress', rating: 'M', median: 5 },
      { modality: 'CCTA', rating: 'M', median: 5 }
    ]
  },
  'transplant': {
    id: '1.2.5',
    description: 'Solid organ transplant evaluation, no known heart disease, <4 METs, asymptomatic',
    recommendations: [
      { modality: 'Echo', rating: 'A', median: 8 },
      { modality: 'Stress Echo', rating: 'A', median: 7 },
      { modality: 'ECG Stress', rating: 'A', median: 7 },
      { modality: 'Nuclear Stress', rating: 'A', median: 7 },
      { modality: 'PET Stress', rating: 'M', median: 6 },
      { modality: 'CMR Stress', rating: 'M', median: 6 },
      { modality: 'CCTA', rating: 'M', median: 6 }
    ]
  }
};

/**
 * Section 2: Known or Suspected Heart Disease and No Prior Testing Within 90-220 Days
 * 
 * Table 2.1: No New or Worsening Symptoms AND Functional Status ≥4 METs
 */
export const SECTION_2_TABLE_1: Record<string, Record<string, ClinicalScenario>> = {
  'cad_stable': {
    'low_risk': {
      id: '2.1.1',
      description: 'Low-risk surgery, stable CAD, ≥4 METs, asymptomatic',
      recommendations: [
        { modality: 'Echo', rating: 'R', median: 3 },
        { modality: 'Stress Echo', rating: 'R', median: 1 },
        { modality: 'ECG Stress', rating: 'R', median: 1 },
        { modality: 'Nuclear Stress', rating: 'R', median: 1 },
        { modality: 'PET Stress', rating: 'R', median: 1 },
        { modality: 'CMR Stress', rating: 'R', median: 1 },
        { modality: 'CCTA', rating: 'R', median: 1 }
      ]
    },
    'intermediate_risk': {
      id: '2.1.2',
      description: 'Intermediate-risk surgery, stable CAD, ≥4 METs, asymptomatic',
      recommendations: [
        { modality: 'Echo', rating: 'M', median: 4 },
        { modality: 'Stress Echo', rating: 'R', median: 3 },
        { modality: 'ECG Stress', rating: 'R', median: 3 },
        { modality: 'Nuclear Stress', rating: 'R', median: 2 },
        { modality: 'PET Stress', rating: 'R', median: 2 },
        { modality: 'CMR Stress', rating: 'R', median: 2 },
        { modality: 'CCTA', rating: 'R', median: 2 }
      ]
    },
    'high_risk': {
      id: '2.1.3',
      description: 'High-risk surgery, stable CAD, ≥4 METs, asymptomatic',
      recommendations: [
        { modality: 'Echo', rating: 'M', median: 6 },
        { modality: 'Stress Echo', rating: 'M', median: 5 },
        { modality: 'ECG Stress', rating: 'M', median: 5 },
        { modality: 'Nuclear Stress', rating: 'M', median: 4 },
        { modality: 'PET Stress', rating: 'M', median: 4 },
        { modality: 'CMR Stress', rating: 'M', median: 4 },
        { modality: 'CCTA', rating: 'R', median: 3 }
      ]
    }
  },
  'hf_mild': {
    'low_risk': {
      id: '2.1.4',
      description: 'Low-risk surgery, mild HF (NYHA I-II), ≥4 METs, asymptomatic',
      recommendations: [
        { modality: 'Echo', rating: 'M', median: 4 },
        { modality: 'Stress Echo', rating: 'R', median: 2 },
        { modality: 'ECG Stress', rating: 'R', median: 2 },
        { modality: 'Nuclear Stress', rating: 'R', median: 1 },
        { modality: 'PET Stress', rating: 'R', median: 1 },
        { modality: 'CMR Stress', rating: 'R', median: 1 },
        { modality: 'CCTA', rating: 'R', median: 1 }
      ]
    },
    'intermediate_risk': {
      id: '2.1.5',
      description: 'Intermediate-risk surgery, mild HF (NYHA I-II), ≥4 METs, asymptomatic',
      recommendations: [
        { modality: 'Echo', rating: 'M', median: 6 },
        { modality: 'Stress Echo', rating: 'M', median: 4 },
        { modality: 'ECG Stress', rating: 'M', median: 4 },
        { modality: 'Nuclear Stress', rating: 'R', median: 3 },
        { modality: 'PET Stress', rating: 'R', median: 3 },
        { modality: 'CMR Stress', rating: 'R', median: 3 },
        { modality: 'CCTA', rating: 'R', median: 2 }
      ]
    },
    'high_risk': {
      id: '2.1.6',
      description: 'High-risk surgery, mild HF (NYHA I-II), ≥4 METs, asymptomatic',
      recommendations: [
        { modality: 'Echo', rating: 'A', median: 7 },
        { modality: 'Stress Echo', rating: 'M', median: 6 },
        { modality: 'ECG Stress', rating: 'M', median: 6 },
        { modality: 'Nuclear Stress', rating: 'M', median: 5 },
        { modality: 'PET Stress', rating: 'M', median: 5 },
        { modality: 'CMR Stress', rating: 'M', median: 5 },
        { modality: 'CCTA', rating: 'R', median: 3 }
      ]
    }
  },
  'valvular': {
    'any_risk': {
      id: '2.1.7',
      description: 'Any surgery, known valvular heart disease, ≥4 METs, asymptomatic',
      recommendations: [
        { modality: 'Echo', rating: 'A', median: 8 },
        { modality: 'Stress Echo', rating: 'M', median: 5 },
        { modality: 'ECG Stress', rating: 'M', median: 4 },
        { modality: 'Nuclear Stress', rating: 'R', median: 3 },
        { modality: 'PET Stress', rating: 'R', median: 3 },
        { modality: 'CMR Stress', rating: 'M', median: 4 },
        { modality: 'CCTA', rating: 'R', median: 2 }
      ]
    }
  }
};

/**
 * Table 2.2: New or Worsening Symptoms OR Functional Status <4 METs
 */
export const SECTION_2_TABLE_2: Record<string, Record<string, ClinicalScenario>> = {
  'cad_unstable': {
    'any_risk': {
      id: '2.2.1',
      description: 'Any surgery, unstable CAD or new symptoms, <4 METs or symptomatic',
      recommendations: [
        { modality: 'Echo', rating: 'A', median: 7 },
        { modality: 'Stress Echo', rating: 'A', median: 7 },
        { modality: 'ECG Stress', rating: 'A', median: 7 },
        { modality: 'Nuclear Stress', rating: 'A', median: 7 },
        { modality: 'PET Stress', rating: 'M', median: 6 },
        { modality: 'CMR Stress', rating: 'M', median: 6 },
        { modality: 'CCTA', rating: 'M', median: 5 }
      ]
    }
  },
  'hf_moderate_severe': {
    'any_risk': {
      id: '2.2.2',
      description: 'Any surgery, moderate-severe HF (NYHA III-IV), <4 METs or symptomatic',
      recommendations: [
        { modality: 'Echo', rating: 'A', median: 9 },
        { modality: 'Stress Echo', rating: 'M', median: 6 },
        { modality: 'ECG Stress', rating: 'M', median: 5 },
        { modality: 'Nuclear Stress', rating: 'M', median: 5 },
        { modality: 'PET Stress', rating: 'M', median: 5 },
        { modality: 'CMR Stress', rating: 'M', median: 5 },
        { modality: 'CCTA', rating: 'R', median: 3 }
      ]
    }
  },
  'valvular_symptomatic': {
    'any_risk': {
      id: '2.2.3',
      description: 'Any surgery, valvular disease with new symptoms, <4 METs or symptomatic',
      recommendations: [
        { modality: 'Echo', rating: 'A', median: 9 },
        { modality: 'Stress Echo', rating: 'A', median: 7 },
        { modality: 'ECG Stress', rating: 'M', median: 6 },
        { modality: 'Nuclear Stress', rating: 'M', median: 5 },
        { modality: 'PET Stress', rating: 'M', median: 5 },
        { modality: 'CMR Stress', rating: 'M', median: 6 },
        { modality: 'CCTA', rating: 'R', median: 2 }
      ]
    }
  }
};

/**
 * Appropriateness Rating Definitions
 */
export const APPROPRIATENESS_DEFINITIONS = {
  A: {
    name: 'Appropriate',
    description: 'The test is generally acceptable and is a reasonable approach for the indication.',
    range: '7-9'
  },
  M: {
    name: 'May Be Appropriate',
    description: 'The test may be acceptable and may be a reasonable approach for the indication. Uncertainty implies that more research and/or patient information is needed.',
    range: '4-6'
  },
  R: {
    name: 'Rarely Appropriate',
    description: 'The test is not generally acceptable and is not a reasonable approach for the indication.',
    range: '1-3'
  }
} as const;

/**
 * Helper function to get surgical risk category from surgery type
 */
export function getSurgicalRiskCategory(surgeryType: string): keyof typeof SURGICAL_RISK_CATEGORIES | null {
  const lowerType = surgeryType.toLowerCase();
  
  // Check for transplant keywords
  if (lowerType.includes('transplant')) {
    return 'TRANSPLANT';
  }
  
  // Check for vascular keywords
  if (lowerType.includes('vascular') || lowerType.includes('aortic') || 
      lowerType.includes('aaa') || lowerType.includes('carotid')) {
    // Determine if high-risk vascular
    if (lowerType.includes('open') || lowerType.includes('major') || 
        lowerType.includes('lower extremity revascularization')) {
      return 'HIGH_VASCULAR';
    }
    return 'INTERMEDIATE';
  }
  
  // Check for high-risk nonvascular keywords
  const highRiskKeywords = ['pancrea', 'liver resection', 'esophagectomy', 
    'pneumonectomy', 'cystectomy', 'adrenal'];
  if (highRiskKeywords.some(keyword => lowerType.includes(keyword))) {
    return 'HIGH';
  }
  
  // Check for intermediate-risk keywords
  const intermediateKeywords = ['orthopedic major', 'hip', 'spine', 'intraperitoneal', 
    'intrathoracic', 'head and neck'];
  if (intermediateKeywords.some(keyword => lowerType.includes(keyword))) {
    return 'INTERMEDIATE';
  }
  
  // Default to low risk for minor procedures
  const lowRiskKeywords = ['breast', 'dental', 'eye', 'thyroid', 'minor'];
  if (lowRiskKeywords.some(keyword => lowerType.includes(keyword))) {
    return 'LOW';
  }
  
  return null;
}

