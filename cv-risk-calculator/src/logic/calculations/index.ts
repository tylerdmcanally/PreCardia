import { validateCVPatient } from '../validation';
import { PatientData, ClinicalCalculations, MedicationCategory } from '../../types';
import { calculateBMI } from './bmi';
import { calculateEGFR, stageCKD } from './egfr';
import { calculateAverageBP, classifyBloodPressure, determineBPTarget } from './bpClassification';
import { calculateAllPREVENTRisks, categorizePREVENTRisk } from './prevent';
import { calculateCHA2DS2VASc, interpretCHA2DS2VASc } from './cha2ds2vasc';
import { hasMedicationInCategory } from '../safety/utils';

export function performClinicalCalculations(patientData: PatientData): ClinicalCalculations {
  const errors = validateCVPatient(patientData);
  if (errors.length) throw new Error(errors.join(' '));
  const { demographics, history, labs, bpReadings } = patientData;
  const onDialysis = Boolean(history.dialysis);

  // BMI - only calculate if weight is provided
  const bmi = demographics.weightLbs > 0
    ? calculateBMI(demographics.heightFeet, demographics.heightInches, demographics.weightLbs)
    : 0;

  // eGFR - auto-calculate from creatinine using CKD-EPI 2021 equation
  const egfr = labs.egfr && Number.isFinite(labs.egfr) && labs.egfr > 0 ? labs.egfr
    : labs.creatinine && Number.isFinite(labs.creatinine) && labs.creatinine > 0 && demographics.age >= 18
      ? calculateEGFR(labs.creatinine, demographics.age, demographics.sex) : null;
  const ckdStage = onDialysis ? 5 : history.ckd ? (egfr !== null ? stageCKD(egfr) : history.ckdStage ?? null) : null;

  // BP
  const averageBP = calculateAverageBP(bpReadings);
  const bpClassification = classifyBloodPressure(averageBP.systolic, averageBP.diastolic);

  // PREVENT CVD Risks (10-year and 30-year for Total CVD, ASCVD, Heart Failure)
  // Based on official AHA PREVENT equations v1.0.0
  const hasASCVD = history.cad || history.priorMI || history.priorPCI || history.stroke || history.tia || history.pad;
  const hasKnownCVD = hasASCVD || history.heartFailure;
  const hasMinimalLabsForPREVENT = !hasKnownCVD && !onDialysis && egfr !== null && averageBP.systolic > 0;
  const preventRisks = hasMinimalLabsForPREVENT
    ? calculateAllPREVENTRisks({
        age: demographics.age,
        sex: demographics.sex,
        totalCholesterol: labs.totalCholesterol ?? NaN,
        hdl: labs.hdl ?? NaN,
        systolicBP: averageBP.systolic,
        onBPMeds: patientData.medications.some((m) =>
          ['ACE Inhibitor', 'ARB', 'ARNI', 'MRA', 'Beta Blocker', 'Calcium Channel Blocker', 'Diuretic - Thiazide', 'Diuretic - Loop'].some((cat) =>
            hasMedicationInCategory([m], cat as MedicationCategory)
          )
        ),
        diabetic: history.diabetes,
        smoker: demographics.smokingStatus === 'current',
        bmi,
        egfr,
        onStatin: hasMedicationInCategory(patientData.medications, 'Statin'),
      })
    : { totalCVD_10yr: null, ascvd_10yr: null, heartFailure_10yr: null, totalCVD_30yr: null, ascvd_30yr: null, heartFailure_30yr: null };

  const ascvdRisk = preventRisks.ascvd_10yr;
  const ascvdCategory = ascvdRisk === null ? null : categorizePREVENTRisk(ascvdRisk);
  const preventUnavailableReason = hasKnownCVD
    ? 'Not applicable: established cardiovascular disease. Use disease-specific secondary prevention/HF guidance.'
    : onDialysis ? 'Not applicable: end-stage kidney disease on dialysis.'
    : demographics.age < 30 || demographics.age > 79 ? 'Not validated outside ages 30–79.'
    : Object.values(preventRisks).slice(0, 3).some(risk => risk === null)
      ? 'One or more estimates unavailable: confirm required inputs and validated ranges (SBP 90–200, eGFR 15–140, TC 130–320, HDL 20–100; HF additionally requires BMI 18.5–39.9). Values are not imputed or clamped.' : null;

  const bpTarget = determineBPTarget({
    hasASCVD, hasDiabetes: history.diabetes, hasCKD: history.ckd || onDialysis,
    totalCVDRisk: preventRisks.totalCVD_10yr,
  });

  // 2026 dyslipidemia goals. Do not infer recurrent events or persistent LDL
  // elevation on maximally tolerated therapy from one laboratory measurement.
  const majorEvents = [history.priorMI, history.stroke, history.pad].filter(Boolean).length;
  const highRiskConditions = [demographics.age >= 65, history.diabetes, history.hypertension,
    demographics.smokingStatus === 'current', history.heartFailure,
    history.ckd && egfr !== null && egfr < 60].filter(Boolean).length;
  const veryHighRisk = majorEvents >= 2 || (majorEvents >= 1 && highRiskConditions >= 2);
  const highRiskDiabetes = history.diabetes && [history.hypertension, demographics.smokingStatus === 'current',
    history.ckd, demographics.age >= 55].filter(Boolean).length >= 1;
  const ldlGoal = hasASCVD ? (veryHighRisk ? 55 : 70)
    : (ascvdRisk !== null && ascvdRisk >= 10) || highRiskDiabetes ? 70 : 100;

  // A1c goal
  const a1cGoal = 7;

  // CHA2DS2-VASc for Atrial Fibrillation
  // Only calculate if we have required data: atrial fibrillation checked, valid age, and valid sex
  let cha2ds2vasc = undefined;
  const hasRequiredCHA2DS2VAScData =
    history.atrialFibrillation &&
    demographics.age > 0 &&
    (demographics.sex === 'male' || demographics.sex === 'female');

  if (hasRequiredCHA2DS2VAScData) {
    const score = calculateCHA2DS2VASc({
      age: demographics.age,
      sex: demographics.sex,
      heartFailure: history.heartFailure,
      hypertension: history.hypertension,
      diabetes: history.diabetes,
      priorStroke: history.stroke,
      priorTIA: history.tia,
      vascularDisease: history.cad || history.priorMI || history.pad,
    });
    const interpretation = interpretCHA2DS2VASc(score, demographics.sex);
    cha2ds2vasc = { score, ...interpretation };
  }

  return {
    bmi,
    egfr,
    averageBP,
    bpClassification,
    bpTarget,
    preventRisks,
    ascvdRisk,
    ascvdCategory,
    preventUnavailableReason,
    ckdStage,
    ldlGoal,
    a1cGoal,
    cha2ds2vasc,
  };
}

export * from './bmi';
export * from './egfr';
export * from './bpClassification';
export * from './prevent';
export * from './cha2ds2vasc';
