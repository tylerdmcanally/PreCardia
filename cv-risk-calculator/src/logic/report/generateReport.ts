import { PatientData, ClinicalCalculations, ClinicalReport, MedicationReview, Medication, ClinicalDomain, DomainRecommendation, MedicationCategory, DomainName } from '../../types';
import { generateAllDomainRecommendations } from '../recommendations';
import { buildMonitoringPlan } from './monitoringPlan';
import { GUIDELINE_REFERENCES, KEY_TRIALS } from '../../data/guidelines';
import { hasMedicationInCategory } from '../safety/utils';

export function generateClinicalReport(
  patientData: PatientData,
  calculations: ClinicalCalculations,
  selectedDomains?: ReadonlySet<DomainName>
): ClinicalReport {
  // Generate all domain recommendations first
  const urgent = calculations.bpClassification === 'Hypertensive Crisis' || (patientData.labs.potassium ?? 0) >= 6;
  const domains = generateAllDomainRecommendations(patientData, calculations)
    .filter(domain => urgent || !selectedDomains || selectedDomains.has(domain.name));

  // Review current medications (needs domains to check for discontinuation recommendations)
  const medicationReview = reviewCurrentMedications(patientData, calculations, domains);

  // Build monitoring plan
  const monitoringPlan = buildMonitoringPlan(domains, patientData, calculations);

  // Build header
  const header = buildHeader(patientData, calculations);

  // Build risk profile
  const riskProfile = buildRiskProfile(patientData, calculations);

  // Build follow-up plan
  const followUpPlan = buildFollowUpPlan(calculations, domains, patientData);

  // Compile references
  const references = compileReferences(domains);

  return {
    header,
    riskProfile,
    medicationReview,
    domains,
    monitoringPlan,
    followUpPlan,
    references,
  };
}

function buildHeader(patientData: PatientData, calculations: ClinicalCalculations): string {
  const { demographics } = patientData;
  const smokingText =
    demographics.smokingStatus === 'current'
      ? 'Current Smoker'
      : demographics.smokingStatus === 'former'
      ? 'Former Smoker'
      : 'Never Smoked';

  const bmiText = calculations.bmi > 0 ? calculations.bmi.toFixed(1) : 'Not calculated';

  return `Patient: ${demographics.age}yo ${capitalize(demographics.race)} ${capitalize(
    demographics.sex
  )} | BMI: ${bmiText} | Smoking: ${smokingText}
Generated: ${new Date().toLocaleDateString()}`;
}

function buildRiskProfile(patientData: PatientData, calculations: ClinicalCalculations): string {
  const { history, labs } = patientData;
  const { averageBP, bpClassification, preventRisks, ascvdCategory, egfr, ckdStage } = calculations;

  let profile = bpClassification === 'Not assessed' ? 'BP: Not assessed\n' : `BP: ${averageBP.systolic}/${averageBP.diastolic} mmHg (${bpClassification}) | Target: <${calculations.bpTarget.systolic}/${calculations.bpTarget.diastolic}\n`;

  const riskText = (risk: number | null) => risk === null ? 'Unavailable' : `${risk.toFixed(1)}%`;
  profile += `\n10-YEAR PREVENT RISKS (base equations):\n  Total CVD: ${riskText(preventRisks.totalCVD_10yr)}\n  ASCVD: ${riskText(preventRisks.ascvd_10yr)}${ascvdCategory ? ` (${capitalize(ascvdCategory)}; 2026 lipid categories)` : ''}\n  Heart failure: ${riskText(preventRisks.heartFailure_10yr)}\n`;
  if (calculations.preventUnavailableReason) profile += `PREVENT: ${calculations.preventUnavailableReason}\n`;
  if (preventRisks.totalCVD_30yr !== null || preventRisks.heartFailure_30yr !== null) {
    profile += `30-YEAR PREVENT RISKS: Total CVD ${riskText(preventRisks.totalCVD_30yr)}; ASCVD ${riskText(preventRisks.ascvd_30yr)}; HF ${riskText(preventRisks.heartFailure_30yr)}\n`;
  }
  profile += 'Displayed risks are rounded; treatment thresholds use the unrounded estimates.\n';

  if (history.dialysis) {
    profile += 'Kidney Function: End-stage kidney disease on dialysis (treat as CKD Stage 5D)\n';
  } else if (egfr !== null) {
    profile += `Kidney Function: eGFR ${egfr} mL/min/1.73m2${history.ckd && ckdStage !== null ? ` (reported CKD, GFR stage ${ckdStage})` : ''}\n`;
    if (!history.ckd && egfr < 60) profile += 'Reduced eGFR: assess acuity and chronicity; a single result does not establish CKD.\n';
  }

  if (egfr === null && !history.dialysis) profile += 'Kidney function: Unknown; no renal-dependent dosing inferred.\n';

  if (history.diabetes && labs.a1c) {
    profile += `Diabetes Control: A1c ${labs.a1c}% (goal <${calculations.a1cGoal}%)\n`;
  }

  if (labs.ldl) {
    profile += `Lipid Status: LDL ${labs.ldl} mg/dL (goal <${calculations.ldlGoal} mg/dL)\n`;
  }

  // Active diagnoses
  const diagnoses: string[] = [];
  if (history.hypertension) diagnoses.push('Hypertension');
  if (history.diabetes) diagnoses.push('Type 2 Diabetes');
  if (history.dialysis) {
    diagnoses.push('CKD Stage 5D (on dialysis)');
  } else if (history.ckd) {
    diagnoses.push(ckdStage === null ? 'Reported CKD (stage unknown)' : `Reported CKD Stage ${ckdStage}`);
  }
  if (history.cad) diagnoses.push('CAD');
  if (history.priorMI) diagnoses.push('Prior MI');
  if (history.stroke) diagnoses.push('Prior Stroke');
  if (history.heartFailure) diagnoses.push('Heart Failure');

  if (diagnoses.length > 0) {
    profile += `\nActive Diagnoses: ${diagnoses.join(', ')}`;
  }

  return profile;
}

