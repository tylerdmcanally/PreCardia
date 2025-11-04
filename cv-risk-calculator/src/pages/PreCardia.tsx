import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { PreCardiaData } from '../types/precardia.types';
import { generatePreCardiaReport } from '../logic/precardia/reportGenerator';
import { TROPONIN_ASSAY_LIMITS } from '../logic/precardia/constants';
import { ArrowLeft, FileText, Copy, Printer, ChevronDown, ChevronUp } from 'lucide-react';

type MiTimingOption = '' | 'lt4w' | '4to8w' | 'gt8w' | 'unknown';
type StentTypeOption = '' | 'bms' | 'des' | 'none';
type StentTimingOption = '' | 'lt2w' | '2to4w' | '4to12w' | 'gt12w';
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

export function PreCardia() {
  const [report, setReport] = useState<string | null>(null);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(['demographics', 'activeConditions', 'history', 'devices', 'surgical'])
  );

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
  const [useDASI, setUseDASI] = useState(false);
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

  const toggleSection = (section: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(section)) {
      newExpanded.delete(section);
    } else {
      newExpanded.add(section);
    }
    setExpandedSections(newExpanded);
  };

  const handleGenerateReport = () => {
    const validationErrors: string[] = [];

    const ageValue = parseInt(age, 10);
    if (!age || Number.isNaN(ageValue) || ageValue <= 0) {
      validationErrors.push('Enter a valid patient age.');
    }

    if (!surgeryType) {
      validationErrors.push('Select the planned surgery type.');
    }

    const weightValue = weight.trim() === '' ? NaN : parseFloat(weight);
    const heightValue = height.trim() === '' ? NaN : parseFloat(height);

    if ((Number.isNaN(weightValue) && !Number.isNaN(heightValue)) || (!Number.isNaN(weightValue) && Number.isNaN(heightValue))) {
      validationErrors.push('Provide both weight and height (or leave both blank).');
    }

    if (valvularHeartDisease && !valvularSeverity) {
      validationErrors.push('Specify valve severity when valvular heart disease is selected.');
    }

    if (atrialFibrillation && !afibType) {
      validationErrors.push('Select the atrial fibrillation subtype.');
    }

    if (recentMI === 'yes' && !miTiming) {
      validationErrors.push('Specify the timing of the recent myocardial infarction.');
    }

    if (stentType && stentType !== 'none' && !stentTiming) {
      validationErrors.push('Specify the timing of the most recent coronary stent.');
    }

    if (cabg === 'yes' && !cabgTiming) {
      validationErrors.push('Specify the timing of the CABG procedure.');
    }

    if (tavrTavi === 'yes' && !tavrTiming) {
      validationErrors.push('Specify the timing of the TAVR/TAVI procedure.');
    }

    if (teer === 'yes' && !teerTiming) {
      validationErrors.push('Specify the timing of the TEER procedure.');
    }

    if (hasCIED) {
      if (!pacemaker && !icd && !crt) {
        validationErrors.push('Select at least one device type for the patient with a CIED.');
      }
      if (!ciedInterrogation) {
        validationErrors.push('Specify the device interrogation status.');
      }
    }

    if (validationErrors.length > 0) {
      alert(`Please address the following before generating the report:\n\n- ${validationErrors.join('\n- ')}`);
      return;
    }

    const data: PreCardiaData = {
      age: parseInt(age) || 0,
      sex,
      weight: parseFloat(weight) || 0,
      height: parseFloat(height) || 0,
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
      stentTiming: stentTiming || undefined,
      cabg,
      cabgTiming: cabgTiming || undefined,
      tavrTavi,
      tavrTiming: tavrTiming || undefined,
      teer,
      teerTiming: teer === 'yes' ? teerTiming || undefined : undefined,
      creatinine: creatinine ? parseFloat(creatinine) : undefined,
      bnp: bnp ? parseFloat(bnp) : undefined,
      ntproBNP: ntproBNP ? parseFloat(ntproBNP) : undefined,
      troponin: troponin ? parseFloat(troponin) : undefined,
      troponinAssay: troponinAssay || undefined,
      troponinUpperLimit: troponinUpperLimit ? parseFloat(troponinUpperLimit) : undefined,
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
  };

  const handleCopyReport = () => {
    if (report) {
      navigator.clipboard.writeText(report);
      alert('Report copied to clipboard!');
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

  return (
    <div className="min-h-screen bg-cardio-bg">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-cardio-lg p-6 mb-6">
          <Link to="/" className="inline-flex items-center text-cardio-secondary hover:text-cardio-primary mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to CardioTools
          </Link>
          <h1 className="text-3xl font-bold text-cardio-primary mb-2">PreCardia</h1>
          <p className="text-gray-600">Cardiac Pre-Operative Risk Assessment Tool</p>
          <p className="text-sm text-gray-500">Based on 2024 ACC/AHA/ACCP/HRS Guidelines</p>
        </div>

        {/* Demographics Section */}
        <section className="bg-white rounded-lg shadow-cardio mb-4">
          <button
            onClick={() => toggleSection('demographics')}
            className="w-full px-6 py-4 flex items-center justify-between text-left"
          >
            <h2 className="text-xl font-bold text-cardio-primary">Patient Demographics</h2>
            {expandedSections.has('demographics') ? (
              <ChevronUp className="w-5 h-5 text-gray-400" />
            ) : (
              <ChevronDown className="w-5 h-5 text-gray-400" />
            )}
          </button>

          {expandedSections.has('demographics') && (
            <div className="px-6 pb-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-cardio-primary mb-2">
                    Age (years) *
                  </label>
                  <input
                    type="number"
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                    className="w-full px-3 py-2 border-2 border-cardio-border rounded focus:border-cardio-secondary focus:outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-cardio-primary mb-2">
                    Sex *
                  </label>
                  <select
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
                  <label className="block text-sm font-semibold text-cardio-primary mb-2">
                    Unit System
                  </label>
                  <select
                    value={unitSystem}
                    onChange={(e) => setUnitSystem(e.target.value as 'imperial' | 'metric')}
                    className="w-full px-3 py-2 border-2 border-cardio-border rounded focus:border-cardio-secondary focus:outline-none"
                  >
                    <option value="imperial">Imperial (lbs, in)</option>
                    <option value="metric">Metric (kg, cm)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-cardio-primary mb-2">
                    Weight ({unitSystem === 'imperial' ? 'lbs' : 'kg'})
                  </label>
                  <input
                    type="number"
                    value={weight}
                    onChange={(e) => setWeight(e.target.value)}
                    step="0.1"
                    className="w-full px-3 py-2 border-2 border-cardio-border rounded focus:border-cardio-secondary focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-cardio-primary mb-2">
                    Height ({unitSystem === 'imperial' ? 'in' : 'cm'})
                  </label>
                  <input
                    type="number"
                    value={height}
                    onChange={(e) => setHeight(e.target.value)}
                    step="0.1"
                    className="w-full px-3 py-2 border-2 border-cardio-border rounded focus:border-cardio-secondary focus:outline-none"
                  />
                </div>
              </div>
            </div>
          )}
        </section>

        {/* Active Cardiac Conditions */}
        <section className="bg-white rounded-lg shadow-cardio mb-4 border-l-4 border-cardio-accent">
          <button
            onClick={() => toggleSection('activeConditions')}
            className="w-full px-6 py-4 flex items-center justify-between text-left"
          >
            <h2 className="text-xl font-bold text-cardio-primary">Active Cardiac Conditions</h2>
            {expandedSections.has('activeConditions') ? (
              <ChevronUp className="w-5 h-5 text-gray-400" />
            ) : (
              <ChevronDown className="w-5 h-5 text-gray-400" />
            )}
          </button>

          {expandedSections.has('activeConditions') && (
            <div className="px-6 pb-6">
              <p className="text-sm text-gray-600 mb-4">
                <strong>Note:</strong> Presence of active cardiac conditions may require delay or cancellation of elective surgery.
              </p>
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
          )}
        </section>

        {/* Medical History */}
        <section className="bg-white rounded-lg shadow-cardio mb-4">
          <button
            onClick={() => toggleSection('history')}
            className="w-full px-6 py-4 flex items-center justify-between text-left"
          >
            <h2 className="text-xl font-bold text-cardio-primary">Medical History</h2>
            {expandedSections.has('history') ? (
              <ChevronUp className="w-5 h-5 text-gray-400" />
            ) : (
              <ChevronDown className="w-5 h-5 text-gray-400" />
            )}
          </button>

          {expandedSections.has('history') && (
            <div className="px-6 pb-6">
              <h3 className="font-semibold text-cardio-primary mb-3">RCRI Risk Factors</h3>
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
                  <span>Renal Dysfunction (Creatinine &gt;2.0 mg/dL or dialysis)</span>
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
                  <div className="grid grid-cols-2 gap-3 bg-cardio-bg/60 rounded-lg p-4 border border-cardio-border">
                    <div>
                      <label className="block text-sm font-semibold text-cardio-primary mb-2">
                        Valve Involved
                      </label>
                      <select
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
                      <label className="block text-sm font-semibold text-cardio-primary mb-2">
                        Severity
                      </label>
                      <select
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

              <h3 className="font-semibold text-cardio-primary mb-3 pt-4 border-t">Additional Comorbidities</h3>
              <div className="grid grid-cols-2 gap-3">
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
                  <div className="col-span-2 grid grid-cols-1 md:grid-cols-2 gap-3 bg-cardio-bg/60 border border-cardio-border rounded-lg p-4">
                    <div>
                      <label className="block text-sm font-semibold text-cardio-primary mb-2">
                        AF Type
                      </label>
                      <select
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
          )}
        </section>

        {/* Cardiac Devices */}
        <section className="bg-white rounded-lg shadow-cardio mb-4">
          <button
            onClick={() => toggleSection('devices')}
            className="w-full px-6 py-4 flex items-center justify-between text-left"
          >
            <h2 className="text-xl font-bold text-cardio-primary">Cardiac Implantable Electronic Devices</h2>
            {expandedSections.has('devices') ? (
              <ChevronUp className="w-5 h-5 text-gray-400" />
            ) : (
              <ChevronDown className="w-5 h-5 text-gray-400" />
            )}
          </button>

          {expandedSections.has('devices') && (
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
                        checked={pacemaker}
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
                    <label className="block text-sm font-semibold text-cardio-primary mb-2">
                      Device interrogation status
                    </label>
                    <select
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
          )}
        </section>

        {/* Recent Cardiac Interventions */}
        <section className="bg-white rounded-lg shadow-cardio mb-4">
          <button
            onClick={() => toggleSection('interventions')}
            className="w-full px-6 py-4 flex items-center justify-between text-left"
          >
            <h2 className="text-xl font-bold text-cardio-primary">Recent Cardiac Interventions</h2>
            {expandedSections.has('interventions') ? (
              <ChevronUp className="w-5 h-5 text-gray-400" />
            ) : (
              <ChevronDown className="w-5 h-5 text-gray-400" />
            )}
          </button>

          {expandedSections.has('interventions') && (
            <div className="px-6 pb-6 space-y-6">
              {/* Recent MI */}
              <div className="space-y-3">
                <h3 className="text-lg font-semibold text-cardio-primary border-b border-cardio-border pb-2">
                  Recent MI
                </h3>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Has patient had a recent MI?
                  </label>
                  <select
                    value={recentMI}
                    onChange={(e) => setRecentMI(e.target.value as 'yes' | 'no')}
                    className="w-full px-3 py-2 border-2 border-cardio-border rounded focus:border-cardio-secondary focus:outline-none"
                  >
                    <option value="no">No</option>
                    <option value="yes">Yes</option>
                  </select>
                </div>
                {recentMI === 'yes' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      MI Timing
                    </label>
                    <select
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
                <h3 className="text-lg font-semibold text-cardio-primary border-b border-cardio-border pb-2">
                  Coronary Stent
                </h3>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Stent type
                  </label>
                  <select
                    value={stentType}
                    onChange={(e) => setStentType(e.target.value as StentTypeOption)}
                    className="w-full px-3 py-2 border-2 border-cardio-border rounded focus:border-cardio-secondary focus:outline-none"
                  >
                    <option value="">No stent</option>
                    <option value="bms">Bare-metal stent (BMS)</option>
                    <option value="des">Drug-eluting stent (DES)</option>
                  </select>
                </div>
                {stentType && stentType !== 'none' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Stent Timing
                    </label>
                    <select
                      value={stentTiming}
                      onChange={(e) => setStentTiming(e.target.value as StentTimingOption)}
                      className="w-full px-3 py-2 border-2 border-cardio-border rounded focus:border-cardio-secondary focus:outline-none"
                    >
                      <option value="">Select...</option>
                      <option value="lt2w">&lt;2 weeks</option>
                      <option value="2to4w">2-4 weeks</option>
                      <option value="4to12w">4-12 weeks</option>
                      <option value="gt12w">&gt;12 weeks</option>
                    </select>
                  </div>
                )}
              </div>

              {/* CABG */}
              <div className="space-y-3">
                <h3 className="text-lg font-semibold text-cardio-primary border-b border-cardio-border pb-2">
                  CABG
                </h3>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Has patient had CABG?
                  </label>
                  <select
                    value={cabg}
                    onChange={(e) => setCabg(e.target.value as 'yes' | 'no')}
                    className="w-full px-3 py-2 border-2 border-cardio-border rounded focus:border-cardio-secondary focus:outline-none"
                  >
                    <option value="no">No</option>
                    <option value="yes">Yes</option>
                  </select>
                </div>
                {cabg === 'yes' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      CABG Timing
                    </label>
                    <select
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
                <h3 className="text-lg font-semibold text-cardio-primary border-b border-cardio-border pb-2">
                  TAVR/TAVI
                </h3>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    TAVR/TAVI in Past Year?
                  </label>
                  <select
                    value={tavrTavi}
                    onChange={(e) => setTavrTavi(e.target.value as 'yes' | 'no')}
                    className="w-full px-3 py-2 border-2 border-cardio-border rounded focus:border-cardio-secondary focus:outline-none"
                  >
                    <option value="no">No</option>
                    <option value="yes">Yes</option>
                  </select>
                </div>
                {tavrTavi === 'yes' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      TAVR/TAVI Timing
                    </label>
                    <select
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
                <h3 className="text-lg font-semibold text-cardio-primary border-b border-cardio-border pb-2">
                  TEER / MitraClip
                </h3>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    TEER / MitraClip in Past Year?
                  </label>
                  <select
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
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      TEER Timing
                    </label>
                    <select
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
          )}
        </section>

        {/* Lab Values */}
        <section className="bg-white rounded-lg shadow-cardio mb-4">
          <button
            onClick={() => toggleSection('labs')}
            className="w-full px-6 py-4 flex items-center justify-between text-left"
          >
            <h2 className="text-xl font-bold text-cardio-primary">Laboratory Values (Optional)</h2>
            {expandedSections.has('labs') ? (
              <ChevronUp className="w-5 h-5 text-gray-400" />
            ) : (
              <ChevronDown className="w-5 h-5 text-gray-400" />
            )}
          </button>

          {expandedSections.has('labs') && (
            <div className="px-6 pb-6 grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-cardio-primary mb-2">
                  Creatinine (mg/dL)
                </label>
                <input
                  type="number"
                  value={creatinine}
                  onChange={(e) => setCreatinine(e.target.value)}
                  step="0.1"
                  className="w-full px-3 py-2 border-2 border-cardio-border rounded focus:border-cardio-secondary focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-cardio-primary mb-2">
                  BNP (pg/mL)
                </label>
                <input
                  type="number"
                  value={bnp}
                  onChange={(e) => setBnp(e.target.value)}
                  className="w-full px-3 py-2 border-2 border-cardio-border rounded focus:border-cardio-secondary focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-cardio-primary mb-2">
                  NT-proBNP (pg/mL)
                </label>
                <input
                  type="number"
                  value={ntproBNP}
                  onChange={(e) => setNtproBNP(e.target.value)}
                  className="w-full px-3 py-2 border-2 border-cardio-border rounded focus:border-cardio-secondary focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-cardio-primary mb-2">
                  Troponin (ng/mL)
                </label>
                <input
                  type="number"
                  value={troponin}
                  onChange={(e) => setTroponin(e.target.value)}
                  step="0.001"
                  className="w-full px-3 py-2 border-2 border-cardio-border rounded focus:border-cardio-secondary focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-cardio-primary mb-2">
                  Troponin Assay
                </label>
                <select
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
                <label className="block text-sm font-semibold text-cardio-primary mb-2">
                  Troponin Upper Reference Limit (ng/mL)
                </label>
                <input
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
          )}
        </section>

        {/* Current Medications */}
        <section className="bg-white rounded-lg shadow-cardio mb-4">
          <button
            onClick={() => toggleSection('medications')}
            className="w-full px-6 py-4 flex items-center justify-between text-left"
          >
            <h2 className="text-xl font-bold text-cardio-primary">Current Medications</h2>
            {expandedSections.has('medications') ? (
              <ChevronUp className="w-5 h-5 text-gray-400" />
            ) : (
              <ChevronDown className="w-5 h-5 text-gray-400" />
            )}
          </button>

          {expandedSections.has('medications') && (
            <div className="px-6 pb-6 grid grid-cols-2 gap-3">
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
            </div>
          )}
        </section>

        {/* Functional Capacity */}
        <section className="bg-white rounded-lg shadow-cardio mb-4">
          <button
            onClick={() => toggleSection('functional')}
            className="w-full px-6 py-4 flex items-center justify-between text-left"
          >
            <h2 className="text-xl font-bold text-cardio-primary">Functional Capacity Assessment</h2>
            {expandedSections.has('functional') ? (
              <ChevronUp className="w-5 h-5 text-gray-400" />
            ) : (
              <ChevronDown className="w-5 h-5 text-gray-400" />
            )}
          </button>

          {expandedSections.has('functional') && (
            <div className="px-6 pb-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-cardio-primary mb-2">
                  Assessment Method
                </label>
                <div className="flex gap-4">
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="radio"
                      checked={!useDASI}
                      onChange={() => setUseDASI(false)}
                      className="mr-2"
                    />
                    <span>Clinical Assessment</span>
                  </label>
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="radio"
                      checked={useDASI}
                      onChange={() => setUseDASI(true)}
                      className="mr-2"
                    />
                    <span>DASI Questionnaire</span>
                  </label>
                </div>
              </div>

              {!useDASI ? (
                <div>
                  <label className="block text-sm font-semibold text-cardio-primary mb-2">
                    Functional Capacity (METs)
                  </label>
                  <select
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
              ) : (
                <div className="space-y-3">
                  <p className="text-sm text-gray-600">Check all activities the patient can perform:</p>

                  <label className="flex items-start cursor-pointer">
                    <input type="checkbox" checked={dasi1} onChange={(e) => setDasi1(e.target.checked)} className="mt-1 mr-3" />
                    <span>Personal care (eating, dressing, bathing)</span>
                  </label>
                  <label className="flex items-start cursor-pointer">
                    <input type="checkbox" checked={dasi2} onChange={(e) => setDasi2(e.target.checked)} className="mt-1 mr-3" />
                    <span>Walking indoors</span>
                  </label>
                  <label className="flex items-start cursor-pointer">
                    <input type="checkbox" checked={dasi3} onChange={(e) => setDasi3(e.target.checked)} className="mt-1 mr-3" />
                    <span>Walking 1-2 blocks on level ground</span>
                  </label>
                  <label className="flex items-start cursor-pointer">
                    <input type="checkbox" checked={dasi4} onChange={(e) => setDasi4(e.target.checked)} className="mt-1 mr-3" />
                    <span>Climbing one flight of stairs or walking uphill</span>
                  </label>
                  <label className="flex items-start cursor-pointer">
                    <input type="checkbox" checked={dasi5} onChange={(e) => setDasi5(e.target.checked)} className="mt-1 mr-3" />
                    <span>Running a short distance</span>
                  </label>
                  <label className="flex items-start cursor-pointer">
                    <input type="checkbox" checked={dasi6} onChange={(e) => setDasi6(e.target.checked)} className="mt-1 mr-3" />
                    <span>Light housework (dusting, washing dishes)</span>
                  </label>
                  <label className="flex items-start cursor-pointer">
                    <input type="checkbox" checked={dasi7} onChange={(e) => setDasi7(e.target.checked)} className="mt-1 mr-3" />
                    <span>Moderate housework (vacuuming, sweeping)</span>
                  </label>
                  <label className="flex items-start cursor-pointer">
                    <input type="checkbox" checked={dasi8} onChange={(e) => setDasi8(e.target.checked)} className="mt-1 mr-3" />
                    <span>Heavy housework (scrubbing floors, lifting furniture)</span>
                  </label>
                  <label className="flex items-start cursor-pointer">
                    <input type="checkbox" checked={dasi9} onChange={(e) => setDasi9(e.target.checked)} className="mt-1 mr-3" />
                    <span>Yard work (raking leaves, mowing lawn)</span>
                  </label>
                  <label className="flex items-start cursor-pointer">
                    <input type="checkbox" checked={dasi10} onChange={(e) => setDasi10(e.target.checked)} className="mt-1 mr-3" />
                    <span>Sexual relations</span>
                  </label>
                  <label className="flex items-start cursor-pointer">
                    <input type="checkbox" checked={dasi11} onChange={(e) => setDasi11(e.target.checked)} className="mt-1 mr-3" />
                    <span>Participating in moderate recreational activities (golf, dancing, tennis)</span>
                  </label>
                  <label className="flex items-start cursor-pointer">
                    <input type="checkbox" checked={dasi12} onChange={(e) => setDasi12(e.target.checked)} className="mt-1 mr-3" />
                    <span>Participating in strenuous sports (swimming, jogging, football)</span>
                  </label>
                </div>
              )}
            </div>
          )}
        </section>

        {/* Surgical Details */}
        <section className="bg-white rounded-lg shadow-cardio mb-4">
          <button
            onClick={() => toggleSection('surgical')}
            className="w-full px-6 py-4 flex items-center justify-between text-left"
          >
            <h2 className="text-xl font-bold text-cardio-primary">Surgical Details</h2>
            {expandedSections.has('surgical') ? (
              <ChevronUp className="w-5 h-5 text-gray-400" />
            ) : (
              <ChevronDown className="w-5 h-5 text-gray-400" />
            )}
          </button>

          {expandedSections.has('surgical') && (
            <div className="px-6 pb-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-cardio-primary mb-2">
                  Surgery Type *
                </label>
                <select
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
                  <label className="block text-sm font-semibold text-cardio-primary mb-2">
                    Specify Other Surgery
                  </label>
                  <input
                    type="text"
                    value={otherSurgery}
                    onChange={(e) => setOtherSurgery(e.target.value)}
                    className="w-full px-3 py-2 border-2 border-cardio-border rounded focus:border-cardio-secondary focus:outline-none"
                    placeholder="Describe the surgical procedure"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-semibold text-cardio-primary mb-2">
                  Surgery Urgency *
                </label>
                <select
                  value={surgeryUrgency}
                  onChange={(e) => setSurgeryUrgency(e.target.value as SurgeryUrgencyOption)}
                  className="w-full px-3 py-2 border-2 border-cardio-border rounded focus:border-cardio-secondary focus:outline-none"
                  required
                >
                  <option value="elective">Elective (&gt;3 months)</option>
                  <option value="time-sensitive">Time-sensitive (≤3 months)</option>
                  <option value="urgent">Urgent (2-24 hours)</option>
                  <option value="emergency">Emergency (&lt;2 hours)</option>
                </select>
              </div>
            </div>
          )}
        </section>

        {/* Frailty Assessment */}
        <section className="bg-white rounded-lg shadow-cardio mb-4">
          <button
            onClick={() => toggleSection('frailty')}
            className="w-full px-6 py-4 flex items-center justify-between text-left"
          >
            <h2 className="text-xl font-bold text-cardio-primary">Frailty Assessment</h2>
            {expandedSections.has('frailty') ? (
              <ChevronUp className="w-5 h-5 text-gray-400" />
            ) : (
              <ChevronDown className="w-5 h-5 text-gray-400" />
            )}
          </button>

          {expandedSections.has('frailty') && (
            <div className="px-6 pb-6 space-y-3">
              <div>
                <label className="block text-sm font-semibold text-cardio-primary mb-2">
                  Clinical Frailty Scale
                </label>
                <select
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
          )}
        </section>

        {/* Generate Report Button */}
        <div className="bg-white rounded-lg shadow-cardio p-6 mb-6">
          <button
            onClick={handleGenerateReport}
            className="w-full bg-cardio-secondary hover:bg-cardio-primary text-white font-semibold py-3 px-6 rounded-lg transition-colors flex items-center justify-center"
          >
            <FileText className="w-5 h-5 mr-2" />
            Generate Assessment Report
          </button>
        </div>

        {/* Report Display */}
        {report && (
          <div className="bg-white rounded-lg shadow-cardio-lg p-6 print-content">
            <div className="flex items-center justify-between mb-4 no-print">
              <h2 className="text-2xl font-bold text-cardio-primary">Assessment Report</h2>
              <div className="flex gap-2">
                <button
                  onClick={handleCopyReport}
                  className="flex items-center px-4 py-2 bg-cardio-secondary text-white rounded hover:bg-cardio-primary transition-colors"
                >
                  <Copy className="w-4 h-4 mr-2" />
                  Copy
                </button>
                <button
                  onClick={handlePrintReport}
                  className="flex items-center px-4 py-2 bg-cardio-secondary text-white rounded hover:bg-cardio-primary transition-colors"
                >
                  <Printer className="w-4 h-4 mr-2" />
                  Print
                </button>
              </div>
            </div>
            <pre className="whitespace-pre-wrap font-mono text-sm bg-gray-50 p-4 rounded border border-cardio-border overflow-x-auto">
              {report}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}
