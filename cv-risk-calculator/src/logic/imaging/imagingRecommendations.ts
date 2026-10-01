// LEGACY: not used by PreCardia. These simplified AUC tables are not the 2026 guideline
// decision pathway and must not be used for clinical output without a separate source audit.
/**
 * Logic for determining appropriate preoperative imaging based on
 * 2024 ACC/AHA Appropriate Use Criteria
 */

import {
  SECTION_1_TABLE_1,
  SECTION_1_TABLE_2,
  SECTION_2_TABLE_1,
  SECTION_2_TABLE_2,
  SURGICAL_RISK_CATEGORIES,
  getSurgicalRiskCategory,
  type ClinicalScenario,
  type ImagingRecommendation
} from '../../data/imagingGuidelines';

export interface ImagingInput {
  // Patient characteristics
  hasKnownHeartDisease: boolean;
  hasNewOrWorseningSymptoms: boolean;
  functionalCapacityMETs: number | null;
  
  // Cardiac conditions
  hasCAD: boolean;
  hasHeartFailure: boolean;
  heartFailureClass?: 'I' | 'II' | 'III' | 'IV'; // NYHA class
  hasValvularDisease: boolean;
  hasRecentMI: boolean; // Within 6 months
  hasRecentHFHospitalization: boolean; // Within 6 months
  
  // Surgery details
  surgeryType: string;
  surgeryRisk?: 'LOW' | 'INTERMEDIATE' | 'HIGH' | 'HIGH_VASCULAR' | 'TRANSPLANT';
  
  // Prior testing
  hasPriorTestingWithin90Days: boolean;
}

export interface ImagingOutput {
  section: number;
  sectionDescription: string;
  scenario: ClinicalScenario;
  summary: string;
  appropriateModalities: ImagingRecommendation[];
  mayBeAppropriateModalities: ImagingRecommendation[];
  rarelyAppropriateModalities: ImagingRecommendation[];
  clinicalGuidance: string[];
}

/**
 * Determine if patient has adequate functional capacity (≥4 METs)
 */
function hasAdequateFunctionalCapacity(mets: number | null): boolean {
  if (mets === null) return false;
  return mets >= 4;
}

/**
 * Determine heart failure severity
 */
function getHFSeverity(nyhaClass?: 'I' | 'II' | 'III' | 'IV', recentHospitalization?: boolean): 'mild' | 'moderate' | 'severe' {
  if (nyhaClass === 'IV') return 'severe';
  if (nyhaClass === 'III' || recentHospitalization) return 'moderate';
  return 'mild';
}

/**
 * Get surgical risk category key for table lookup
 */
function getSurgeryRiskKey(surgeryRisk: string): string {
  switch (surgeryRisk) {
    case 'LOW':
      return 'low_risk';
    case 'INTERMEDIATE':
      return 'intermediate_risk';
    case 'HIGH':
      return 'high_risk_nonvascular';
    case 'HIGH_VASCULAR':
      return 'high_risk_vascular';
    case 'TRANSPLANT':
      return 'transplant';
    default:
      return 'intermediate_risk';
  }
}

/**
 * Main function to get imaging recommendations
 */
