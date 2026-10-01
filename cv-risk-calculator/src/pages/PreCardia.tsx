import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { PreCardiaData } from '../types/precardia.types';
import { generatePreCardiaReport } from '../logic/precardia/reportGenerator';
import { PerioperativeContextFields, type PerioperativeContext } from '../components/PerioperativeContextFields';
import { PERIOPERATIVE_GUIDELINE } from '../logic/precardia/guideline';
import { TROPONIN_ASSAY_LIMITS } from '../logic/precardia/constants';
import { calculateDASI, getDASIFunctionalCapacity } from '../logic/precardia/calculations';
import { ArrowLeft, ArrowRight, FileText, Copy, Printer } from 'lucide-react';
import { AssessmentSection } from '../components/AssessmentSection';
import { AssessmentNavigation } from '../components/AssessmentNavigation';
import { ASSESSMENT_STEPS, type AssessmentError } from '../data/assessmentSteps';
import { SURGICAL_RISK } from '../logic/precardia/constants';

type MiTimingOption = '' | 'lt4w' | '4to8w' | 'gt8w' | 'unknown';
type StentTypeOption = '' | 'bms' | 'des' | 'none';
type StentTimingOption = '' | NonNullable<PreCardiaData['pciTiming']>;
type CabgTimingOption = '' | 'lt6w' | '6wto3mo' | 'gt3mo';
type TavrTimingOption = '' | 'lt4w' | 'gt4w';
type FunctionalCapacityOption = 'excellent' | 'good' | 'moderate' | 'poor' | 'unknown';
type SurgeryUrgencyOption = 'emergency' | 'urgent' | 'time-sensitive' | 'elective';
type ValvularTypeOption = '' | 'aortic-stenosis' | 'aortic-regurgitation' | 'mitral-stenosis' | 'mitral-regurgitation' | 'tricuspid' | 'pulmonary' | 'multiple';
type ValvularSeverityOption = '' | 'mild' | 'moderate' | 'severe';
type AfibTypeOption = '' | 'paroxysmal' | 'persistent' | 'long-standing-persistent' | 'permanent' | 'new-onset';
type CIEDInterrogationOption = '' | 'recent' | 'needed' | 'not-needed';
type FrailtyScoreOption = '' | '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9';
type TeerTimingOption = '' | 'lt4w' | 'gt4w' | 'unknown';

const getTroponinDefaultLimit = (assayKey: string, patientSex: 'male' | 'female' | 'other'): number | undefined => {
  const assay = TROPONIN_ASSAY_LIMITS[assayKey];
  if (!assay) {
    return undefined;
  }

  if (patientSex === 'female' && assay.female !== undefined) {
    return assay.female;
  }

  if (patientSex === 'male' && assay.male !== undefined) {
    return assay.male;
  }

  return assay.neutral ?? assay.male ?? assay.female;
};

const selectedLabels = (items: [boolean, string][]) => items.filter(([selected]) => selected).map(([, label]) => label).join(', ');

