// PreCardia Report Generator

import { PreCardiaData, FunctionalCapacityInfo, DASIResult } from '../../types/precardia.types';
import {
  calculateRCRI,
  calculateDASI,
  calculateEGFR,
  calculateBMI,
  getFunctionalCapacityCategory,
  convertPoundsToKg,
  convertInchesToCm
} from './calculations';
import { generateRecommendations } from './recommendations';
import { SURGICAL_RISK, METS_VALUES, TROPONIN_ASSAY_LIMITS } from './constants';
import { getImagingRecommendations, type ImagingInput } from '../imaging/imagingRecommendations';
import { APPROPRIATENESS_DEFINITIONS } from '../../data/imagingGuidelines';

const FUNCTIONAL_CAPACITY_CATEGORIES = ['excellent', 'good', 'moderate', 'poor', 'unknown'] as const;
type FunctionalCapacityCategory = (typeof FUNCTIONAL_CAPACITY_CATEGORIES)[number];

const isFunctionalCapacityCategory = (value: string): value is FunctionalCapacityCategory =>
  FUNCTIONAL_CAPACITY_CATEGORIES.includes(value as FunctionalCapacityCategory);

const formatOneDecimal = (value: number): string => Number(Number(value).toFixed(1)).toString();

const getSexLabel = (sex: PreCardiaData['sex']): string => {
  switch (sex) {
    case 'male':
      return 'Male';
    case 'female':
      return 'Female';
    default:
      return 'Other';
  }
};