export function getImagingRecommendations(input: ImagingInput): ImagingOutput {
  const hasGoodFunctionalCapacity = hasAdequateFunctionalCapacity(input.functionalCapacityMETs);
  const isSymptomaticOrPoorCapacity = input.hasNewOrWorseningSymptoms || !hasGoodFunctionalCapacity;
  
  // Determine surgery risk if not provided
  const surgeryRisk = input.surgeryRisk || getSurgicalRiskCategory(input.surgeryType) || 'INTERMEDIATE';
  const surgeryRiskKey = getSurgeryRiskKey(surgeryRisk);
  
  let scenario: ClinicalScenario;
  let section: number;
  let sectionDescription: string;
  const clinicalGuidance: string[] = [];
  
  // Section 1: No Known or Suspected Heart Disease
  if (!input.hasKnownHeartDisease) {
    section = 1;
    sectionDescription = 'No Known or Suspected Heart Disease';
    
    if (hasGoodFunctionalCapacity && !input.hasNewOrWorseningSymptoms) {
      // Table 1.1
      scenario = SECTION_1_TABLE_1[surgeryRiskKey];
      clinicalGuidance.push('Patient has good functional capacity (≥4 METs) without cardiac symptoms.');
      clinicalGuidance.push('Routine preoperative cardiac imaging is generally not indicated for low-intermediate risk surgery.');
    } else {
      // Table 1.2
      scenario = SECTION_1_TABLE_2[surgeryRiskKey];
      clinicalGuidance.push('Patient has limited functional capacity (<4 METs) or new symptoms.');
      clinicalGuidance.push('Consider cardiac imaging for risk stratification, especially for intermediate-high risk surgery.');
    }
  }
  // Section 2: Known or Suspected Heart Disease
  else {
    section = 2;
    sectionDescription = 'Known or Suspected Heart Disease';
    
    // Determine cardiac condition category
    let conditionCategory: string;
    
    if (input.hasCAD) {
      if (isSymptomaticOrPoorCapacity || input.hasRecentMI) {
        // Table 2.2 - Unstable CAD
        conditionCategory = 'cad_unstable';
        scenario = SECTION_2_TABLE_2[conditionCategory]['any_risk'];
        clinicalGuidance.push('Patient has CAD with new/worsening symptoms or recent MI.');
        clinicalGuidance.push('Cardiac stress testing is appropriate to assess for active ischemia.');
        clinicalGuidance.push('Consider revascularization if significant ischemia detected.');
      } else {
        // Table 2.1 - Stable CAD
        conditionCategory = 'cad_stable';
        const riskKey = surgeryRisk === 'HIGH' || surgeryRisk === 'HIGH_VASCULAR' ? 'high_risk' : surgeryRiskKey;
        scenario = SECTION_2_TABLE_1[conditionCategory][riskKey];
        clinicalGuidance.push('Patient has stable CAD with good functional capacity.');
        clinicalGuidance.push('Imaging may be appropriate for high-risk surgery.');
      }
    }
    else if (input.hasHeartFailure) {
      const hfSeverity = getHFSeverity(input.heartFailureClass, input.hasRecentHFHospitalization);
      
      if (hfSeverity === 'moderate' || hfSeverity === 'severe' || isSymptomaticOrPoorCapacity) {
        // Table 2.2 - Moderate-Severe HF
        conditionCategory = 'hf_moderate_severe';
        scenario = SECTION_2_TABLE_2[conditionCategory]['any_risk'];
        clinicalGuidance.push(`Patient has ${hfSeverity} heart failure (NYHA ${input.heartFailureClass || 'III-IV'}).`);
        clinicalGuidance.push('Echocardiography is appropriate to assess cardiac function and guide perioperative management.');
        clinicalGuidance.push('Optimize HF therapy before elective surgery.');
      } else {
        // Table 2.1 - Mild HF
        conditionCategory = 'hf_mild';
        const riskKey = surgeryRisk === 'HIGH' || surgeryRisk === 'HIGH_VASCULAR' ? 'high_risk' : surgeryRiskKey;
        scenario = SECTION_2_TABLE_1[conditionCategory][riskKey];
        clinicalGuidance.push('Patient has mild heart failure (NYHA I-II) with good functional capacity.');
        clinicalGuidance.push('Echo may be appropriate to assess current cardiac function.');
      }
    }
    else if (input.hasValvularDisease) {
      if (isSymptomaticOrPoorCapacity) {
        // Table 2.2 - Symptomatic valvular disease
        conditionCategory = 'valvular_symptomatic';
        scenario = SECTION_2_TABLE_2[conditionCategory]['any_risk'];
        clinicalGuidance.push('Patient has valvular heart disease with new/worsening symptoms.');
        clinicalGuidance.push('Echocardiography is appropriate to assess valve severity and ventricular function.');
        clinicalGuidance.push('Consider valve intervention before elective noncardiac surgery if severe symptomatic disease.');
      } else {
        // Table 2.1 - Asymptomatic valvular disease
        conditionCategory = 'valvular';
        scenario = SECTION_2_TABLE_1[conditionCategory]['any_risk'];
        clinicalGuidance.push('Patient has known valvular heart disease without new symptoms.');
        clinicalGuidance.push('Echocardiography is appropriate to assess current valve severity and guide perioperative monitoring.');
      }
    }
    else {
      // Default to stable CAD pathway if heart disease suspected but not specified
      conditionCategory = 'cad_stable';
      const riskKey = surgeryRisk === 'HIGH' || surgeryRisk === 'HIGH_VASCULAR' ? 'high_risk' : surgeryRiskKey;
      scenario = SECTION_2_TABLE_1[conditionCategory][riskKey];
      clinicalGuidance.push('Patient has suspected cardiac disease.');
      clinicalGuidance.push('Consider imaging based on clinical suspicion and surgery risk.');
    }
  }
  
  // Categorize recommendations by appropriateness
  const appropriate = scenario.recommendations.filter(r => r.rating === 'A');
  const mayBeAppropriate = scenario.recommendations.filter(r => r.rating === 'M');
  const rarelyAppropriate = scenario.recommendations.filter(r => r.rating === 'R');
  
  // Generate summary
  let summary = `Based on ${sectionDescription.toLowerCase()}, `;
  summary += `${hasGoodFunctionalCapacity ? 'good' : 'limited'} functional capacity, `;
  summary += `and ${SURGICAL_RISK_CATEGORIES[surgeryRisk].name.toLowerCase()} surgery: `;
  
  if (appropriate.length > 0) {
    summary += `${appropriate.map(r => r.modality).join(', ')} ${appropriate.length === 1 ? 'is' : 'are'} appropriate.`;
  } else if (mayBeAppropriate.length > 0) {
    summary += `${mayBeAppropriate.map(r => r.modality).join(', ')} may be appropriate.`;
  } else {
    summary += 'Routine cardiac imaging is rarely appropriate.';
  }
  
  // Add specific guidance for transplant evaluation
  if (surgeryRisk === 'TRANSPLANT') {
    clinicalGuidance.push('Comprehensive cardiac evaluation is recommended for solid organ transplant candidates.');
    clinicalGuidance.push('Both resting echo and stress testing are typically appropriate.');
  }
  
  // Add guidance for high-risk surgery
  if (surgeryRisk === 'HIGH' || surgeryRisk === 'HIGH_VASCULAR') {
    clinicalGuidance.push(`${SURGICAL_RISK_CATEGORIES[surgeryRisk].name} surgery carries >5% risk of MACE.`);
    clinicalGuidance.push('Consider cardiac risk optimization and shared decision-making regarding surgery timing.');
  }
  
  return {
    section,
    sectionDescription,
    scenario,
    summary,
    appropriateModalities: appropriate,
    mayBeAppropriateModalities: mayBeAppropriate,
    rarelyAppropriateModalities: rarelyAppropriate,
    clinicalGuidance
  };
}

