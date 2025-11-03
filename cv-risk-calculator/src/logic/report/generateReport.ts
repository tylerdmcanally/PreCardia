import { PatientData, ClinicalCalculations, ClinicalReport, MedicationReview, Medication, ClinicalDomain } from '../../types';
import { generateAllDomainRecommendations } from '../recommendations';
import { buildMonitoringPlan } from './monitoringPlan';
import { GUIDELINE_REFERENCES, KEY_TRIALS } from '../../data/guidelines';

export function generateClinicalReport(
  patientData: PatientData,
  calculations: ClinicalCalculations
): ClinicalReport {
  // Generate all domain recommendations first
  const domains = generateAllDomainRecommendations(patientData, calculations);

  // Review current medications (needs domains to check for discontinuation recommendations)
  const medicationReview = reviewCurrentMedications(patientData, calculations, domains);

  // Build monitoring plan
  const monitoringPlan = buildMonitoringPlan(domains, patientData, calculations);

  // Build header
  const header = buildHeader(patientData, calculations);

  // Build risk profile
  const riskProfile = buildRiskProfile(patientData, calculations);

  // Build follow-up plan
  const followUpPlan = buildFollowUpPlan(calculations, domains);

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
  const { averageBP, bpClassification, ascvdRisk, ascvdCategory, egfr, ckdStage } = calculations;

  let profile = `BP: ${averageBP.systolic}/${averageBP.diastolic} mmHg (${bpClassification}) | Target: <${calculations.bpTarget.systolic}/${calculations.bpTarget.diastolic}\n`;

  if (ascvdRisk > 0) {
    profile += `ASCVD 10-Year Risk: ${ascvdRisk.toFixed(1)}% (${capitalize(ascvdCategory)} Risk)\n`;
  }

  if (egfr > 0) {
    profile += `Kidney Function: eGFR ${egfr} mL/min/1.73m2 (CKD Stage ${ckdStage})\n`;
  }

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
  if (history.ckd || ckdStage >= 3) diagnoses.push(`CKD Stage ${ckdStage}`);
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
        (medicationLower.includes('ace') && med.category === 'ACE Inhibitor') ||
        (medicationLower.includes('arb') && med.category === 'ARB') ||
        (medicationLower.includes('beta blocker') && med.category === 'Beta Blocker') ||
        (medicationLower.includes('statin') && med.category === 'Statin') ||
        (medicationLower.includes('diuretic') && (med.category === 'Diuretic - Thiazide' || med.category === 'Diuretic - Loop')) ||
        (medicationLower.includes('antiplatelet') && med.category === 'Antiplatelet') ||
        (medicationLower.includes('anticoagulant') && med.category === 'Anticoagulant') ||
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
  // BP med optimization
  if (['ACE Inhibitor', 'ARB', 'Calcium Channel Blocker'].includes(med.category)) {
    const bpAboveTarget =
      calculations.averageBP.systolic > calculations.bpTarget.systolic ||
      calculations.averageBP.diastolic > calculations.bpTarget.diastolic;
    if (bpAboveTarget) return true;
  }

  // Statin optimization
  if (med.category === 'Statin') {
    const hasASCVD = patientData.history.cad || patientData.history.priorMI || patientData.history.stroke;
    const highIntensityStatins = ['atorvastatin 40', 'atorvastatin 80', 'rosuvastatin 20', 'rosuvastatin 40'];
    const isHighIntensity = highIntensityStatins.some((s) =>
      `${med.genericName} ${med.dose}`.toLowerCase().includes(s)
    );

    if (hasASCVD && !isHighIntensity) return true;
  }

  return false;
}

function buildFollowUpPlan(calculations: ClinicalCalculations, domains: any[]): string {
  let plan = 'Next Appointment: 2-4 weeks\n';
  plan += 'Focus: BP check, review labs (BMP), assess medication tolerability\n\n';
  plan += '3-Month Follow-Up:\n';
  plan += 'Focus: Reassess BP control, review lipid panel and A1c, smoking status\n\n';
  plan += 'Target Goals for Next Visit:\n';
  plan += `• BP <${calculations.bpTarget.systolic}/${calculations.bpTarget.diastolic} mmHg (home readings)\n`;
  plan += '• Medication adherence and tolerability\n';

  const hasSmokingRec = domains.some((d) =>
    d.recommendations.some(
      (r: any) => r.medication.toLowerCase().includes('smoking') || r.rationale.toLowerCase().includes('smoking')
    )
  );
  if (hasSmokingRec) {
    plan += '• Smoking cessation progress\n';
  }

  plan += '• Home BP log review\n\n';
  plan += 'Long-Term Goals:\n';
  plan += `• BP <${calculations.bpTarget.systolic}/${calculations.bpTarget.diastolic} mmHg sustained\n`;
  plan += `• LDL <${calculations.ldlGoal} mg/dL\n`;

  if (calculations.a1cGoal) {
    plan += `• A1c <${calculations.a1cGoal}%\n`;
  }

  if (hasSmokingRec) {
    plan += '• Complete smoking cessation\n';
  }

  return plan;
}

function compileReferences(domains: any[]): string {
  const guidelinesUsed = new Set<string>();
  const trialsUsed = new Set<string>();

  domains.forEach((domain) => {
    domain.recommendations.forEach((rec: any) => {
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
    if (Array.from(guidelinesUsed).some((g) => g === guidelineRef.short)) {
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