export function generatePreCardiaReport(data: PreCardiaData): string {
  // Calculate functional capacity
  const usesDASI = Boolean(data.useDASI);
  let functionalCapacityInfo: FunctionalCapacityInfo;
  let dasiResults: DASIResult | null = null;

  if (usesDASI) {
    dasiResults = calculateDASI(data);
    functionalCapacityInfo = getFunctionalCapacityCategory(dasiResults.mets);
  } else {
    const capacity = data.functionalCapacity || 'unknown';
    const category: FunctionalCapacityCategory = isFunctionalCapacityCategory(capacity) ? capacity : 'unknown';
    functionalCapacityInfo = {
      value: METS_VALUES[category]?.value || 'Unknown',
      description: METS_VALUES[category]?.description || 'Unknown',
      category,
    };
  }

  // Calculate RCRI
  const rcri = calculateRCRI(data);

  // Get surgical risk
  const surgeryRisk = SURGICAL_RISK[data.surgeryType] || {
    level: 'Variable',
    risk: 'Variable',
    description: data.otherSurgery || 'Unknown'
  };

  // Generate recommendations
  const recommendations = generateRecommendations(data, rcri, surgeryRisk, functionalCapacityInfo);

  // Calculate eGFR if creatinine available
  const egfr = data.creatinine ? calculateEGFR(data.creatinine, data.age, data.sex) : null;

  // Calculate BMI
  const bmi = calculateBMI(data.weight, data.height, data.unitSystem);

  // Build report
  const report: string[] = [];

  report.push('=' .repeat(80));
  report.push('PRECARDIA - CARDIAC PRE-OPERATIVE RISK ASSESSMENT REPORT');
  report.push('Based on 2024 ACC/AHA/ACCP/HRS Guidelines');
  report.push('='.repeat(80));
  report.push('');

  // Patient demographics
  report.push('PATIENT DEMOGRAPHICS');
  report.push('-'.repeat(80));
  report.push(`Age: ${data.age} years`);
  report.push(`Sex: ${getSexLabel(data.sex)}`);

  const hasWeight = data.weight > 0;
  const hasHeight = data.height > 0;
  const usesImperial = data.unitSystem === 'imperial';

  if (hasWeight) {
    if (usesImperial) {
      const weightKg = convertPoundsToKg(data.weight);
      report.push(`Weight: ${formatOneDecimal(data.weight)} lbs (${formatOneDecimal(weightKg)} kg)`);
    } else {
      report.push(`Weight: ${formatOneDecimal(data.weight)} kg`);
    }
  }

  if (hasHeight) {
    if (usesImperial) {
      const heightCm = convertInchesToCm(data.height);
      report.push(`Height: ${formatOneDecimal(data.height)} in (${formatOneDecimal(heightCm)} cm)`);
    } else {
      report.push(`Height: ${formatOneDecimal(data.height)} cm`);
    }
  }

  if (hasWeight && hasHeight) {
    report.push(`BMI: ${bmi} kg/m²`);
  }
  report.push('');

  // Active cardiac conditions
  const activeConditions: string[] = [];
  if (data.unstableAngina) activeConditions.push('Unstable angina/ACS');
  if (data.decompensatedHF) activeConditions.push('Decompensated heart failure');
  if (data.significantArrhythmia) activeConditions.push('Significant arrhythmia');
  if (data.severeValvularDisease) activeConditions.push('Severe valvular disease');

  if (activeConditions.length > 0) {
    report.push('⚠️  ACTIVE CARDIAC CONDITIONS');
    report.push('-'.repeat(80));
    activeConditions.forEach(condition => report.push(`  • ${condition}`));
    report.push('');
    report.push('**ELECTIVE SURGERY MAY NEED TO BE DELAYED**');
    report.push('');
  }

  // Medical history
  report.push('MEDICAL HISTORY');
  report.push('-'.repeat(80));
  const conditions: string[] = [];
  if (data.ischemicHeartDisease) conditions.push('Ischemic heart disease');
  if (data.heartFailure) conditions.push('Heart failure');
  if (data.cerebrovascularDisease) conditions.push('Cerebrovascular disease');
  if (data.diabetesInsulin) conditions.push('Diabetes requiring insulin');
  if (data.renalDysfunction) conditions.push('Renal dysfunction');
  if (data.hypertension) conditions.push('Hypertension');
  if (data.atrialFibrillation) {
    const afibTypeMap: Record<string, string> = {
      'paroxysmal': 'Paroxysmal',
      'persistent': 'Persistent',
      'long-standing-persistent': 'Long-standing persistent',
      'permanent': 'Permanent',
      'new-onset': 'New-onset'
    };
    const afibSegments: string[] = ['Atrial fibrillation'];
    if (data.afibType) {
      afibSegments.push(`Type: ${afibTypeMap[data.afibType] || data.afibType}`);
    }
    const strategy: string[] = [];
    if (data.afibRateControl) strategy.push('Rate control');
    if (data.afibRhythmControl) strategy.push('Rhythm control');
    if (strategy.length > 0) {
      afibSegments.push(strategy.join(' & '));
    }
    conditions.push(afibSegments.join(' - '));
  }
  if (data.diabetes && !data.diabetesInsulin) conditions.push('Diabetes (non-insulin)');
  if (data.ckd) conditions.push('Chronic kidney disease');
  if (data.copd) conditions.push('COPD');
  if (data.sleepApnea) conditions.push('Sleep apnea');
  if (data.currentSmoker) conditions.push('Current smoker');
  if (data.obesity) conditions.push('Obesity (BMI ≥30)');
  if (data.pulmonaryHypertension) conditions.push('Pulmonary hypertension');
  if (data.congenitalHeartDisease) conditions.push('Congenital heart disease');
  if (data.valvularHeartDisease) {
    const valvularTypeMap: Record<string, string> = {
      'aortic-stenosis': 'Aortic stenosis',
      'aortic-regurgitation': 'Aortic regurgitation',
      'mitral-stenosis': 'Mitral stenosis',
      'mitral-regurgitation': 'Mitral regurgitation',
      'tricuspid': 'Tricuspid valve disease',
      'pulmonary': 'Pulmonary valve disease',
      'multiple': 'Multiple valves'
    };
    const severityMap: Record<string, string> = {
      mild: 'Mild',
      moderate: 'Moderate',
      severe: 'Severe'
    };
    let valvularText = 'Valvular heart disease';
    if (data.valvularType) {
      valvularText += ` (${valvularTypeMap[data.valvularType] || data.valvularType})`;
    }
    if (data.valvularSeverity) {
      valvularText += ` - ${severityMap[data.valvularSeverity] || data.valvularSeverity}`;
    }
    conditions.push(valvularText);
  }
  if (data.hasCIED || data.pacemaker || data.icd || data.crt) {
    const deviceTypes: string[] = [];
    if (data.pacemaker) deviceTypes.push('Pacemaker');
    if (data.icd) deviceTypes.push('ICD');
    if (data.crt) deviceTypes.push('CRT');
    let deviceText = deviceTypes.length > 0 ? `Cardiac device: ${deviceTypes.join(', ')}` : 'Cardiac implanted electronic device present';
    if (data.ciedInterrogation) {
      const interrogationMap: Record<string, string> = {
        recent: 'Recent interrogation',
        needed: 'Interrogation needed',
        'not-needed': 'Interrogation not needed pre-operatively'
      };
      deviceText += ` (${interrogationMap[data.ciedInterrogation] || data.ciedInterrogation})`;
    }
    conditions.push(deviceText);
  }

  if (conditions.length > 0) {
    conditions.forEach(condition => report.push(`  • ${condition}`));
  } else {
    report.push('  No significant cardiac history reported');
  }
  report.push('');

  // Lab values
  if (data.creatinine || data.bnp || data.ntproBNP || data.troponin) {
    report.push('LABORATORY VALUES');
    report.push('-'.repeat(80));
    if (data.creatinine) {
      report.push(`Creatinine: ${data.creatinine} mg/dL`);
      if (egfr) report.push(`eGFR (CKD-EPI 2021): ${egfr} mL/min/1.73m²`);
    }
    if (data.bnp) report.push(`BNP: ${data.bnp} pg/mL`);
    if (data.ntproBNP) report.push(`NT-proBNP: ${data.ntproBNP} pg/mL`);
    if (data.troponin) {
      const assayLabel = data.troponinAssay ? TROPONIN_ASSAY_LIMITS[data.troponinAssay]?.label ?? data.troponinAssay : undefined;
      const upperLimitText = data.troponinUpperLimit ? ` | 99th percentile ${data.troponinUpperLimit} ng/mL` : '';
      if (assayLabel) {
        report.push(`Troponin: ${data.troponin} ng/mL (Assay: ${assayLabel}${upperLimitText})`);
      } else if (upperLimitText) {
        report.push(`Troponin: ${data.troponin} ng/mL${upperLimitText}`);
      } else {
        report.push(`Troponin: ${data.troponin} ng/mL`);
      }
    }
    report.push('');
  }

  // Recent cardiac interventions
  const interventionDetails: string[] = [];
  if (data.recentMI === 'yes') {
    const miTimingMap: Record<string, string> = {
      lt4w: '<4 weeks',
      '4to8w': '4-8 weeks',
      gt8w: '>8 weeks',
      unknown: 'Unknown timing'
    };
    const timing = data.miTiming ? miTimingMap[data.miTiming] || data.miTiming : 'Timing not specified';
    interventionDetails.push(`Recent myocardial infarction: ${timing}`);
  }
  if (data.stentType && data.stentType !== 'none') {
    const stentTypeMap: Record<string, string> = {
      bms: 'Bare-metal stent',
      des: 'Drug-eluting stent'
    };
    const stentTimingMap: Record<string, string> = {
      lt2w: '<2 weeks',
      '2to4w': '2-4 weeks',
      '4to12w': '4-12 weeks',
      gt12w: '>12 weeks',
      unknown: 'Unknown timing'
    };
    const typeLabel = stentTypeMap[data.stentType] || data.stentType;
    const timingLabel = data.stentTiming ? stentTimingMap[data.stentTiming] || data.stentTiming : 'Timing not specified';
    interventionDetails.push(`Coronary stent: ${typeLabel} (${timingLabel})`);
  }
  if (data.cabg === 'yes') {
    const cabgTimingMap: Record<string, string> = {
      lt6w: '<6 weeks',
      '6wto3mo': '6 weeks to 3 months',
      gt3mo: '>3 months',
      unknown: 'Unknown timing'
    };
    const cabgLabel = data.cabgTiming ? cabgTimingMap[data.cabgTiming] || data.cabgTiming : 'Timing not specified';
    interventionDetails.push(`CABG: ${cabgLabel}`);
  }
  if (data.tavrTavi === 'yes') {
    const tavrTimingMap: Record<string, string> = {
      lt4w: '<4 weeks',
      gt4w: '≥4 weeks',
      unknown: 'Unknown timing'
    };
    const tavrLabel = data.tavrTiming ? tavrTimingMap[data.tavrTiming] || data.tavrTiming : 'Timing not specified';
    interventionDetails.push(`TAVR/TAVI within past year: ${tavrLabel}`);
  }
  if (data.teer === 'yes') {
    const teerTimingMap: Record<string, string> = {
      lt4w: '<4 weeks',
      gt4w: '≥4 weeks',
      unknown: 'Unknown timing'
    };
    const teerLabel = data.teerTiming ? teerTimingMap[data.teerTiming] || data.teerTiming : 'Timing not specified';
    interventionDetails.push(`TEER/MitraClip within past year: ${teerLabel}`);
  }

  if (interventionDetails.length > 0) {
    report.push('RECENT CARDIAC INTERVENTIONS');
    report.push('-'.repeat(80));
    interventionDetails.forEach(detail => report.push(`  • ${detail}`));
    report.push('');
  }

  // Current medications
  const meds: string[] = [];
  if (data.betaBlocker) meds.push('Beta-blocker');
  if (data.statin) meds.push('Statin');
  if (data.aceARB) meds.push('ACE inhibitor/ARB');
  if (data.sglt2i) meds.push('SGLT2 inhibitor');
  if (data.anticoagulant) meds.push('Anticoagulant');
  if (data.antiplatelet) meds.push('Antiplatelet');

  if (meds.length > 0) {
    report.push('CURRENT MEDICATIONS');
    report.push('-'.repeat(80));
    meds.forEach(med => report.push(`  • ${med}`));
    report.push('');
  } else {
    report.push('CURRENT MEDICATIONS');
    report.push('-'.repeat(80));
    report.push('  No cardiovascular medications documented');
    report.push('');
  }

  // Functional capacity
  report.push('FUNCTIONAL CAPACITY ASSESSMENT');
  report.push('-'.repeat(80));
  if (usesDASI && dasiResults) {
    report.push('Assessment method: Duke Activity Status Index (DASI)');
    report.push(`DASI score: ${dasiResults.score.toFixed(1)}`);
    report.push(`Estimated VO₂peak: ${dasiResults.vo2peak.toFixed(1)} mL/kg/min`);
    report.push(`Functional capacity: ${functionalCapacityInfo.description}`);
    report.push(`METs: ${functionalCapacityInfo.value}`);
  } else {
    report.push('Assessment method: Clinical estimation');
    report.push(`Functional capacity: ${functionalCapacityInfo.description}`);
    report.push(`METs: ${functionalCapacityInfo.value}`);
  }
  report.push('');

  // Surgical details
  report.push('SURGICAL DETAILS');
  report.push('-'.repeat(80));
  report.push(`Procedure: ${surgeryRisk.description}`);
  report.push(`Surgical Risk: ${surgeryRisk.level} (${surgeryRisk.risk} 30-day MACE risk)`);
  const urgencyMap = {
    emergency: 'Emergency (<2 hours)',
    urgent: 'Urgent (2-24 hours)',
    'time-sensitive': 'Time-sensitive (≤3 months)',
    elective: 'Elective (>3 months)'
  };
  report.push(`Urgency: ${urgencyMap[data.surgeryUrgency]}`);
  report.push('');

  // RCRI calculation
  report.push('REVISED CARDIAC RISK INDEX (RCRI)');
  report.push('-'.repeat(80));
  report.push(`RCRI Score: ${rcri.score} / ${rcri.maxScore} points`);
  report.push(`30-day MACE Risk: ${rcri.maceRisk}`);
  report.push(`Risk Level: ${rcri.riskLevel}`);
  if (rcri.riskFactors.length > 0) {
    report.push('');
    report.push('Risk Factors Present:');
    rcri.riskFactors.forEach(factor => report.push(`  • ${factor}`));
  } else {
    report.push('');
    report.push('Risk Factors Present:');
    report.push('  • No RCRI risk factors identified');
  }
  report.push('');

  // Recommendations
  if (recommendations.general.length > 0) {
    report.push('RECOMMENDATIONS');
    report.push('-'.repeat(80));
    recommendations.general.forEach((rec, i) => {
      report.push(`${i + 1}. ${rec}`);
      report.push('');
    });
  }

  if (recommendations.testing.length > 0) {
    report.push('PREOPERATIVE TESTING RECOMMENDATIONS');
    report.push('-'.repeat(80));
    recommendations.testing.forEach((rec, i) => {
      report.push(`${i + 1}. ${rec}`);
      report.push('');
    });
  }

  if (recommendations.medications.length > 0) {
    report.push('MEDICATION MANAGEMENT');
    report.push('-'.repeat(80));
    recommendations.medications.forEach((rec, i) => {
      report.push(`${i + 1}. ${rec}`);
      report.push('');
    });
  }

  // Imaging recommendations based on 2024 ACC/AHA Appropriate Use Criteria
  const imagingInput: ImagingInput = {
    hasKnownHeartDisease: Boolean(data.ischemicHeartDisease || data.heartFailure || data.valvularHeartDisease),
    hasNewOrWorseningSymptoms: Boolean(data.unstableAngina || data.decompensatedHF),
    functionalCapacityMETs: typeof functionalCapacityInfo.value === 'number' ? functionalCapacityInfo.value : null,
    hasCAD: Boolean(data.ischemicHeartDisease),
    hasHeartFailure: Boolean(data.heartFailure),
    heartFailureClass: data.decompensatedHF ? 'IV' : undefined,
    hasValvularDisease: Boolean(data.valvularHeartDisease),
    hasRecentMI: data.recentMI === 'yes',
    hasRecentHFHospitalization: Boolean(data.decompensatedHF),
    surgeryType: data.otherSurgery || data.surgeryType,
    surgeryRisk: surgeryRisk.level === 'Low' ? 'LOW' : 
                 surgeryRisk.level === 'Intermediate' ? 'INTERMEDIATE' :
                 surgeryRisk.level === 'High' ? 'HIGH' : 'INTERMEDIATE',
    hasPriorTestingWithin90Days: false // Could be added as a form field in the future
  };

  const imagingRecs = getImagingRecommendations(imagingInput);

  report.push('PREOPERATIVE CARDIAC IMAGING RECOMMENDATIONS');
  report.push('-'.repeat(80));
  report.push(`Clinical Scenario: ${imagingRecs.scenario.description}`);
  report.push('');
  report.push(`Surgery Risk: ${surgeryRisk.level} (${surgeryRisk.risk})`);
  report.push(`Functional Capacity: ${functionalCapacityInfo.description}`);
  report.push('');

  if (imagingRecs.appropriateModalities.length > 0) {
    report.push('APPROPRIATE (A) - Generally acceptable and reasonable approach:');
    imagingRecs.appropriateModalities.forEach(rec => {
      report.push(`  • ${rec.modality} (Median Score: ${rec.median}/9)`);
    });
    report.push('');
  }

  if (imagingRecs.mayBeAppropriateModalities.length > 0) {
    report.push('MAY BE APPROPRIATE (M) - May be acceptable, more research needed:');
    imagingRecs.mayBeAppropriateModalities.forEach(rec => {
      report.push(`  • ${rec.modality} (Median Score: ${rec.median}/9)`);
    });
    report.push('');
  }

  if (imagingRecs.rarelyAppropriateModalities.length > 0) {
    report.push('RARELY APPROPRIATE (R) - Not generally acceptable:');
    imagingRecs.rarelyAppropriateModalities.forEach(rec => {
      report.push(`  • ${rec.modality} (Median Score: ${rec.median}/9)`);
    });
    report.push('');
  }

  if (imagingRecs.clinicalGuidance.length > 0) {
    report.push('Clinical Guidance:');
    imagingRecs.clinicalGuidance.forEach((guidance, i) => {
      report.push(`  ${i + 1}. ${guidance}`);
    });
    report.push('');
  }

  report.push('Reference: 2024 ACC/AHA Appropriate Use Criteria for Multimodality Imaging');
  report.push('(JACC 2024;84(15):1455-1491)');
  report.push('');

  // Testing principles
  report.push('GENERAL PERIOPERATIVE TESTING PRINCIPLES');
  report.push('-'.repeat(80));
  recommendations.testingPrinciples.forEach((principle, i) => {
    report.push(`${i + 1}. ${principle}`);
  });
  report.push('');

  // Frailty assessment
  if (typeof data.frailtyScore === 'number' && Number.isFinite(data.frailtyScore)) {
    const frailtyDescriptions: Record<number, string> = {
      1: 'Very Fit',
      2: 'Well',
      3: 'Managing Well',
      4: 'Living with Very Mild Frailty',
      5: 'Living with Mild Frailty',
      6: 'Living with Moderate Frailty',
      7: 'Living with Severe Frailty',
      8: 'Living with Very Severe Frailty',
      9: 'Terminally Ill'
    };
    report.push('FRAILTY ASSESSMENT');
    report.push('-'.repeat(80));
    report.push(`Clinical Frailty Scale: ${data.frailtyScore} - ${frailtyDescriptions[data.frailtyScore] || 'Not specified'}`);
    if (data.frailtyScore >= 6) {
      report.push('Frailty Level: Moderate to severe');
    } else if (data.frailtyScore >= 4) {
      report.push('Frailty Level: Mild');
    } else {
      report.push('Frailty Level: Non-frail');
    }
    report.push('');
  }

  // Disclaimer
  report.push('='.repeat(80));
  report.push('DISCLAIMER');
  report.push('-'.repeat(80));
  report.push('This assessment is for clinical decision support only and should not replace');
  report.push('clinical judgment. Healthcare providers should use this tool in conjunction with');
  report.push('their professional expertise and in accordance with local clinical guidelines.');
  report.push('');
  report.push('Reference: 2024 ACC/AHA/ACCP/HRS Guideline for Perioperative Cardiovascular');
  report.push('Evaluation and Management for Noncardiac Surgery');
  report.push('');
  report.push(`Generated: ${new Date().toLocaleString()}`);
  report.push('='.repeat(80));

  return report.join('\n');
}