/**
 * Helper function to format imaging recommendations for display
 */
export function formatImagingRecommendations(output: ImagingOutput): string {
  let text = `## Preoperative Cardiac Imaging Recommendations\n\n`;
  text += `**Clinical Scenario:** ${output.scenario.description}\n\n`;
  text += `**Summary:** ${output.summary}\n\n`;
  
  if (output.appropriateModalities.length > 0) {
    text += `### Appropriate (A) - Median Score 7-9\n`;
    output.appropriateModalities.forEach(rec => {
      text += `- **${rec.modality}** (Median: ${rec.median})\n`;
    });
    text += '\n';
  }
  
  if (output.mayBeAppropriateModalities.length > 0) {
    text += `### May Be Appropriate (M) - Median Score 4-6\n`;
    output.mayBeAppropriateModalities.forEach(rec => {
      text += `- **${rec.modality}** (Median: ${rec.median})\n`;
    });
    text += '\n';
  }
  
  if (output.rarelyAppropriateModalities.length > 0) {
    text += `### Rarely Appropriate (R) - Median Score 1-3\n`;
    output.rarelyAppropriateModalities.forEach(rec => {
      text += `- ${rec.modality} (Median: ${rec.median})\n`;
    });
    text += '\n';
  }
  
  if (output.clinicalGuidance.length > 0) {
    text += `### Clinical Guidance\n`;
    output.clinicalGuidance.forEach(guidance => {
      text += `- ${guidance}\n`;
    });
  }
  
  text += `\n*Reference: 2024 ACC/AHA Appropriate Use Criteria for Multimodality Imaging (JACC 2024;84(15):1455-1491)*\n`;
  
  return text;
}