function reviewCurrentMedications(
  patientData: PatientData,
  calculations: ClinicalCalculations,
  domains: ClinicalDomain[]
): MedicationReview {
  const review: MedicationReview = {
    continue: [],
    optimize: [],
    discontinue: [],
  };

  // Collect all recommendations that affect current medications
  const allRecommendations = domains.flatMap((d) => d.recommendations);

  const inCategory = (med: Medication, category: MedicationCategory) => hasMedicationInCategory([med], category);

  patientData.medications.forEach((med) => {
    const medNameLower = med.genericName.toLowerCase();

    // Check if this medication is affected by ANY recommendation
    const isAffectedByRecommendation = allRecommendations.some((rec) => {
      const medicationLower = rec.medication.toLowerCase();
      const rationaleLower = rec.rationale?.toLowerCase() || '';
      const monitoringLower = rec.monitoring?.toLowerCase() || '';
      const notesLower = rec.additionalNotes?.toLowerCase() || '';

      // Actions that indicate medication needs attention
      const actionNeedsAttention = [
        'DISCONTINUE',
        'HOLD',
        'ADJUST',
        'SWITCH',
        'DECREASE',
      ].includes(rec.action);

      // Direct medication name match
      const hasDirectMatch =
        medicationLower.includes(medNameLower) ||
        rationaleLower.includes(medNameLower) ||
        monitoringLower.includes(medNameLower) ||
        notesLower.includes(medNameLower);

      // Category-based matching
      const hasCategoryMatch =
        (medicationLower.includes('ace') && inCategory(med, 'ACE Inhibitor')) ||
        (medicationLower.includes('arb') && inCategory(med, 'ARB')) ||
        (medicationLower.includes('beta blocker') && inCategory(med, 'Beta Blocker')) ||
        (medicationLower.includes('statin') && inCategory(med, 'Statin')) ||
        (medicationLower.includes('diuretic') && (inCategory(med, 'Diuretic - Thiazide') || inCategory(med, 'Diuretic - Loop'))) ||
        (medicationLower.includes('antiplatelet') && inCategory(med, 'Antiplatelet')) ||
        (medicationLower.includes('anticoagulant') && inCategory(med, 'Anticoagulant')) ||
        (medicationLower.includes('aspirin') && medNameLower.includes('aspirin')) ||
        (medicationLower.includes('clopidogrel') && medNameLower.includes('clopidogrel')) ||
        (medicationLower.includes('warfarin') && medNameLower.includes('warfarin')) ||
        (medicationLower.includes('doac') && (medNameLower.includes('apixaban') || medNameLower.includes('rivaroxaban') || medNameLower.includes('edoxaban') || medNameLower.includes('dabigatran')));

      // References to "current medication"
      const hasCurrentReference = medicationLower.includes('current') || rationaleLower.includes('current medication');

      return actionNeedsAttention && (hasDirectMatch || hasCategoryMatch || hasCurrentReference);
    });

    const needsOptimization = checkIfNeedsOptimization(med, patientData, calculations);

    if (isAffectedByRecommendation) {
      review.discontinue.push({
        medication: `${med.genericName} ${med.dose}`,
        status: 'SEE RECS',
      });
    } else if (needsOptimization) {
      review.optimize.push({
        medication: `${med.genericName} ${med.dose}`,
        status: 'CONTINUE, optimize below',
      });
    } else {
      review.continue.push({
        medication: `${med.genericName} ${med.dose}`,
        status: 'CONTINUE',
      });
    }
  });

  return review;
}

