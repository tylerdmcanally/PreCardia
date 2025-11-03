import { PatientData, ClinicalCalculations } from '../../types';
import { calculateBMI } from './bmi';
import { calculateEGFR, stageCKD } from './egfr';
import { calculateAverageBP, classifyBloodPressure, determineBPTarget } from './bpClassification';
import { calculateASCVDRisk, categorizeASCVDRisk } from './ascvd';
import { calculateCHA2DS2VASc, interpretCHA2DS2VASc } from './cha2ds2vasc';

export function performClinicalCalculations(patientData: PatientData): ClinicalCalculations {
  const { demographics, history, labs, bpReadings } = patientData;

  // BMI - only calculate if weight is provided
  const bmi = demographics.weightLbs > 0
    ? calculateBMI(demographics.heightFeet, demographics.heightInches, demographics.weightLbs)
    : 0;

  // eGFR
  const egfr = labs.creatinine ? calculateEGFR(labs.creatinine, demographics.age, demographics.sex) : 0;
  const ckdStage = egfr > 0 ? stageCKD(egfr) : history.ckdStage || 0;

  // BP
  const averageBP = calculateAverageBP(bpReadings);
  const bpClassification = classifyBloodPressure(averageBP.systolic, averageBP.diastolic);

  // ASCVD
  const hasMinimalLabsForASCVD = labs.totalCholesterol && labs.hdl && averageBP.systolic > 0;
  const ascvdRisk = hasMinimalLabsForASCVD
    ? calculateASCVDRisk({
        age: demographics.age,
        sex: demographics.sex,
        race: demographics.race,
        totalCholesterol: labs.totalCholesterol!,
        hdl: labs.hdl!,
        systolicBP: averageBP.systolic,
        onBPMeds: patientData.medications.some((m) =>
          ['ACE Inhibitor', 'ARB', 'Beta Blocker', 'Calcium Channel Blocker', 'Diuretic - Thiazide'].includes(
            m.category
          )
        ),
        diabetic: history.diabetes,
        smoker: demographics.smokingStatus === 'current',
      })
    : 0;

  const ascvdCategory = categorizeASCVDRisk(ascvdRisk);

  // Determine targets
  const hasASCVD = history.cad || history.priorMI || history.stroke || history.pad;
  const bpTarget = determineBPTarget({
    hasASCVD,
    hasDiabetes: history.diabetes,
    hasCKD: history.ckd || egfr < 60,
    ascvdRisk,
  });

  // LDL goal
  let ldlGoal = 100;
  if (hasASCVD) ldlGoal = 70;
  if (hasASCVD && ascvdRisk >= 20) ldlGoal = 55;

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
export * from './ascvd';
export * from './cha2ds2vasc';
