import { PatientData, ClinicalCalculations } from '../../types';
import { calculateBMI } from './bmi';
import { calculateEGFR, stageCKD } from './egfr';
import { calculateAverageBP, classifyBloodPressure, determineBPTarget } from './bpClassification';
import { calculateAllPREVENTRisks, categorizePREVENTRisk } from './prevent';
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

  // PREVENT 10-year CVD Risks (Total CVD, ASCVD, Heart Failure, CAD, Stroke)
  const hasMinimalLabsForPREVENT = labs.totalCholesterol && labs.hdl && averageBP.systolic > 0 && bmi > 0 && egfr > 0;
  const preventRisks = hasMinimalLabsForPREVENT
    ? calculateAllPREVENTRisks({
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
    : { totalCVD: 0, ascvd: 0, heartFailure: 0, cad: 0, stroke: 0 };

  const ascvdRisk = preventRisks.totalCVD; // Backward compatibility
  const ascvdCategory = categorizePREVENTRisk(ascvdRisk);

  // Determine targets
  const hasASCVD = history.cad || history.priorMI || history.stroke || history.pad;
  const bpTarget = determineBPTarget({
    hasASCVD,
    hasDiabetes: history.diabetes,
    hasCKD: history.ckd || egfr < 60,
    ascvdRisk,
  });

  // LDL goal - based on 2018 ACC/AHA Cholesterol Guideline
  let ldlGoal = 100; // Default for low-moderate risk

  // Very high-risk ASCVD: multiple major ASCVD events or 1 major event + multiple high-risk conditions
  const hasMajorASCVDEvents = [history.priorMI, history.stroke].filter(Boolean).length >= 2;
  const hasHighRiskConditions = [
    history.diabetes,
    history.hypertension,
    demographics.smokingStatus === 'current',
    egfr < 60,
    labs.ldl && labs.ldl >= 100 // persistently elevated LDL despite therapy
  ].filter(Boolean).length >= 2;
  const isVeryHighRiskASCVD = hasASCVD && (hasMajorASCVDEvents || hasHighRiskConditions);

  // Clinical ASCVD (secondary prevention)
  if (isVeryHighRiskASCVD) {
    ldlGoal = 55; // Very high-risk ASCVD (2022 ACC Expert Consensus)
  } else if (hasASCVD) {
    ldlGoal = 70; // Clinical ASCVD (standard secondary prevention)
  }
  // Severe primary hypercholesterolemia (LDL ≥190)
  else if (labs.ldl && labs.ldl >= 190) {
    ldlGoal = 100; // Primary severe hypercholesterolemia
  }
  // Diabetes age 40-75
  else if (history.diabetes && demographics.age >= 40 && demographics.age <= 75) {
    // High-risk diabetes: 10-year ASCVD ≥20% or multiple risk factors
    const hasMultipleDMRiskFactors = [
      history.hypertension,
      demographics.smokingStatus === 'current',
      egfr < 60,
      demographics.age >= 55
    ].filter(Boolean).length >= 2;

    if (ascvdRisk >= 20 || hasMultipleDMRiskFactors) {
      ldlGoal = 70; // High-risk diabetes
    } else {
      ldlGoal = 100; // Moderate-risk diabetes
    }
  }
  // Primary prevention with elevated 10-year ASCVD risk
  else if (ascvdRisk >= 7.5 && ascvdRisk < 20) {
    ldlGoal = 100; // Intermediate risk (7.5-20%)
  } else if (ascvdRisk >= 20) {
    ldlGoal = 70; // High risk (≥20%)
  }
  // Low risk (<5%) or borderline risk (5-7.5%) - lifestyle, consider statin with risk enhancers
  else if (ascvdRisk < 7.5) {
    ldlGoal = 100; // Conservative goal for those on therapy
  }

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
