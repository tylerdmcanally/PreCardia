// PreCardia Report Generator

import { PreCardiaData, DASIResult } from '../../types/precardia.types';
import {
  calculateRCRI,
  calculateDASI,
  calculateEGFR,
  calculateBMI,
  assessFunctionalCapacity,
  convertPoundsToKg,
  convertInchesToCm
} from './calculations';
import { generateRecommendations } from './recommendations';
import { TROPONIN_ASSAY_LIMITS } from './constants';
import { getSurgicalRisk, PERIOPERATIVE_GUIDELINE } from './guideline';
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
  if (!Number.isInteger(data.age) || data.age < 18) {
    throw new Error('PreCardia applies to adults age 18 and older.');
  }
  const usesDASI = Boolean(data.useDASI);
  const dasiResults: DASIResult | null = usesDASI && data.dasiCompleted ? calculateDASI(data) : null;
  const functionalCapacityInfo = assessFunctionalCapacity(data);
  const rcri = calculateRCRI(data);
  const surgeryRisk = getSurgicalRisk(data);

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
  report.push(`Based on ${PERIOPERATIVE_GUIDELINE.label}`);
  report.push(PERIOPERATIVE_GUIDELINE.note);
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
  if (data.cerebrovascularDisease) conditions.push(`Cerebrovascular disease (most recent stroke/TIA: ${data.strokeTiming === 'lt3mo' ? '<3 months' : data.strokeTiming === 'ge3mo' ? '≥3 months' : 'unknown timing'})`);
  if (data.cardiovascularSymptoms) conditions.push('Cardiovascular symptoms reported');
  if (data.newOrWorseningDyspnea) conditions.push('New dyspnea or suspected worsening ventricular function');
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
  if ([data.creatinine, data.bnp, data.ntproBNP, data.troponin].some(value => value !== undefined)) {
    report.push('LABORATORY VALUES');
    report.push('-'.repeat(80));
    if (data.creatinine) {
      report.push(`Creatinine: ${data.creatinine} mg/dL`);
      if (egfr !== null) report.push(`eGFR (CKD-EPI 2021): ${egfr} mL/min/1.73m² (not creatinine clearance for drug dosing)`);
      else report.push('eGFR not calculated: confirm the inputs required by the CKD-EPI equation.');
    }
    if (data.bnp !== undefined) report.push(`BNP: ${data.bnp} pg/mL`);
    if (data.ntproBNP !== undefined) report.push(`NT-proBNP: ${data.ntproBNP} pg/mL`);
    if (data.troponin !== undefined) {
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
      le30d: '≤30 days',
      'gt30d-lt3mo': '>30 days to <3 calendar months',
      '3to6mo': '3 to <6 calendar months',
      '6to12mo': '6 to <12 calendar months',
      ge12mo: '≥12 calendar months',
      lt2w: '<2 weeks',
      '2to4w': '2-4 weeks',
      '4to12w': '4-12 weeks',
      gt12w: '>12 weeks',
      unknown: 'Unknown timing'
    };
    const typeLabel = stentTypeMap[data.stentType] || data.stentType;
    const timing = data.pciTiming || data.stentTiming;
    const timingLabel = timing ? stentTimingMap[timing] || timing : 'Timing not specified';
    interventionDetails.push(`Coronary stent: ${typeLabel} (${timingLabel})`);
    interventionDetails.push(`PCI indication: ${data.pciIndication === 'acs' ? 'ACS' : data.pciIndication === 'ccd' ? 'Chronic coronary disease' : 'Unknown'}`);
    interventionDetails.push(`Antiplatelet interruption required: ${data.antiplateletInterruption || 'unknown'}`);
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

  if (data.balloonAngioplasty) interventionDetails.push(`Balloon angioplasty without stent: ${data.balloonTiming === 'lt14d' ? '<14 days' : data.balloonTiming === 'ge14d' ? '≥14 days' : 'Unknown timing'}`);

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
  if (data.aceARB) meds.push(`ACE inhibitor/ARB (indication: ${data.raasIndication || 'unknown'}; BP control: ${data.bloodPressureControlled ? 'reported controlled' : 'not confirmed'})`);
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
    report.push(`Formula-estimated METs: ${dasiResults.mets.toFixed(1)} (DASI ≤34 independently denotes poor capacity)`);
  } else {
    report.push(usesDASI ? 'Assessment method: DASI incomplete — capacity unknown' : 'Assessment method: Clinical estimation');
    report.push(`Functional capacity: ${functionalCapacityInfo.description}`);
    report.push(`METs: ${functionalCapacityInfo.value}`);
  }
  report.push('');

  // Surgical details
  report.push('SURGICAL DETAILS');
  report.push('-'.repeat(80));
  report.push(`Procedure: ${surgeryRisk.description}`);
  report.push(`Procedure risk category: ${surgeryRisk.level === 'High' && data.otherSurgeryRisk === 'elevated' ? 'Elevated' : surgeryRisk.level} (${surgeryRisk.risk}; broad procedural estimate, not individualized MACE probability)`);
  const urgencyMap = {
    emergency: 'Emergency (<2 hours)',
    urgent: 'Urgent (≥2 to <24 hours)',
    'time-sensitive': 'Time-sensitive (≤3 months)',
    elective: 'Elective (can delay for evaluation and management)'
  };
  report.push(`Urgency: ${urgencyMap[data.surgeryUrgency]}`);
  report.push('');

  // RCRI calculation
  report.push('REVISED CARDIAC RISK INDEX (RCRI)');
  report.push('-'.repeat(80));
  report.push(`RCRI Score: ${rcri.score} / ${rcri.maxScore} points`);
  report.push('RCRI >1 denotes elevated calculated risk (Table 4 / Figure 1).');
  report.push('RCRI predicts major cardiac complications; no fixed individualized 30-day MACE percentage is assigned.');
  if (data.surgeryType === 'other') report.push(`RCRI high-risk surgical criterion: ${data.otherRcriHighRisk || 'unknown'}${!data.otherRcriHighRisk || data.otherRcriHighRisk === 'unknown' ? ' — score is provisional until confirmed' : ''}.`);
  if (data.riskCalculator && Number.isFinite(data.estimatedMaceRisk)) {
    report.push(`Additional clinician-entered risk estimate (${data.riskCalculator}): ${data.estimatedMaceRisk}% — verify calculator endpoint and inputs.`);
  }
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
    if (data.frailtyScore === 9) {
      report.push('Clinical Frailty Scale category: Terminally ill (not a stand-alone frailty severity).');
    } else if (data.frailtyScore >= 6) {
      report.push('Frailty Level: Moderate to severe');
    } else if (data.frailtyScore === 5) {
      report.push('Frailty Level: Mild');
    } else if (data.frailtyScore === 4) {
      report.push('Clinical Frailty Scale category: Vulnerable / very mild frailty; Table 6 identifies categories 5–8 as frailty.');
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
  report.push(`Reference: ${PERIOPERATIVE_GUIDELINE.citation}`);
  report.push(PERIOPERATIVE_GUIDELINE.url);
  report.push('');
  report.push(`Generated: ${new Date().toLocaleString()}`);
  report.push('='.repeat(80));

  return report.join('\n');
}