function checkIfNeedsOptimization(
  med: Medication,
  patientData: PatientData,
  calculations: ClinicalCalculations
): boolean {
  const matches = (category: MedicationCategory) => hasMedicationInCategory([med], category);

  // BP med optimization
  if (['ACE Inhibitor', 'ARB', 'Calcium Channel Blocker'].some((cat) => matches(cat as MedicationCategory))) {
    const bpAboveTarget =
      calculations.averageBP.systolic > calculations.bpTarget.systolic ||
      calculations.averageBP.diastolic > calculations.bpTarget.diastolic;
    if (bpAboveTarget) return true;
  }

  // Statin optimization
  if (matches('Statin')) {
    const hasASCVD = patientData.history.cad || patientData.history.priorMI || patientData.history.stroke;
    const highIntensityStatins = ['atorvastatin 40', 'atorvastatin 80', 'rosuvastatin 20', 'rosuvastatin 40'];
    const isHighIntensity = highIntensityStatins.some((s) =>
      `${med.genericName} ${med.dose}`.toLowerCase().includes(s)
    );

    if (hasASCVD && !isHighIntensity) return true;
  }

  return false;
}

function buildFollowUpPlan(calculations: ClinicalCalculations, domains: ClinicalDomain[], patientData: PatientData): string {
  if (calculations.bpClassification === 'Hypertensive Crisis' || (patientData.labs.potassium ?? 0) >= 6) return 'Immediate clinical assessment; determine disposition and reassessment timing from symptoms, repeat measurements, ECG and evidence of acute organ injury. Routine optimization follow-up is deferred.';
  if (!domains.length) return 'No domains selected. Select the clinical areas to include in the plan.';
  const recs = domains.flatMap(domain => domain.recommendations);
  const changes = recs.filter(rec => ['ADD', 'INCREASE', 'SWITCH', 'CONSIDER'].includes(rec.action));
  let plan = 'Resolve missing information and safety findings before implementing treatment options. Agree on staged changes with the patient; options are not simultaneous medication orders.\n';
  if (changes.length) plan += 'If treatment changes are made, arrange the medication-specific monitoring listed above; do not wait for a routine visit when earlier labs or review are required.\n';
  if (domains.some(d => d.name === 'BLOOD_PRESSURE')) plan += patientData.history.dialysis
    ? 'BP follow-up: individualize with the dialysis team, including dry weight and home/intradialytic readings.\n'
    : `BP follow-up: confirm home readings and reassess in about 1 month after treatment initiation or adjustment; goal <${calculations.bpTarget.systolic}/${calculations.bpTarget.diastolic} if tolerated. Low-risk untreated stage 1 hypertension: reassess after 3–6 months of lifestyle therapy.\n`;
  if (domains.some(d => d.name === 'LIPID_MANAGEMENT')) plan += `Lipid follow-up: repeat lipids 4–12 weeks after an agreed treatment change; LDL-C goal <${calculations.ldlGoal} mg/dL, individualized to the clinical context.\n`;
  if (patientData.history.diabetes && domains.some(d => d.name === 'DIABETES_CARDIORENAL')) plan += `Diabetes follow-up: reassess A1c in about 3 months after a treatment change; usual goal <${calculations.a1cGoal}%, individualized to comorbidity and hypoglycemia risk.\n`;
  return plan;
}

function compileReferences(domains: ClinicalDomain[]): string {
  const guidelinesUsed = new Set<string>();
  const trialsUsed = new Set<string>();

  domains.forEach((domain) => {
    domain.recommendations.forEach((rec: DomainRecommendation) => {
      guidelinesUsed.add(rec.evidence);
      if (rec.additionalNotes) {
        if (rec.additionalNotes.includes('EMPA-REG')) trialsUsed.add('EMPA-REG OUTCOME');
        if (rec.additionalNotes.includes('SUSTAIN-6')) trialsUsed.add('SUSTAIN-6');
        if (rec.additionalNotes.includes('DAPA-HF')) trialsUsed.add('DAPA-HF');
        if (rec.additionalNotes.includes('PARADIGM-HF')) trialsUsed.add('PARADIGM-HF');
      }
    });
  });

  let refs = 'Guidelines:\n';
  let guidelineCount = 0;

  // Match guidelines used with their full references including URLs
  GUIDELINE_REFERENCES.forEach((guidelineRef) => {
    if (Array.from(guidelinesUsed).some((g) => g.includes(guidelineRef.short))) {
      guidelineCount++;
      refs += `${guidelineCount}. ${guidelineRef.full}\n`;
      refs += `   ${guidelineRef.citation}\n`;
      refs += `   ${guidelineRef.url}\n\n`;
    }
  });

  if (trialsUsed.size > 0) {
    refs += 'Key Clinical Trials:\n';
    Array.from(trialsUsed).forEach((trial) => {
      // Add trial details from KEY_TRIALS if available
      const trialKey = trial.toUpperCase().replace(/\s+/g, '_').replace('-', '_');
      if (trialKey in KEY_TRIALS) {
        const trialData = KEY_TRIALS[trialKey as keyof typeof KEY_TRIALS];
        refs += `• ${trialData.name}\n`;
        refs += `  ${trialData.citation}\n`;
        refs += `  ${trialData.url}\n\n`;
      } else {
        refs += `• ${trial}\n`;
      }
    });
  }

  return refs;
}

function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}
