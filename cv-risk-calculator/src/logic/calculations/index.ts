import { PatientData, ClinicalCalculations } from '../../types';
import { calculateBMI } from './bmi';
import { calculateEGFR, stageCKD } from './egfr';
import { calculateAverageBP, classifyBloodPressure, determineBPTarget } from './bpClassification';
import { calculatePREVENTRisk, categorizePREVENTRisk } from './prevent';
import { calculateCHA2DS2VASc, interpretCHA2DS2VASc } from './cha2ds2vasc';

export function performClinicalCalculations(patientData: PatientData): ClinicalCalculations {
  const { demographics, history, labs, bpReadings } = patientData;

  // BMI - only calculate if weight is provided
  const bmi = demographics.weightLbs > 0
    ? calculateBMI(demographics.heightFeet, demographics.heightInches, demographics.weightLbs)
    : 0;

  // eGFR - auto-calculate from creatinine using CKD-EPI 2021 equation
  const egfr = labs.creatinine ? calculateEGFR(labs.creatinine, demographics.age, demographics.sex) : 0;
  const ckdStage = egfr > 0 ? stageCKD(egfr) : history.ckdStage || 0;

  // BP
  const averageBP = calculateAverageBP(bpReadings);
  const bpClassification = classifyBloodPressure(averageBP.systolic, averageBP.diastolic);

  // PREVENT 10-year Total CVD Risk (replaces Pooled Cohort ASCVD)
  const hasMinimalLabsForPREVENT = labs.totalCholesterol && labs.hdl && averageBP.systolic > 0 && bmi > 0 && egfr > 0;
  const ascvdRisk = hasMinimalLabsForPREVENT
    ? calculatePREVENTRisk({
        age: demographics.age,
        sex: demographics.sex,
        totalCholesterol: labs.totalCholesterol!,
        hdl: labs.hdl!,
        systolicBP: averageBP.systolic,
        onBPMeds: patientData.medications.some((m) =>
          ['ACE Inhibitor', 'ARB', 'Beta Blocker', 'Calcium Channel Blocker', 'Diuretic - Thiazide', 'Diuretic - Loop'].includes(
            m.category
          )
        ),
        diabetic: history.diabetes,
        smoker: demographics.smokingStatus === 'current',
        bmi,
        egfr,
        onStatin: patientData.medications.some((m) => m.category === 'Statin'),
      })
    : 0;

  const ascvdCategory = categorizePREVENTRisk(ascvdRisk);

  // Determine targets
  const hasASCVD = history.cad || history.priorMI || history.stroke || history.pad;
  const bpTarget = determineBPTarget({
    hasASCVD,
    hasDiabetes: history.diabetes,
    hasCKD: history.ckd || egfr < 60,
    ascvdRisk,
  });

  // LDL goal - based on 2025 ESC/EAS Guidelines
  let ldlGoal = 116; // Low risk default

  // Determine risk category and corresponding LDL goal
  const hasDiabetesWithRiskFactors = history.diabetes && (
    history.hypertension ||
    demographics.smokingStatus === 'current' ||
    egfr < 60 ||
    demographics.age > 50
  );

  const hasModerateRisk = hasDiabetesWithRiskFactors && !hasASCVD;
  const hasHighRisk = (
    labs.ldl && labs.ldl >= 190 || // LDL ≥190 is high risk
    egfr >= 30 && egfr < 60 || // Moderate CKD
    (history.diabetes && !hasASCVD && (demographics.age > 60 || hasDiabetesWithRiskFactors)) ||
    ascvdRisk >= 7.5 && ascvdRisk < 20 // High 10-year risk
  );

  const hasVeryHighRisk = hasASCVD || ascvdRisk >= 20 || egfr < 30;

  // Extreme risk: recurrent events or polyvascular disease
  const hasRecurrentEvents = [history.priorMI, history.stroke, history.tia].filter(Boolean).length >= 2;
  const hasPolyvascularDisease = [history.cad, history.priorMI, history.pad, history.stroke].filter(Boolean).length >= 2;
  const hasExtremeRisk = hasASCVD && (hasRecurrentEvents || hasPolyvascularDisease);

  // Set LDL goal based on risk category (most aggressive category wins)
  if (hasExtremeRisk) {
    ldlGoal = 40; // Extreme risk (NEW in 2025 ESC/EAS)
  } else if (hasVeryHighRisk) {
    ldlGoal = 55; // Very high risk
  } else if (hasHighRisk) {
    ldlGoal = 70; // High risk
  } else if (hasModerateRisk) {
    ldlGoal = 100; // Moderate risk
  }
  // else ldlGoal remains 116 for low risk

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
    ascvdRisk,
    ascvdCategory,
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