export function PreCardia() {
  const [guidelineContext, setGuidelineContext] = useState<PerioperativeContext>({});
  const [dasiCompleted, setDasiCompleted] = useState(false);
  const [report, setReport] = useState<string | null>(null);
  const [activeStep, setActiveStep] = useState(0);
  const [focusTarget, setFocusTarget] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<AssessmentError[]>([]);
  const [copyStatus, setCopyStatus] = useState('');
  const [reportNeedsUpdate, setReportNeedsUpdate] = useState(false);

  // Form state
  const [unitSystem, setUnitSystem] = useState<'imperial' | 'metric'>('imperial');
  const [age, setAge] = useState('');
  const [sex, setSex] = useState<'male' | 'female' | 'other'>('male');
  const [weight, setWeight] = useState('');
  const [height, setHeight] = useState('');

  // Active cardiac conditions
  const [unstableAngina, setUnstableAngina] = useState(false);
  const [decompensatedHF, setDecompensatedHF] = useState(false);
  const [significantArrhythmia, setSignificantArrhythmia] = useState(false);
  const [severeValvularDisease, setSevereValvularDisease] = useState(false);
  const [valvularHeartDisease, setValvularHeartDisease] = useState(false);
  const [valvularType, setValvularType] = useState<ValvularTypeOption>('');
  const [valvularSeverity, setValvularSeverity] = useState<ValvularSeverityOption>('');

  // Medical history (RCRI factors)
  const [ischemicHeartDisease, setIschemicHeartDisease] = useState(false);
  const [heartFailure, setHeartFailure] = useState(false);
  const [cerebrovascularDisease, setCerebrovascularDisease] = useState(false);
  const [diabetesInsulin, setDiabetesInsulin] = useState(false);
  const [renalDysfunction, setRenalDysfunction] = useState(false);

  // Additional history
  const [hypertension, setHypertension] = useState(false);
  const [atrialFibrillation, setAtrialFibrillation] = useState(false);
  const [afibType, setAfibType] = useState<AfibTypeOption>('');
  const [afibRateControl, setAfibRateControl] = useState(false);
  const [afibRhythmControl, setAfibRhythmControl] = useState(false);
  const [diabetes, setDiabetes] = useState(false);
  const [ckd, setCkd] = useState(false);
  const [copd, setCopd] = useState(false);
  const [sleepApnea, setSleepApnea] = useState(false);
  const [obesity, setObesity] = useState(false);
  const [currentSmoker, setCurrentSmoker] = useState(false);
  const [pulmonaryHypertension, setPulmonaryHypertension] = useState(false);
  const [congenitalHeartDisease, setCongenitalHeartDisease] = useState(false);
  const [frailtyScore, setFrailtyScore] = useState<FrailtyScoreOption>('');

  // Recent interventions
  const [recentMI, setRecentMI] = useState<'yes' | 'no'>('no');
  const [miTiming, setMiTiming] = useState<MiTimingOption>('');
  const [stentType, setStentType] = useState<StentTypeOption>('');
  const [stentTiming, setStentTiming] = useState<StentTimingOption>('');
  const [cabg, setCabg] = useState<'yes' | 'no'>('no');
  const [cabgTiming, setCabgTiming] = useState<CabgTimingOption>('');
  const [tavrTavi, setTavrTavi] = useState<'yes' | 'no'>('no');
  const [tavrTiming, setTavrTiming] = useState<TavrTimingOption>('');
  const [teer, setTeer] = useState<'yes' | 'no'>('no');
  const [teerTiming, setTeerTiming] = useState<TeerTimingOption>('');

  // Labs
  const [creatinine, setCreatinine] = useState('');
  const [bnp, setBnp] = useState('');
  const [ntproBNP, setNtproBNP] = useState('');
  const [troponin, setTroponin] = useState('');
  const [troponinAssay, setTroponinAssay] = useState<string>('');
  const [troponinUpperLimit, setTroponinUpperLimit] = useState<string>('');
  const [troponinUpperLimitManuallySet, setTroponinUpperLimitManuallySet] = useState(false);

  // Medications
  const [betaBlocker, setBetaBlocker] = useState(false);
  const [statin, setStatin] = useState(false);
  const [aceARB, setAceARB] = useState(false);
  const [sglt2i, setSglt2i] = useState(false);
  const [anticoagulant, setAnticoagulant] = useState(false);
  const [antiplatelet, setAntiplatelet] = useState(false);

  // Functional capacity
  const [useDASI, setUseDASI] = useState(true);
  const [functionalCapacity, setFunctionalCapacity] = useState<FunctionalCapacityOption>('unknown');
  const [dasi1, setDasi1] = useState(false);
  const [dasi2, setDasi2] = useState(false);
  const [dasi3, setDasi3] = useState(false);
  const [dasi4, setDasi4] = useState(false);
  const [dasi5, setDasi5] = useState(false);
  const [dasi6, setDasi6] = useState(false);
  const [dasi7, setDasi7] = useState(false);
  const [dasi8, setDasi8] = useState(false);
  const [dasi9, setDasi9] = useState(false);
  const [dasi10, setDasi10] = useState(false);
  const [dasi11, setDasi11] = useState(false);
  const [dasi12, setDasi12] = useState(false);

  // Surgical details
  const [surgeryType, setSurgeryType] = useState('');
  const [otherSurgery, setOtherSurgery] = useState('');
  const [surgeryUrgency, setSurgeryUrgency] = useState<SurgeryUrgencyOption>('elective');
  const [hasCIED, setHasCIED] = useState(false);
  const [pacemaker, setPacemaker] = useState(false);
  const [icd, setIcd] = useState(false);
  const [crt, setCrt] = useState(false);
  const [ciedInterrogation, setCiedInterrogation] = useState<CIEDInterrogationOption>('');

  const goToStep = (step: number, field = 'assessment-step-heading') => {
    setActiveStep(step);
    setFocusTarget(field);
  };

  useEffect(() => {
    if (!focusTarget) return;
    const target = document.getElementById(focusTarget);
    target?.focus({ preventScroll: true });
    target?.scrollIntoView({ block: 'start' });
    setFocusTarget(null);
  }, [activeStep, focusTarget]);

  const getValidationErrors = (): AssessmentError[] => {
    const errors: AssessmentError[] = [];
    const add = (step: number, field: string, message: string) => errors.push({ step, field: `precardia-${field}`, message });
    if (!age || !Number.isInteger(Number(age)) || Number(age) < 18) add(0, 'age', 'Enter an adult patient age (18 years or older).');
    if (!surgeryType) add(0, 'surgeryType', 'Select the planned surgery type.');
    if (Boolean(weight.trim()) !== Boolean(height.trim())) add(0, weight.trim() ? 'height' : 'weight', 'Provide both weight and height, or leave both blank.');
    for (const [name, value] of [['weight', weight], ['height', height]]) {
      if (value.trim() && (!Number.isFinite(Number(value)) || Number(value) <= 0)) add(0, name, `Enter a positive ${name}, or leave it blank.`);
    }
    if (valvularHeartDisease && !valvularSeverity) add(1, 'valvularSeverity', 'Specify the valve severity.');
    if (atrialFibrillation && !afibType) add(1, 'afibType', 'Select the atrial fibrillation subtype.');
    if (recentMI === 'yes' && !miTiming) add(2, 'miTiming', 'Specify the timing of the recent MI.');
    if (stentType && stentType !== 'none' && !stentTiming) add(2, 'stentTiming', 'Specify the timing of the most recent stent.');
    if (cabg === 'yes' && !cabgTiming) add(2, 'cabgTiming', 'Specify the timing of the CABG procedure.');
    if (tavrTavi === 'yes' && !tavrTiming) add(2, 'tavrTiming', 'Specify the timing of the TAVR/TAVI procedure.');
    if (teer === 'yes' && !teerTiming) add(2, 'teerTiming', 'Specify the timing of the TEER procedure.');
    if (hasCIED && !pacemaker && !icd && !crt) add(2, 'pacemaker', 'Select at least one implanted device type.');
    if (hasCIED && !ciedInterrogation) add(2, 'ciedInterrogation', 'Specify the device interrogation status.');
    if (guidelineContext.estimatedMaceRisk !== undefined && (!guidelineContext.riskCalculator || !Number.isFinite(guidelineContext.estimatedMaceRisk) || guidelineContext.estimatedMaceRisk < 0 || guidelineContext.estimatedMaceRisk > 100)) add(5, 'risk-estimate', 'Select the risk calculator and enter a cardiac event risk from 0 to 100%.');
    if (guidelineContext.riskCalculator && guidelineContext.estimatedMaceRisk === undefined) add(5, 'risk-estimate', 'Enter the estimate from the selected calculator, or select Not supplied.');
    for (const [name, value, field] of [['Creatinine', creatinine, 'creatinine'], ['BNP', bnp, 'bnp'], ['NT-proBNP', ntproBNP, 'ntproBNP'], ['Troponin', troponin, 'troponin'], ['Troponin upper limit', troponinUpperLimit, 'troponinUpperLimit']]) {
      if (value.trim() && (!Number.isFinite(Number(value)) || Number(value) < 0 || ((field === 'creatinine' || field === 'troponinUpperLimit') && Number(value) === 0))) add(4, field, `Enter a valid ${name} value.`);
    }
    return errors;
  };

  const showErrors = (errors: AssessmentError[]) => {
    setValidationErrors(errors);
    goToStep(errors[0].step, 'assessment-errors');
  };

  const handleNext = () => {
    const errors = getValidationErrors().filter(error => error.step === activeStep);
    if (errors.length) { showErrors(errors); return; }
    setValidationErrors([]);
    goToStep(activeStep + 1);
  };

  const handleGenerateReport = () => {
    const errors = getValidationErrors();
    if (errors.length) { showErrors(errors); return; }
    setValidationErrors([]);

    const data: PreCardiaData = {
      ...guidelineContext,
      strokeTiming: cerebrovascularDisease ? guidelineContext.strokeTiming : undefined,
      pciIndication: stentType === 'des' || stentType === 'bms' ? guidelineContext.pciIndication : undefined,
      antiplateletInterruption: stentType === 'des' || stentType === 'bms' ? guidelineContext.antiplateletInterruption : undefined,
      balloonAngioplasty: !stentType || stentType === 'none' ? guidelineContext.balloonAngioplasty : false,
      raasIndication: aceARB ? guidelineContext.raasIndication : undefined,
      otherSurgeryRisk: surgeryType === 'other' ? guidelineContext.otherSurgeryRisk : undefined,
      otherRcriHighRisk: surgeryType === 'other' ? guidelineContext.otherRcriHighRisk : undefined,
      dasiCompleted,
      age: Number(age),
      sex,
      weight: Number(weight) || 0,
      height: Number(height) || 0,
      unitSystem,
      unstableAngina,
      decompensatedHF,
      significantArrhythmia,
      severeValvularDisease,
      valvularHeartDisease,
      valvularType: valvularHeartDisease ? valvularType || undefined : undefined,
      valvularSeverity: valvularHeartDisease ? valvularSeverity || undefined : undefined,
      ischemicHeartDisease,
      heartFailure,
      cerebrovascularDisease,
      diabetesInsulin,
      renalDysfunction,
      hypertension,
      atrialFibrillation,
      afibType: atrialFibrillation ? afibType || undefined : undefined,
      afibRateControl: atrialFibrillation ? afibRateControl : undefined,
      afibRhythmControl: atrialFibrillation ? afibRhythmControl : undefined,
      diabetes,
      ckd,
      copd,
      sleepApnea,
      obesity,
      currentSmoker,
      pulmonaryHypertension,
      congenitalHeartDisease,
      frailtyScore: frailtyScore ? parseInt(frailtyScore, 10) : undefined,
      recentMI,
      miTiming: miTiming || undefined,
      stentType: stentType || undefined,
      pciTiming: stentType === 'bms' || stentType === 'des' ? stentTiming || undefined : undefined,
      cabg,
      cabgTiming: cabgTiming || undefined,
      tavrTavi,
      tavrTiming: tavrTiming || undefined,
      teer,
      teerTiming: teer === 'yes' ? teerTiming || undefined : undefined,
      creatinine: creatinine ? Number(creatinine) : undefined,
      bnp: bnp ? Number(bnp) : undefined,
      ntproBNP: ntproBNP ? Number(ntproBNP) : undefined,
      troponin: troponin ? Number(troponin) : undefined,
      troponinAssay: troponinAssay || undefined,
      troponinUpperLimit: troponinUpperLimit ? Number(troponinUpperLimit) : undefined,
      betaBlocker,
      statin,
      aceARB,
      sglt2i,
      anticoagulant,
      antiplatelet,
      functionalCapacity: useDASI ? undefined : functionalCapacity,
      useDASI,
      dasi1, dasi2, dasi3, dasi4, dasi5, dasi6,
      dasi7, dasi8, dasi9, dasi10, dasi11, dasi12,
      surgeryType,
      otherSurgery,
      surgeryUrgency,
      hasCIED,
      pacemaker: hasCIED ? pacemaker : undefined,
      icd: hasCIED ? icd : undefined,
      crt: hasCIED ? crt : undefined,
      ciedInterrogation: hasCIED ? ciedInterrogation || undefined : undefined
    };

    const generatedReport = generatePreCardiaReport(data);
    setReport(generatedReport);
    setReportNeedsUpdate(false);
    setCopyStatus('');
    goToStep(5, 'assessment-report-heading');
  };

  const handleCopyReport = async () => {
    if (!report) return;
    try {
      await navigator.clipboard.writeText(report);
      setCopyStatus('Report copied to clipboard.');
    } catch {
      setCopyStatus('Copy was unavailable. Select the report text to copy it manually.');
    }
  };

  const handlePrintReport = () => {
    window.print();
  };

  const handleTroponinAssayChange = (value: string) => {
    setTroponinAssay(value);
    setTroponinUpperLimitManuallySet(false);

    if (!value) {
      setTroponinUpperLimit('');
      return;
    }

    const defaultLimit = getTroponinDefaultLimit(value, sex);
    setTroponinUpperLimit(defaultLimit !== undefined ? defaultLimit.toString() : '');
  };

  useEffect(() => {
    if (!troponinAssay || troponinUpperLimitManuallySet) {
      return;
    }

    const defaultLimit = getTroponinDefaultLimit(troponinAssay, sex);
    const defaultAsString = defaultLimit !== undefined ? defaultLimit.toString() : '';

    if (defaultAsString !== troponinUpperLimit) {
      setTroponinUpperLimit(defaultAsString);
    }
  }, [sex, troponinAssay, troponinUpperLimitManuallySet, troponinUpperLimit]);

  const procedureLabel = surgeryType === 'other' ? otherSurgery || 'Other procedure' : SURGICAL_RISK[surgeryType]?.description || 'Procedure not selected';
  const currentStep = ASSESSMENT_STEPS[activeStep];
  const activeSummary = selectedLabels([[unstableAngina, 'ACS/unstable angina'], [decompensatedHF, 'decompensated HF'], [significantArrhythmia, 'significant arrhythmia'], [severeValvularDisease, 'severe symptomatic valve disease']]);
  const historySummary = selectedLabels([[ischemicHeartDisease, 'ischemic heart disease'], [heartFailure, 'HF'], [cerebrovascularDisease, 'stroke/TIA'], [diabetesInsulin, 'insulin-treated diabetes'], [renalDysfunction, 'RCRI renal criterion'], [hypertension, 'hypertension'], [atrialFibrillation, 'AF'], [diabetes, 'diabetes'], [ckd, 'CKD'], [copd, 'COPD'], [sleepApnea, 'OSA'], [obesity, 'obesity'], [currentSmoker, 'current smoking'], [pulmonaryHypertension, 'PH'], [congenitalHeartDisease, 'congenital heart disease'], [valvularHeartDisease, 'valve disease']]);
  const interventionSummary = selectedLabels([[recentMI === 'yes', 'recent MI'], [cabg === 'yes', 'CABG'], [tavrTavi === 'yes', 'TAVR/TAVI'], [teer === 'yes', 'TEER'], [stentType === 'des', 'DES'], [stentType === 'bms', 'BMS'], [Boolean(guidelineContext.balloonAngioplasty) && stentType !== 'des' && stentType !== 'bms', 'balloon angioplasty'], [hasCIED, 'implanted cardiac device']]);
  const medicationSummary = selectedLabels([[betaBlocker, 'beta-blocker'], [statin, 'statin'], [aceARB, 'ACE inhibitor/ARB'], [sglt2i, 'SGLT2 inhibitor'], [anticoagulant, 'anticoagulant'], [antiplatelet, 'antiplatelet']]);
  const labSummary = [[creatinine, 'Creatinine', 'mg/dL'], [bnp, 'BNP', 'pg/mL'], [ntproBNP, 'NT-proBNP', 'pg/mL'], [troponin, 'Troponin', 'ng/mL']].filter(([value]) => value.trim() !== '').map(([value, label, units]) => `${label} ${value} ${units}`).join(' · ');
  const summary = [
    `${age ? `${age} years · ${sex}` : 'Age not entered'} · ${procedureLabel} · ${surgeryUrgency}`,
    `Active: ${activeSummary || 'none selected'}. History: ${historySummary || 'none selected'}.`,
    interventionSummary || 'No interventions or devices selected',
    `${useDASI ? dasiCompleted ? `DASI ${calculateDASI({ dasi1, dasi2, dasi3, dasi4, dasi5, dasi6, dasi7, dasi8, dasi9, dasi10, dasi11, dasi12 }).score.toFixed(1)} · questionnaire complete` : 'DASI incomplete — capacity unknown' : `Clinical capacity: ${functionalCapacity}`} · ${frailtyScore ? `Frailty scale ${frailtyScore}` : 'Frailty not assessed'}`,
    `${medicationSummary || 'No medications selected'}. ${labSummary || 'No lab results entered'}.`,
  ];

  return (
    <div className="precardia-assessment min-h-screen bg-cardio-bg">
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
        <header className="mb-7 no-print">
          <Link to="/" className="mb-4 inline-flex items-center gap-2 text-sm text-cardio-secondary hover:text-cardio-primary"><ArrowLeft className="h-4 w-4" /> CardioTools</Link>
          <h1 className="text-3xl font-bold text-cardio-primary">PreCardia</h1>
          <p className="mt-1 text-gray-600">Preoperative cardiovascular assessment</p>
          <p className="mt-2 text-xs text-gray-500"><a className="underline" href={PERIOPERATIVE_GUIDELINE.url} target="_blank" rel="noreferrer">2026 AHA/ACC guideline</a> · 2024 recommendations reaffirmed</p>
        </header>
        <div className="grid gap-6 lg:grid-cols-[240px_minmax(0,1fr)] lg:gap-8">
          <AssessmentNavigation activeStep={activeStep} onSelect={step => goToStep(step)} />
          <main className="min-w-0">
            <div className="mb-5 no-print">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">Step {activeStep + 1} of {ASSESSMENT_STEPS.length}</p>
              <h2 id="assessment-step-heading" tabIndex={-1} className="scroll-mt-6 text-2xl font-bold text-cardio-primary">{currentStep.title}</h2>
              <p className="mt-2 text-sm text-gray-600">{currentStep.description}</p>
              {activeStep === 0 && <p className="mt-2 text-xs text-gray-500">Answers stay with you between steps. Refreshing or leaving this assessment clears them.</p>}
              {activeStep > 0 && <p className="mt-3 rounded-lg border border-cardio-border px-3 py-2 text-xs text-gray-600">{age ? `${age} years · ` : ''}{procedureLabel} · {surgeryUrgency}</p>}
            </div>
            {validationErrors.length > 0 && <div id="assessment-errors" tabIndex={-1} role="alert" className="mb-5 scroll-mt-6 rounded-lg border border-red-300 bg-red-50 p-4 text-sm text-red-900">
              <p className="font-semibold">Please check these details</p>
              <ul className="mt-2 list-disc space-y-2 pl-5">{validationErrors.map(error => <li key={error.field + error.message}><button type="button" className="text-left underline" onClick={() => goToStep(error.step, error.field)}>{error.message}</button></li>)}</ul>
            </div>}
            <form noValidate onSubmit={event => { event.preventDefault(); if (activeStep === 5) handleGenerateReport(); else handleNext(); }} onChangeCapture={() => {
              setValidationErrors([]);
              setCopyStatus('');
              if (report) { setReport(null); setReportNeedsUpdate(true); }
            }}>
              {activeStep === 0 && <>
                <AssessmentSection title="Patient details">
            <div className="px-6 pb-6 space-y-4">
              <p className="text-sm text-gray-500">* Required. Weight and height are optional; enter both if available.</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="precardia-age" className="block text-sm font-semibold text-cardio-primary mb-2">
                    Age (years) *
                  </label>
                  <input id="precardia-age" aria-invalid={validationErrors.some(error => error.field === 'precardia-age') || undefined}
                    type="number"
                    min="18" step="1" value={age}
                    onChange={(e) => setAge(e.target.value)}
                    className="w-full px-3 py-2 border-2 border-cardio-border rounded focus:border-cardio-secondary focus:outline-none"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="precardia-sex" className="block text-sm font-semibold text-cardio-primary mb-2">
                    Sex *
                  </label>
                  <select id="precardia-sex" aria-invalid={validationErrors.some(error => error.field === 'precardia-sex') || undefined}
                    value={sex}
                    onChange={(e) => setSex(e.target.value as 'male' | 'female' | 'other')}
                    className="w-full px-3 py-2 border-2 border-cardio-border rounded focus:border-cardio-secondary focus:outline-none"
                  >
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="precardia-unitSystem" className="block text-sm font-semibold text-cardio-primary mb-2">
                    Unit System
                  </label>
                  <select id="precardia-unitSystem" aria-invalid={validationErrors.some(error => error.field === 'precardia-unitSystem') || undefined}
                    value={unitSystem}
                    onChange={(e) => setUnitSystem(e.target.value as 'imperial' | 'metric')}
                    className="w-full px-3 py-2 border-2 border-cardio-border rounded focus:border-cardio-secondary focus:outline-none"
                  >
                    <option value="imperial">Imperial (lbs, in)</option>
                    <option value="metric">Metric (kg, cm)</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="precardia-weight" className="block text-sm font-semibold text-cardio-primary mb-2">
                    Weight ({unitSystem === 'imperial' ? 'lbs' : 'kg'})
                  </label>
                  <input id="precardia-weight" aria-invalid={validationErrors.some(error => error.field === 'precardia-weight') || undefined}
                    type="number"
                    value={weight}
                    onChange={(e) => setWeight(e.target.value)}
                    step="0.1"
                    className="w-full px-3 py-2 border-2 border-cardio-border rounded focus:border-cardio-secondary focus:outline-none"
                  />
                </div>

                <div>
                  <label htmlFor="precardia-height" className="block text-sm font-semibold text-cardio-primary mb-2">
                    Height ({unitSystem === 'imperial' ? 'in' : 'cm'})
                  </label>
                  <input id="precardia-height" aria-invalid={validationErrors.some(error => error.field === 'precardia-height') || undefined}
                    type="number"
                    value={height}
                    onChange={(e) => setHeight(e.target.value)}
                    step="0.1"
                    className="w-full px-3 py-2 border-2 border-cardio-border rounded focus:border-cardio-secondary focus:outline-none"
                  />
                </div>
              </div>
            </div>
                </AssessmentSection>
                <AssessmentSection title="Planned surgery">
            <div className="px-6 pb-6 space-y-4">
              <div>
                <label htmlFor="precardia-surgeryType" className="block text-sm font-semibold text-cardio-primary mb-2">
                  Surgery Type *
                </label>
                <select id="precardia-surgeryType" aria-invalid={validationErrors.some(error => error.field === 'precardia-surgeryType') || undefined}
                  value={surgeryType}
                  onChange={(e) => setSurgeryType(e.target.value)}
                  className="w-full px-3 py-2 border-2 border-cardio-border rounded focus:border-cardio-secondary focus:outline-none"
                  required
                >
                  <option value="">Select surgery type...</option>
                  <optgroup label="Low Risk (<1% MACE)">
                    <option value="low-endoscopic">Endoscopic procedures</option>
                    <option value="low-superficial">Superficial procedures</option>
                    <option value="low-cataract">Cataract surgery</option>
                    <option value="low-breast">Breast surgery</option>
                  </optgroup>
                  <optgroup label="Intermediate Risk (1-5% MACE)">
                    <option value="intermediate-intraperitoneal">Intraperitoneal surgery</option>
                    <option value="intermediate-intrathoracic">Intrathoracic surgery</option>
                    <option value="intermediate-carotid">Carotid endarterectomy</option>
                    <option value="intermediate-head">Head and neck surgery</option>
                    <option value="intermediate-orthopedic">Orthopedic surgery</option>
                    <option value="intermediate-prostate">Prostate surgery</option>
                  </optgroup>
                  <optgroup label="High Risk (>5% MACE)">
                    <option value="high-aortic">Aortic and major vascular surgery</option>
                    <option value="high-peripheral">Peripheral vascular surgery</option>
                    <option value="high-emergency">Emergency major surgery</option>
                  </optgroup>
                  <option value="other">Other</option>
                </select>
              </div>

              {surgeryType === 'other' && (
                <div>
                  <label htmlFor="precardia-otherSurgery" className="block text-sm font-semibold text-cardio-primary mb-2">
                    Specify Other Surgery
                  </label>
                  <input id="precardia-otherSurgery" aria-invalid={validationErrors.some(error => error.field === 'precardia-otherSurgery') || undefined}
                    type="text"
                    value={otherSurgery}
                    onChange={(e) => setOtherSurgery(e.target.value)}
                    className="w-full px-3 py-2 border-2 border-cardio-border rounded focus:border-cardio-secondary focus:outline-none"
                    placeholder="Describe the surgical procedure"
                  />
                </div>
              )}

              <div>
                <label htmlFor="precardia-surgeryUrgency" className="block text-sm font-semibold text-cardio-primary mb-2">
                  Surgery Urgency *
                </label>
                <select id="precardia-surgeryUrgency" aria-invalid={validationErrors.some(error => error.field === 'precardia-surgeryUrgency') || undefined}
                  value={surgeryUrgency}
                  onChange={(e) => setSurgeryUrgency(e.target.value as SurgeryUrgencyOption)}
                  className="w-full px-3 py-2 border-2 border-cardio-border rounded focus:border-cardio-secondary focus:outline-none"
                  required
                >
                  <option value="elective">Elective (can delay for evaluation)</option>
                  <option value="time-sensitive">Time-sensitive (≤3 months)</option>
                  <option value="urgent">Urgent (≥2 to &lt;24 hours)</option>
                  <option value="emergency">Emergency (&lt;2 hours)</option>
                </select>
              </div>
              <PerioperativeContextFields group="procedure" value={guidelineContext} onChange={setGuidelineContext} otherSurgery={surgeryType === 'other'} />
            </div>
                </AssessmentSection>
              </>}
              {activeStep === 1 && <>
                <AssessmentSection title="Symptoms & active conditions">
            <div className="px-6 pb-6">
              <p className="text-sm text-gray-600 mb-4">
                <strong>Note:</strong> Presence of active cardiac conditions may require delay or cancellation of elective surgery.
              </p>
              <div className="mb-5 border-b border-cardio-border pb-5"><PerioperativeContextFields group="symptoms" value={guidelineContext} onChange={setGuidelineContext}  /></div>
              <div className="space-y-3">
                <label className="flex items-start cursor-pointer">
                  <input
                    type="checkbox"
                    checked={unstableAngina}
                    onChange={(e) => setUnstableAngina(e.target.checked)}
                    className="mt-1 mr-3"
                  />
                  <span>Unstable Angina or Acute Coronary Syndrome</span>
                </label>

                <label className="flex items-start cursor-pointer">
                  <input
                    type="checkbox"
                    checked={decompensatedHF}
                    onChange={(e) => setDecompensatedHF(e.target.checked)}
                    className="mt-1 mr-3"
                  />
                  <span>Decompensated Heart Failure</span>
                </label>

                <label className="flex items-start cursor-pointer">
                  <input
                    type="checkbox"
                    checked={significantArrhythmia}
                    onChange={(e) => setSignificantArrhythmia(e.target.checked)}
                    className="mt-1 mr-3"
                  />
                  <span>Significant Arrhythmia (symptomatic bradycardia, high-grade AV block, SVT with hemodynamic instability)</span>
                </label>

                <label className="flex items-start cursor-pointer">
                  <input
                    type="checkbox"
                    checked={severeValvularDisease}
                    onChange={(e) => setSevereValvularDisease(e.target.checked)}
                    className="mt-1 mr-3"
                  />
                  <span>Severe Valvular Stenosis or Regurgitation with Symptoms</span>
                </label>
              </div>
            </div>
                </AssessmentSection>
                <AssessmentSection title="Medical history">
            <div className="px-6 pb-6">
              <h4 className="font-semibold text-cardio-primary mb-3">Relevant cardiovascular history</h4>
              <div className="space-y-3 mb-4">
                <label className="flex items-start cursor-pointer">
                  <input
                    type="checkbox"
                    checked={ischemicHeartDisease}
                    onChange={(e) => setIschemicHeartDisease(e.target.checked)}
                    className="mt-1 mr-3"
                  />
                  <span>Ischemic Heart Disease (MI, angina, PCI, CABG)</span>
                </label>

                <label className="flex items-start cursor-pointer">
                  <input
                    type="checkbox"
                    checked={heartFailure}
                    onChange={(e) => setHeartFailure(e.target.checked)}
                    className="mt-1 mr-3"
                  />
                  <span>Heart Failure (HFrEF or HFpEF)</span>
                </label>

                <label className="flex items-start cursor-pointer">
                  <input
                    type="checkbox"
                    checked={cerebrovascularDisease}
                    onChange={(e) => setCerebrovascularDisease(e.target.checked)}
                    className="mt-1 mr-3"
                  />
                  <span>Cerebrovascular Disease (TIA, stroke)</span>
                </label>
                <PerioperativeContextFields group="stroke" value={guidelineContext} onChange={setGuidelineContext} hasStroke={cerebrovascularDisease} />

                <label className="flex items-start cursor-pointer">
                  <input
                    type="checkbox"
                    checked={diabetesInsulin}
                    onChange={(e) => setDiabetesInsulin(e.target.checked)}
                    className="mt-1 mr-3"
                  />
                  <span>Diabetes requiring insulin</span>
                </label>

                <label className="flex items-start cursor-pointer">
                  <input
                    type="checkbox"
                    checked={renalDysfunction}
                    onChange={(e) => setRenalDysfunction(e.target.checked)}
                    className="mt-1 mr-3"
                  />
                  <span>Serum creatinine ≥2.0 mg/dL (RCRI renal criterion)</span>
                </label>

                <label className="flex items-start cursor-pointer">
                  <input
                    type="checkbox"
                    checked={valvularHeartDisease}
                    onChange={(e) => {
                      const checked = e.target.checked;
                      setValvularHeartDisease(checked);
                      if (!checked) {
                        setValvularType('');
                        setValvularSeverity('');
                      }
                    }}
                    className="mt-1 mr-3"
                  />
                  <span>Valvular Heart Disease</span>
                </label>

                {valvularHeartDisease && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-cardio-bg/60 rounded-lg p-4 border border-cardio-border">
                    <div>
                      <label htmlFor="precardia-valvularType" className="block text-sm font-semibold text-cardio-primary mb-2">
                        Valve Involved
                      </label>
                      <select id="precardia-valvularType" aria-invalid={validationErrors.some(error => error.field === 'precardia-valvularType') || undefined}
                        value={valvularType}
                        onChange={(e) => setValvularType(e.target.value as ValvularTypeOption)}
                        className="w-full px-3 py-2 border-2 border-cardio-border rounded focus:border-cardio-secondary focus:outline-none"
                      >
                        <option value="">Select...</option>
                        <option value="aortic-stenosis">Aortic Stenosis</option>
                        <option value="aortic-regurgitation">Aortic Regurgitation</option>
                        <option value="mitral-stenosis">Mitral Stenosis</option>
                        <option value="mitral-regurgitation">Mitral Regurgitation</option>
                        <option value="tricuspid">Tricuspid Valve Disease</option>
                        <option value="pulmonary">Pulmonary Valve Disease</option>
                        <option value="multiple">Multiple Valves</option>
                      </select>
                    </div>
                    <div>
                      <label htmlFor="precardia-valvularSeverity" className="block text-sm font-semibold text-cardio-primary mb-2">
                        Severity
                      </label>
                      <select id="precardia-valvularSeverity" aria-invalid={validationErrors.some(error => error.field === 'precardia-valvularSeverity') || undefined}
                        value={valvularSeverity}
                        onChange={(e) => setValvularSeverity(e.target.value as ValvularSeverityOption)}
                        className="w-full px-3 py-2 border-2 border-cardio-border rounded focus:border-cardio-secondary focus:outline-none"
                      >
                        <option value="">Not specified</option>
                        <option value="mild">Mild</option>
                        <option value="moderate">Moderate</option>
                        <option value="severe">Severe</option>
                      </select>
                    </div>
                  </div>
                )}
              </div>

              <h4 className="font-semibold text-cardio-primary mb-3 pt-4 border-t">Additional Comorbidities</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label className="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={hypertension}
                    onChange={(e) => setHypertension(e.target.checked)}
                    className="mr-2"
                  />
                  <span>Hypertension</span>
                </label>

                <label className="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={atrialFibrillation}
                    onChange={(e) => {
                      const checked = e.target.checked;
                      setAtrialFibrillation(checked);
                      if (!checked) {
                        setAfibType('');
                        setAfibRateControl(false);
                        setAfibRhythmControl(false);
                      }
                    }}
                    className="mr-2"
                  />
                  <span>Atrial Fibrillation</span>
                </label>

                {atrialFibrillation && (
                  <div className="sm:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-3 bg-cardio-bg/60 border border-cardio-border rounded-lg p-4">
                    <div>
                      <label htmlFor="precardia-afibType" className="block text-sm font-semibold text-cardio-primary mb-2">
                        AF Type
                      </label>
                      <select id="precardia-afibType" aria-invalid={validationErrors.some(error => error.field === 'precardia-afibType') || undefined}
                        value={afibType}
                        onChange={(e) => setAfibType(e.target.value as AfibTypeOption)}
                        className="w-full px-3 py-2 border-2 border-cardio-border rounded focus:border-cardio-secondary focus:outline-none"
                      >
                        <option value="">Not specified</option>
                        <option value="paroxysmal">Paroxysmal</option>
                        <option value="persistent">Persistent</option>
                        <option value="long-standing-persistent">Long-standing Persistent</option>
                        <option value="permanent">Permanent</option>
                        <option value="new-onset">New-onset</option>
                      </select>
                    </div>
                    <div className="flex flex-col gap-2">
                      <label className="flex items-center text-sm cursor-pointer">
                        <input
                          type="checkbox"
                          checked={afibRateControl}
                          onChange={(e) => setAfibRateControl(e.target.checked)}
                          className="mr-2"
                        />
                        <span>On rate-control strategy</span>
                      </label>
                      <label className="flex items-center text-sm cursor-pointer">
                        <input
                          type="checkbox"
                          checked={afibRhythmControl}
                          onChange={(e) => setAfibRhythmControl(e.target.checked)}
                          className="mr-2"
                        />
                        <span>On rhythm-control/antiarrhythmic therapy</span>
                      </label>
                    </div>
                  </div>
                )}

                <label className="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={diabetes}
                    onChange={(e) => setDiabetes(e.target.checked)}
                    className="mr-2"
                  />
                  <span>Diabetes (non-insulin)</span>
                </label>

                <label className="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={ckd}
                    onChange={(e) => setCkd(e.target.checked)}
                    className="mr-2"
                  />
                  <span>Chronic Kidney Disease</span>
                </label>

                <label className="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={copd}
                    onChange={(e) => setCopd(e.target.checked)}
                    className="mr-2"
                  />
                  <span>COPD</span>
                </label>

                <label className="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={sleepApnea}
                    onChange={(e) => setSleepApnea(e.target.checked)}
                    className="mr-2"
                  />
                  <span>Sleep Apnea</span>
                </label>

                <label className="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={obesity}
                    onChange={(e) => setObesity(e.target.checked)}
                    className="mr-2"
                  />
                  <span>Obesity (BMI ≥30)</span>
                </label>

                <label className="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={currentSmoker}
                    onChange={(e) => setCurrentSmoker(e.target.checked)}
                    className="mr-2"
                  />
                  <span>Current Smoker</span>
                </label>

                <label className="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={pulmonaryHypertension}
                    onChange={(e) => setPulmonaryHypertension(e.target.checked)}
                    className="mr-2"
                  />
                  <span>Pulmonary Hypertension</span>
                </label>

                <label className="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={congenitalHeartDisease}
                    onChange={(e) => setCongenitalHeartDisease(e.target.checked)}
                    className="mr-2"
                  />
                  <span>Congenital Heart Disease</span>
                </label>
              </div>
            </div>
                </AssessmentSection>
              </>}
              {activeStep === 2 && <>
                <AssessmentSection title="Cardiac interventions">
            <div className="px-6 pb-6 space-y-6">
              {/* Recent MI */}
              <div className="space-y-3">
                <h4 className="text-lg font-semibold text-cardio-primary border-b border-cardio-border pb-2">
                  Recent MI
                </h4>
                <div>
                  <label htmlFor="precardia-recentMI" className="block text-sm font-medium text-gray-700 mb-2">
                    Has patient had a recent MI?
                  </label>
                  <select id="precardia-recentMI" aria-invalid={validationErrors.some(error => error.field === 'precardia-recentMI') || undefined}
                    value={recentMI}
                    onChange={(e) => setRecentMI(e.target.value as 'yes' | 'no')}
                    className="w-full px-3 py-2 border-2 border-cardio-border rounded focus:border-cardio-secondary focus:outline-none"
                  >
                    <option value="no">No</option>
                    <option value="yes">Yes</option>
                  </select>
                </div>
                {recentMI === 'yes' && (
                  <div className="ml-4 pl-4 border-l-2 border-cardio-border bg-cardio-bg/30 rounded-r p-3">
                    <label htmlFor="precardia-miTiming" className="block text-sm font-medium text-gray-700 mb-2">
                      MI Timing
                    </label>
                    <select id="precardia-miTiming" aria-invalid={validationErrors.some(error => error.field === 'precardia-miTiming') || undefined}
                      value={miTiming}
                      onChange={(e) => setMiTiming(e.target.value as MiTimingOption)}
                      className="w-full px-3 py-2 border-2 border-cardio-border rounded focus:border-cardio-secondary focus:outline-none"
                    >
                      <option value="">Select...</option>
                      <option value="lt4w">&lt;4 weeks</option>
                      <option value="4to8w">4-8 weeks</option>
                      <option value="gt8w">&gt;8 weeks</option>
                      <option value="unknown">Unknown</option>
                    </select>
                  </div>
                )}
              </div>

              {/* Coronary Stent */}
              <div className="space-y-3">
                <h4 className="text-lg font-semibold text-cardio-primary border-b border-cardio-border pb-2">
                  Coronary Stent
                </h4>
                <div>
                  <label htmlFor="precardia-stentType" className="block text-sm font-medium text-gray-700 mb-2">
                    Stent type
                  </label>
                  <select id="precardia-stentType" aria-invalid={validationErrors.some(error => error.field === 'precardia-stentType') || undefined}
                    value={stentType}
                    onChange={(e) => { setStentType(e.target.value as StentTypeOption); setStentTiming(''); }}
                    className="w-full px-3 py-2 border-2 border-cardio-border rounded focus:border-cardio-secondary focus:outline-none"
                  >
                    <option value="">No stent</option>
                    <option value="bms">Bare-metal stent (BMS)</option>
                    <option value="des">Drug-eluting stent (DES)</option>
                  </select>
                </div>
                {stentType && stentType !== 'none' && (
                  <div className="ml-4 pl-4 border-l-2 border-cardio-border bg-cardio-bg/30 rounded-r p-3">
                    <label htmlFor="precardia-stentTiming" className="block text-sm font-medium text-gray-700 mb-2">
                      Stent Timing
                    </label>
                    <select id="precardia-stentTiming" aria-invalid={validationErrors.some(error => error.field === 'precardia-stentTiming') || undefined}
                      value={stentTiming}
                      onChange={(e) => setStentTiming(e.target.value as StentTimingOption)}
                      className="w-full px-3 py-2 border-2 border-cardio-border rounded focus:border-cardio-secondary focus:outline-none"
                    >
                      <option value="">Select...</option>
                      <option value="le30d">≤30 days</option>
                      <option value="gt30d-lt3mo">&gt;30 days to &lt;3 calendar months</option>
                      <option value="3to6mo">3 to &lt;6 calendar months</option>
                      <option value="6to12mo">6 to &lt;12 calendar months</option>
                      <option value="ge12mo">≥12 calendar months</option>
                      <option value="unknown">Unknown</option>
                    </select>
                  </div>
                )}
              </div>

              <PerioperativeContextFields group="pci" value={guidelineContext} onChange={setGuidelineContext} hasStent={stentType === 'des' || stentType === 'bms'} />
              {/* CABG */}
              <div className="space-y-3">
                <h4 className="text-lg font-semibold text-cardio-primary border-b border-cardio-border pb-2">
                  CABG
                </h4>
                <div>
                  <label htmlFor="precardia-cabg" className="block text-sm font-medium text-gray-700 mb-2">
                    Has patient had CABG?
                  </label>
                  <select id="precardia-cabg" aria-invalid={validationErrors.some(error => error.field === 'precardia-cabg') || undefined}
                    value={cabg}
                    onChange={(e) => setCabg(e.target.value as 'yes' | 'no')}
                    className="w-full px-3 py-2 border-2 border-cardio-border rounded focus:border-cardio-secondary focus:outline-none"
                  >
                    <option value="no">No</option>
                    <option value="yes">Yes</option>
                  </select>
                </div>
                {cabg === 'yes' && (
                  <div className="ml-4 pl-4 border-l-2 border-cardio-border bg-cardio-bg/30 rounded-r p-3">
                    <label htmlFor="precardia-cabgTiming" className="block text-sm font-medium text-gray-700 mb-2">
                      CABG Timing
                    </label>
                    <select id="precardia-cabgTiming" aria-invalid={validationErrors.some(error => error.field === 'precardia-cabgTiming') || undefined}
                      value={cabgTiming}
                      onChange={(e) => setCabgTiming(e.target.value as CabgTimingOption)}
                      className="w-full px-3 py-2 border-2 border-cardio-border rounded focus:border-cardio-secondary focus:outline-none"
                    >
                      <option value="">Select...</option>
                      <option value="lt6w">&lt;6 weeks</option>
                      <option value="6wto3mo">6 weeks to 3 months</option>
                      <option value="gt3mo">&gt;3 months</option>
                    </select>
                  </div>
                )}
              </div>

              {/* TAVR/TAVI */}
              <div className="space-y-3">
                <h4 className="text-lg font-semibold text-cardio-primary border-b border-cardio-border pb-2">
                  TAVR/TAVI
                </h4>
                <div>
                  <label htmlFor="precardia-tavrTavi" className="block text-sm font-medium text-gray-700 mb-2">
                    TAVR/TAVI in Past Year?
                  </label>
                  <select id="precardia-tavrTavi" aria-invalid={validationErrors.some(error => error.field === 'precardia-tavrTavi') || undefined}
                    value={tavrTavi}
                    onChange={(e) => setTavrTavi(e.target.value as 'yes' | 'no')}
                    className="w-full px-3 py-2 border-2 border-cardio-border rounded focus:border-cardio-secondary focus:outline-none"
                  >
                    <option value="no">No</option>
                    <option value="yes">Yes</option>
                  </select>
                </div>
                {tavrTavi === 'yes' && (
                  <div className="ml-4 pl-4 border-l-2 border-cardio-border bg-cardio-bg/30 rounded-r p-3">
                    <label htmlFor="precardia-tavrTiming" className="block text-sm font-medium text-gray-700 mb-2">
                      TAVR/TAVI Timing
                    </label>
                    <select id="precardia-tavrTiming" aria-invalid={validationErrors.some(error => error.field === 'precardia-tavrTiming') || undefined}
                      value={tavrTiming}
                      onChange={(e) => setTavrTiming(e.target.value as TavrTimingOption)}
                      className="w-full px-3 py-2 border-2 border-cardio-border rounded focus:border-cardio-secondary focus:outline-none"
                    >
                      <option value="">Select...</option>
                      <option value="lt4w">&lt;4 weeks</option>
                      <option value="gt4w">&gt;4 weeks</option>
                      <option value="unknown">Unknown</option>
                    </select>
                  </div>
                )}
              </div>

              {/* TEER / MitraClip */}
              <div className="space-y-3">
                <h4 className="text-lg font-semibold text-cardio-primary border-b border-cardio-border pb-2">
                  TEER / MitraClip
                </h4>
                <div>
                  <label htmlFor="precardia-teer" className="block text-sm font-medium text-gray-700 mb-2">
                    TEER / MitraClip in Past Year?
                  </label>
                  <select id="precardia-teer" aria-invalid={validationErrors.some(error => error.field === 'precardia-teer') || undefined}
                    value={teer}
                    onChange={(e) => {
                      const value = e.target.value as 'yes' | 'no';
                      setTeer(value);
                      if (value === 'no') {
                        setTeerTiming('');
                      }
                    }}
                    className="w-full px-3 py-2 border-2 border-cardio-border rounded focus:border-cardio-secondary focus:outline-none"
                  >
                    <option value="no">No</option>
                    <option value="yes">Yes</option>
                  </select>
                </div>
                {teer === 'yes' && (
                  <div className="ml-4 pl-4 border-l-2 border-cardio-border bg-cardio-bg/30 rounded-r p-3">
                    <label htmlFor="precardia-teerTiming" className="block text-sm font-medium text-gray-700 mb-2">
                      TEER Timing
                    </label>
                    <select id="precardia-teerTiming" aria-invalid={validationErrors.some(error => error.field === 'precardia-teerTiming') || undefined}
                      value={teerTiming}
                      onChange={(e) => setTeerTiming(e.target.value as TeerTimingOption)}
                      className="w-full px-3 py-2 border-2 border-cardio-border rounded focus:border-cardio-secondary focus:outline-none"
                    >
                      <option value="">Select...</option>
                      <option value="lt4w">&lt;4 weeks</option>
                      <option value="gt4w">&gt;4 weeks</option>
                      <option value="unknown">Unknown</option>
                    </select>
                  </div>
                )}
              </div>
            </div>
                </AssessmentSection>
                <AssessmentSection title="Implanted cardiac devices">
            <div className="px-6 pb-6 space-y-4">
              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={hasCIED}
                  onChange={(e) => {
                    const checked = e.target.checked;
                    setHasCIED(checked);
                    if (!checked) {
                      setPacemaker(false);
                      setIcd(false);
                      setCrt(false);
                      setCiedInterrogation('');
                    }
                  }}
                  className="mr-2"
                />
                <span>Cardiac device in situ (pacemaker, ICD, CRT)</span>
              </label>

              {hasCIED && (
                <div className="space-y-3 bg-cardio-bg/60 border border-cardio-border rounded-lg p-4">
                  <div className="flex flex-wrap gap-4">
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        id="precardia-pacemaker" checked={pacemaker}
                        onChange={(e) => setPacemaker(e.target.checked)}
                        className="mr-2"
                      />
                      <span>Pacemaker</span>
                    </label>
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={icd}
                        onChange={(e) => setIcd(e.target.checked)}
                        className="mr-2"
                      />
                      <span>ICD</span>
                    </label>
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={crt}
                        onChange={(e) => setCrt(e.target.checked)}
                        className="mr-2"
                      />
                      <span>CRT</span>
                    </label>
                  </div>

                  <div>
                    <label htmlFor="precardia-ciedInterrogation" className="block text-sm font-semibold text-cardio-primary mb-2">
                      Device interrogation status
                    </label>
                    <select id="precardia-ciedInterrogation" aria-invalid={validationErrors.some(error => error.field === 'precardia-ciedInterrogation') || undefined}
                      value={ciedInterrogation}
                      onChange={(e) => setCiedInterrogation(e.target.value as CIEDInterrogationOption)}
                      className="w-full px-3 py-2 border-2 border-cardio-border rounded focus:border-cardio-secondary focus:outline-none"
                    >
                      <option value="">Select...</option>
                      <option value="recent">Recent interrogation (&lt;6 months)</option>
                      <option value="needed">Interrogation needed pre-op</option>
                      <option value="not-needed">Not required pre-op</option>
                    </select>
                  </div>
                </div>
              )}
            </div>
                </AssessmentSection>
              </>}
              {activeStep === 3 && <>
                <AssessmentSection title="Functional capacity">
            <div className="px-6 pb-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-cardio-primary mb-2">
                  Assessment Method
                </label>
                <div className="flex flex-wrap gap-4">
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="radio" name="capacity-method"
                      checked={useDASI}
                      onChange={() => setUseDASI(true)}
                      className="mr-2"
                    />
                    <span>DASI Questionnaire</span>
                  </label>
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="radio" name="capacity-method"
                      checked={!useDASI}
                      onChange={() => setUseDASI(false)}
                      className="mr-2"
                    />
                    <span>Clinical Assessment</span>
                  </label>
                </div>
              </div>

              {useDASI ? (
                <div className="space-y-4">
                  <p className="text-sm text-gray-600 font-medium">Select every activity the patient can perform, then confirm the questionnaire is complete.</p>

                  {/* Toggle Switch Component */}
                  {[
                    { state: dasi1, setState: setDasi1, label: 'Personal care (eating, dressing, bathing)' },
                    { state: dasi2, setState: setDasi2, label: 'Walking indoors' },
                    { state: dasi3, setState: setDasi3, label: 'Walking 1-2 blocks on level ground' },
                    { state: dasi4, setState: setDasi4, label: 'Climbing one flight of stairs or walking uphill' },
                    { state: dasi5, setState: setDasi5, label: 'Running a short distance' },
                    { state: dasi6, setState: setDasi6, label: 'Light housework (dusting, washing dishes)' },
                    { state: dasi7, setState: setDasi7, label: 'Moderate housework (vacuuming, sweeping)' },
                    { state: dasi8, setState: setDasi8, label: 'Heavy housework (scrubbing floors, lifting furniture)' },
                    { state: dasi9, setState: setDasi9, label: 'Yard work (raking leaves, mowing lawn)' },
                    { state: dasi10, setState: setDasi10, label: 'Sexual relations' },
                    { state: dasi11, setState: setDasi11, label: 'Participating in moderate recreational activities (golf, dancing, tennis)' },
                    { state: dasi12, setState: setDasi12, label: 'Participating in strenuous sports (swimming, jogging, football)' }
                  ].map(({ state, setState, label }, index) => (
                    <label key={index} className="flex cursor-pointer items-start gap-3 rounded-lg border border-cardio-border p-3 hover:bg-cardio-bg">
                      <input type="checkbox" checked={state} onChange={event => setState(event.target.checked)} className="mt-1 h-4 w-4 shrink-0" />
                      <span className="text-sm leading-relaxed text-gray-700">{label}</span>
                    </label>
                  ))}

                  <label className="flex items-start gap-3 mt-4">
                    <input type="checkbox" checked={dasiCompleted} onChange={e => setDasiCompleted(e.target.checked)} />
                    <span>I have reviewed all 12 DASI activities with the patient (unchecked activities mean unable).</span>
                  </label>
                  <p className="text-sm text-gray-600 mt-2">DASI ≤34 denotes poor functional capacity for this guideline even if estimated METs exceed 4.</p>
                  {/* DASI Score Calculation */}
                  {(() => {
                    const dasiData: Partial<PreCardiaData> = {
                      dasi1, dasi2, dasi3, dasi4, dasi5, dasi6,
                      dasi7, dasi8, dasi9, dasi10, dasi11, dasi12
                    };
                    const dasiResult = calculateDASI(dasiData);
                    const capacityCategory = getDASIFunctionalCapacity(dasiResult);
                    return (
                      <div className="mt-6 pt-4 border-t border-cardio-border bg-cardio-primary/5 rounded-lg p-4">
                        <h4 className="text-sm font-semibold text-cardio-primary mb-3">DASI Score Calculation</h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-gray-600">DASI Score:</span>
                            <span className="ml-2 font-semibold text-cardio-primary">
                              {dasiResult.score.toFixed(1)}
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-600">Estimated METs:</span>
                            <span className="ml-2 font-semibold text-cardio-primary">
                              {dasiResult.mets.toFixed(1)}
                            </span>
                          </div>
                          <div className="sm:col-span-2">
                            <span className="text-gray-600">Functional Capacity:</span>
                            <span className="ml-2 font-semibold text-cardio-secondary">
                              {dasiCompleted ? capacityCategory.description : 'Unknown — confirm questionnaire completion'}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              ) : (
                <div>
                  <label htmlFor="precardia-functionalCapacity" className="block text-sm font-semibold text-cardio-primary mb-2">
                    Functional Capacity (METs)
                  </label>
                  <select id="precardia-functionalCapacity" aria-invalid={validationErrors.some(error => error.field === 'precardia-functionalCapacity') || undefined}
                    value={functionalCapacity}
                    onChange={(e) => setFunctionalCapacity(e.target.value as FunctionalCapacityOption)}
                    className="w-full px-3 py-2 border-2 border-cardio-border rounded focus:border-cardio-secondary focus:outline-none"
                  >
                    <option value="excellent">Excellent (&gt;10 METs) - Strenuous sports, running</option>
                    <option value="good">Good (7-10 METs) - Jogging, climbing stairs</option>
                    <option value="moderate">Moderate (4-7 METs) - Walking uphill, light jogging</option>
                    <option value="poor">Poor (&lt;4 METs) - Cannot walk one flight of stairs</option>
                    <option value="unknown">Unknown / Unable to assess</option>
                  </select>
                </div>
              )}
            </div>
                </AssessmentSection>
                <AssessmentSection title="Frailty">
            <div className="px-6 pb-6 space-y-3">
              <div>
                <label htmlFor="precardia-frailtyScore" className="block text-sm font-semibold text-cardio-primary mb-2">
                  Clinical Frailty Scale
                </label>
                <select id="precardia-frailtyScore" aria-invalid={validationErrors.some(error => error.field === 'precardia-frailtyScore') || undefined}
                  value={frailtyScore}
                  onChange={(e) => setFrailtyScore(e.target.value as FrailtyScoreOption)}
                  className="w-full px-3 py-2 border-2 border-cardio-border rounded focus:border-cardio-secondary focus:outline-none"
                >
                  <option value="">Not assessed</option>
                  <option value="1">1 - Very Fit</option>
                  <option value="2">2 - Well</option>
                  <option value="3">3 - Managing Well</option>
                  <option value="4">4 - Living with Very Mild Frailty</option>
                  <option value="5">5 - Living with Mild Frailty</option>
                  <option value="6">6 - Living with Moderate Frailty</option>
                  <option value="7">7 - Living with Severe Frailty</option>
                  <option value="8">8 - Living with Very Severe Frailty</option>
                  <option value="9">9 - Terminally Ill</option>
                </select>
              </div>
              <p className="text-xs text-gray-600">
                Frailty ≥4 is associated with increased perioperative complications and may warrant a multidisciplinary optimization plan.
              </p>
            </div>
                </AssessmentSection>
              </>}
              {activeStep === 4 && <>
                <AssessmentSection title="Current medications">
            <div className="px-6 pb-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={betaBlocker}
                  onChange={(e) => setBetaBlocker(e.target.checked)}
                  className="mr-2"
                />
                <span>Beta-blocker</span>
              </label>

              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={statin}
                  onChange={(e) => setStatin(e.target.checked)}
                  className="mr-2"
                />
                <span>Statin</span>
              </label>

              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={aceARB}
                  onChange={(e) => setAceARB(e.target.checked)}
                  className="mr-2"
                />
                <span>ACE Inhibitor/ARB</span>
              </label>

              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={sglt2i}
                  onChange={(e) => setSglt2i(e.target.checked)}
                  className="mr-2"
                />
                <span>SGLT2 Inhibitor</span>
              </label>

              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={anticoagulant}
                  onChange={(e) => setAnticoagulant(e.target.checked)}
                  className="mr-2"
                />
                <span>Anticoagulant</span>
              </label>

              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={antiplatelet}
                  onChange={(e) => setAntiplatelet(e.target.checked)}
                  className="mr-2"
                />
                <span>Antiplatelet (aspirin, clopidogrel)</span>
              </label>
              <div className="sm:col-span-2 border-t border-cardio-border pt-4"><PerioperativeContextFields group="medications" value={guidelineContext} onChange={setGuidelineContext} takesRaas={aceARB} takesBetaBlocker={betaBlocker} /></div>
            </div>
                </AssessmentSection>
                <AssessmentSection title="Laboratory values (optional)">
            <div className="px-6 pb-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <p className="text-sm text-gray-500 sm:col-span-2">Enter available results only. Blank values stay unknown.</p>
              <div>
                <label htmlFor="precardia-creatinine" className="block text-sm font-semibold text-cardio-primary mb-2">
                  Creatinine (mg/dL)
                </label>
                <input id="precardia-creatinine" aria-invalid={validationErrors.some(error => error.field === 'precardia-creatinine') || undefined}
                  type="number"
                  value={creatinine}
                  onChange={(e) => setCreatinine(e.target.value)}
                  step="0.1"
                  className="w-full px-3 py-2 border-2 border-cardio-border rounded focus:border-cardio-secondary focus:outline-none"
                />
              </div>

              <div>
                <label htmlFor="precardia-bnp" className="block text-sm font-semibold text-cardio-primary mb-2">
                  BNP (pg/mL)
                </label>
                <input id="precardia-bnp" aria-invalid={validationErrors.some(error => error.field === 'precardia-bnp') || undefined}
                  type="number"
                  value={bnp}
                  onChange={(e) => setBnp(e.target.value)}
                  className="w-full px-3 py-2 border-2 border-cardio-border rounded focus:border-cardio-secondary focus:outline-none"
                />
              </div>

              <div>
                <label htmlFor="precardia-ntproBNP" className="block text-sm font-semibold text-cardio-primary mb-2">
                  NT-proBNP (pg/mL)
                </label>
                <input id="precardia-ntproBNP" aria-invalid={validationErrors.some(error => error.field === 'precardia-ntproBNP') || undefined}
                  type="number"
                  value={ntproBNP}
                  onChange={(e) => setNtproBNP(e.target.value)}
                  className="w-full px-3 py-2 border-2 border-cardio-border rounded focus:border-cardio-secondary focus:outline-none"
                />
              </div>

              <div>
                <label htmlFor="precardia-troponin" className="block text-sm font-semibold text-cardio-primary mb-2">
                  Troponin (ng/mL)
                </label>
                <input id="precardia-troponin" aria-invalid={validationErrors.some(error => error.field === 'precardia-troponin') || undefined}
                  type="number"
                  value={troponin}
                  onChange={(e) => setTroponin(e.target.value)}
                  step="0.001"
                  className="w-full px-3 py-2 border-2 border-cardio-border rounded focus:border-cardio-secondary focus:outline-none"
                />
              </div>

              <div>
                <label htmlFor="precardia-troponinAssay" className="block text-sm font-semibold text-cardio-primary mb-2">
                  Troponin Assay
                </label>
                <select id="precardia-troponinAssay" aria-invalid={validationErrors.some(error => error.field === 'precardia-troponinAssay') || undefined}
                  value={troponinAssay}
                  onChange={(e) => handleTroponinAssayChange(e.target.value)}
                  className="w-full px-3 py-2 border-2 border-cardio-border rounded focus:border-cardio-secondary focus:outline-none"
                >
                  <option value="">Select assay...</option>
                  {Object.entries(TROPONIN_ASSAY_LIMITS).map(([key, value]) => (
                    <option key={key} value={key}>{value.label}</option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  Selecting an assay auto-fills the 99th percentile upper reference limit. Adjust if your lab uses a different cut-off.
                </p>
              </div>

              <div>
                <label htmlFor="precardia-troponinUpperLimit" className="block text-sm font-semibold text-cardio-primary mb-2">
                  Troponin Upper Reference Limit (ng/mL)
                </label>
                <input id="precardia-troponinUpperLimit" aria-invalid={validationErrors.some(error => error.field === 'precardia-troponinUpperLimit') || undefined}
                  type="number"
                  value={troponinUpperLimit}
                  onChange={(e) => {
                    setTroponinUpperLimit(e.target.value);
                    setTroponinUpperLimitManuallySet(true);
                  }}
                  step="0.001"
                  className="w-full px-3 py-2 border-2 border-cardio-border rounded focus:border-cardio-secondary focus:outline-none"
                  placeholder="Enter 99th percentile cut-off"
                />
              </div>
            </div>
                </AssessmentSection>
              </>}
              {activeStep === 5 && <>
                <AssessmentSection title="Review your entries">
                  <div className="px-5 pb-5 sm:px-6">
                    <p className="mb-4 text-sm text-gray-600">Review the selected information before generating the report. Unselected conditions are not a confirmed negative history.</p>
                    <dl className="divide-y divide-cardio-border">{summary.map((detail, index) => <div key={ASSESSMENT_STEPS[index].title} className="flex items-start justify-between gap-4 py-4">
                      <div><dt className="text-sm font-semibold text-cardio-primary">{ASSESSMENT_STEPS[index].title}</dt><dd className="mt-1 text-sm leading-relaxed text-gray-600">{detail}</dd></div>
                      <button type="button" onClick={() => goToStep(index)} className="shrink-0 rounded px-2 py-1 text-sm font-semibold text-cardio-secondary underline" aria-label={`Edit ${ASSESSMENT_STEPS[index].title.toLowerCase()}`}>Edit</button>
                    </div>)}</dl>
                  </div>
                </AssessmentSection>
                <AssessmentSection title="Additional risk estimate (optional)">
                  <div className="px-5 pb-5 sm:px-6"><PerioperativeContextFields group="risk" value={guidelineContext} onChange={setGuidelineContext} /></div>
                </AssessmentSection>
                {reportNeedsUpdate && <p role="status" className="mb-4 rounded-lg bg-amber-50 p-3 text-sm text-amber-900">Your entries changed. Generate an updated report before copying or printing.</p>}
              </>}
              <div className="no-print mb-6 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-cardio-border bg-white p-4">
                <button type="button" disabled={activeStep === 0} onClick={() => goToStep(activeStep - 1)} className="inline-flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-semibold text-cardio-primary hover:bg-cardio-bg disabled:cursor-default disabled:opacity-40"><ArrowLeft className="h-4 w-4" /> Back</button>
                {activeStep < 5 ? <button type="submit" className="inline-flex items-center gap-2 rounded-lg bg-cardio-primary px-4 py-2.5 text-sm font-semibold text-white hover:bg-cardio-secondary">Continue <ArrowRight className="h-4 w-4" /></button> : <button type="submit" className="inline-flex items-center gap-2 rounded-lg bg-cardio-primary px-4 py-2.5 text-sm font-semibold text-white hover:bg-cardio-secondary"><FileText className="h-4 w-4" /> {report ? 'Regenerate report' : 'Generate report'}</button>}
              </div>
            </form>
            {report && activeStep === 5 && <section className="print-content rounded-lg border border-cardio-border bg-white p-4 sm:p-6">
              <div className="no-print mb-4 flex flex-wrap items-center justify-between gap-3">
                <h2 id="assessment-report-heading" tabIndex={-1} className="scroll-mt-6 text-xl font-bold text-cardio-primary">Assessment report</h2>
                <div className="flex gap-2">
                  <button type="button" onClick={handleCopyReport} className="inline-flex items-center gap-2 rounded-lg border border-cardio-border px-3 py-2 text-sm font-semibold text-cardio-primary hover:bg-cardio-bg"><Copy className="h-4 w-4" /> Copy</button>
                  <button type="button" onClick={handlePrintReport} className="inline-flex items-center gap-2 rounded-lg border border-cardio-border px-3 py-2 text-sm font-semibold text-cardio-primary hover:bg-cardio-bg"><Printer className="h-4 w-4" /> Print</button>
                </div>
              </div>
              <p role="status" className="no-print mb-3 text-sm text-cardio-primary">{copyStatus}</p>
              <pre tabIndex={0} aria-label="Generated assessment report" className="whitespace-pre-wrap break-words rounded border border-cardio-border bg-gray-50 p-3 font-mono text-xs leading-relaxed sm:p-4 sm:text-sm">{report}</pre>
            </section>}
          </main>
        </div>
      </div>
    </div>
  );
}
