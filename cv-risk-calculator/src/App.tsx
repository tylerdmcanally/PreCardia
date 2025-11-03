import { useState } from 'react';
import { PatientData, BPReading, Medication, Allergy, MedicationCategory, DomainName, ClinicalReport } from './types';
import { performClinicalCalculations } from './logic/calculations';
import { generateClinicalReport } from './logic/report/generateReport';
import { formatReportAsText } from './logic/report/formatReport';
import { MedicationAutocomplete } from './components/MedicationAutocomplete';
import { 
  Activity, 
  Heart, 
  Droplet, 
  Pill, 
  TestTube, 
  FileText, 
  ClipboardCheck, 
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Plus,
  X,
  Copy,
  Printer,
  Sparkles
} from 'lucide-react';

function App() {
  const [report, setReport] = useState<string | null>(null);
  const [fullReport, setFullReport] = useState<ClinicalReport | null>(null);
  const [selectedDomains, setSelectedDomains] = useState<Set<DomainName>>(new Set([
    'BLOOD_PRESSURE',
    'LIPID_MANAGEMENT',
    'DIABETES_CARDIORENAL',
    'HEART_FAILURE',
    'ANTIPLATELET_ANTICOAGULATION',
    'RISK_FACTOR_MODIFICATION',
  ]));
  
  // Collapsible sections state
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set([
    'demographics',
    'history',
    'labs',
    'bp',
    'meds',
    'allergies'
  ]));
  
  const toggleSection = (section: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(section)) {
      newExpanded.delete(section);
    } else {
      newExpanded.add(section);
    }
    setExpandedSections(newExpanded);
  };

  // Patient Demographics
  const [age, setAge] = useState<string>('');
  const [sex, setSex] = useState<'male' | 'female'>('male');
  const [race, setRace] = useState<'white' | 'black' | 'hispanic' | 'asian' | 'other'>('white');
  const [heightFeet, setHeightFeet] = useState<string>('');
  const [heightInches, setHeightInches] = useState<string>('');
  const [weightLbs, setWeightLbs] = useState<string>('');
  const [smokingStatus, setSmokingStatus] = useState<'current' | 'former' | 'never'>('never');

  // Medical History
  const [hypertension, setHypertension] = useState(false);
  const [hyperlipidemia, setHyperlipidemia] = useState(false);
  const [diabetes, setDiabetes] = useState(false);
  const [ckd, setCkd] = useState(false);
  const [cad, setCad] = useState(false);
  const [priorMI, setPriorMI] = useState(false);
  const [priorPCI, setPriorPCI] = useState(false);
  const [pciTiming, setPciTiming] = useState<'<3 months' | '3-6 months' | '6-12 months' | '>12 months'>('<3 months');
  const [stroke, setStroke] = useState(false);
  const [tia, setTia] = useState(false);
  const [pad, setPad] = useState(false);
  const [heartFailure, setHeartFailure] = useState(false);
  const [ejectionFraction, setEjectionFraction] = useState<string>('');
  const [atrialFibrillation, setAtrialFibrillation] = useState(false);

  // Labs
  const [creatinine, setCreatinine] = useState<string>('');
  const [potassium, setPotassium] = useState<string>('');
  const [totalCholesterol, setTotalCholesterol] = useState<string>('');
  const [ldl, setLdl] = useState<string>('');
  const [hdl, setHdl] = useState<string>('');
  const [triglycerides, setTriglycerides] = useState<string>('');
  const [a1c, setA1c] = useState<string>('');
  const [uacr, setUacr] = useState<string>('');

  // BP Readings - using strings for UI input
  const [bpReadings, setBpReadings] = useState<Array<{ systolic: string; diastolic: string }>>([
    { systolic: '', diastolic: '' },
  ]);

  // Medications
  const [medications, setMedications] = useState<Medication[]>([]);
  const [allergies, setAllergies] = useState<Allergy[]>([]);
  const [nkda, setNkda] = useState(false); // No Known Drug Allergies

  const onGenerateReport = () => {
    const patientData: PatientData = {
      demographics: {
        age: parseFloat(age) || 0,
        sex,
        race,
        heightFeet: parseFloat(heightFeet) || 0,
        heightInches: parseFloat(heightInches) || 0,
        weightLbs: parseFloat(weightLbs) || 0,
        smokingStatus,
      },
      history: {
        hypertension,
        diabetes,
        ckd,
        cad,
        priorMI,
        priorPCI,
        pciTiming: priorPCI ? pciTiming : undefined,
        stroke,
        tia,
        pad,
        hyperlipidemia,
        heartFailure,
        ejectionFraction: parseFloat(ejectionFraction) || undefined,
        atrialFibrillation,
      },
      medications,
      allergies,
      labs: {
        creatinine: parseFloat(creatinine) || undefined,
        potassium: parseFloat(potassium) || undefined,
        totalCholesterol: parseFloat(totalCholesterol) || undefined,
        ldl: parseFloat(ldl) || undefined,
        hdl: parseFloat(hdl) || undefined,
        triglycerides: parseFloat(triglycerides) || undefined,
        a1c: parseFloat(a1c) || undefined,
        uacr: parseFloat(uacr) || undefined,
      },
      bpReadings: bpReadings.map(reading => ({
        systolic: parseFloat(reading.systolic) || 0,
        diastolic: parseFloat(reading.diastolic) || 0,
      })),
    };

    const calculations = performClinicalCalculations(patientData);
    const clinicalReport = generateClinicalReport(patientData, calculations);
    setFullReport(clinicalReport);

    // Apply domain filter
    const filteredReport = filterReportByDomains(clinicalReport, selectedDomains);
    const formattedReport = formatReportAsText(filteredReport);
    setReport(formattedReport);
  };

  const filterReportByDomains = (clinicalReport: ClinicalReport, domains: Set<DomainName>): ClinicalReport => {
    return {
      ...clinicalReport,
      domains: clinicalReport.domains.filter(domain => domains.has(domain.name)),
    };
  };

  const toggleDomain = (domainName: DomainName) => {
    const newSelection = new Set(selectedDomains);
    if (newSelection.has(domainName)) {
      newSelection.delete(domainName);
    } else {
      newSelection.add(domainName);
    }
    setSelectedDomains(newSelection);

    // Regenerate report with new filter if report already exists
    if (fullReport) {
      const filteredReport = filterReportByDomains(fullReport, newSelection);
      const formattedReport = formatReportAsText(filteredReport);
      setReport(formattedReport);
    }
  };

  const toggleAllDomains = () => {
    if (selectedDomains.size === 6) {
      // All selected, deselect all
      setSelectedDomains(new Set());
      if (fullReport) {
        const filteredReport = filterReportByDomains(fullReport, new Set());
        const formattedReport = formatReportAsText(filteredReport);
        setReport(formattedReport);
      }
    } else {
      // Some or none selected, select all
      const allDomains = new Set<DomainName>([
        'BLOOD_PRESSURE',
        'LIPID_MANAGEMENT',
        'DIABETES_CARDIORENAL',
        'HEART_FAILURE',
        'ANTIPLATELET_ANTICOAGULATION',
        'RISK_FACTOR_MODIFICATION',
      ]);
      setSelectedDomains(allDomains);
      if (fullReport) {
        const filteredReport = filterReportByDomains(fullReport, allDomains);
        const formattedReport = formatReportAsText(filteredReport);
        setReport(formattedReport);
      }
    }
  };

  const copyToClipboard = () => {
    if (report) {
      navigator.clipboard.writeText(report);
      alert('Report copied to clipboard!');
    }
  };

  const addBPReading = () => {
    setBpReadings([...bpReadings, { systolic: '', diastolic: '' }]);
  };

  const removeBPReading = (index: number) => {
    setBpReadings(bpReadings.filter((_, i) => i !== index));
  };

  const updateBPReading = (index: number, field: 'systolic' | 'diastolic', value: string) => {
    const newReadings = [...bpReadings];
    newReadings[index][field] = value;
    setBpReadings(newReadings);
  };

  const addMedication = () => {
    const newMed: Medication = {
      id: Date.now().toString(),
      genericName: '',
      dose: '',
      frequency: '',
      category: 'Other',
    };
    setMedications([...medications, newMed]);
  };

  const removeMedication = (id: string) => {
    setMedications(medications.filter((m) => m.id !== id));
  };

  const updateMedication = (id: string, field: keyof Medication, value: string) => {
    setMedications(
      medications.map((m) => (m.id === id ? { ...m, [field]: value } : m))
    );
  };

  const addAllergy = () => {
    const newAllergy: Allergy = {
      id: Date.now().toString(),
      medication: '',
      reaction: '',
    };
    setAllergies([...allergies, newAllergy]);
  };

  const removeAllergy = (id: string) => {
    setAllergies(allergies.filter((a) => a.id !== id));
  };

  const updateAllergy = (id: string, field: keyof Allergy, value: string) => {
    setAllergies(
      allergies.map((a) => (a.id === id ? { ...a, [field]: value } : a))
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-100">
      <header className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 shadow-2xl border-b-4 border-blue-500/30">
        <div className="max-w-7xl mx-auto px-8 py-6">
          <div className="flex items-center gap-4 mb-2">
            <div className="p-2 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg">
              <Sparkles className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white tracking-tight">
                CV Risk Optimization
              </h1>
              <p className="text-sm text-slate-300 mt-1 font-medium">Evidence-based medication recommendations for cardiovascular risk reduction</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-8 py-8">
        <div className="grid grid-cols-5 gap-8">
          {/* Left Panel - Input Forms */}
          <div className="col-span-2 space-y-3">
            <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-6 max-h-[calc(100vh-10rem)] overflow-auto">
              {/* Demographics */}
              <div className="mb-6">
                <button
                  onClick={() => toggleSection('demographics')}
                  className="flex items-center justify-between w-full mb-4 px-3 py-2 rounded-lg hover:bg-slate-50 transition-colors group"
                >
                  <h2 className="text-lg font-bold text-slate-900">Patient Demographics</h2>
                  {expandedSections.has('demographics') ? (
                    <ChevronUp className="w-5 h-5 text-slate-400" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-slate-400" />
                  )}
                </button>
                
                {expandedSections.has('demographics') && (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Age</label>
                      <input
                        type="number"
                        value={age}
                        onChange={(e) => setAge(e.target.value)}
                        placeholder="Age"
                        className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Sex</label>
                      <select
                        value={sex}
                        onChange={(e) => setSex(e.target.value as 'male' | 'female')}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Race</label>
                    <select
                      value={race}
                      onChange={(e) => setRace(e.target.value as any)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="white">White</option>
                      <option value="black">Black/African American</option>
                      <option value="hispanic">Hispanic</option>
                      <option value="asian">Asian</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Height (ft)</label>
                      <input
                        type="number"
                        value={heightFeet}
                        onChange={(e) => setHeightFeet(e.target.value)}
                        placeholder="5"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Height (in)</label>
                      <input
                        type="number"
                        value={heightInches}
                        onChange={(e) => setHeightInches(e.target.value)}
                        placeholder="10"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Weight (lbs)</label>
                      <input
                        type="number"
                        value={weightLbs}
                        onChange={(e) => setWeightLbs(e.target.value)}
                        placeholder="200"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Smoking Status</label>
                    <select
                      value={smokingStatus}
                      onChange={(e) => setSmokingStatus(e.target.value as any)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="never">Never</option>
                      <option value="former">Former</option>
                      <option value="current">Current</option>
                    </select>
                  </div>
                </div>
                )}
              </div>

              {/* Medical History */}
              <div className="mb-6 border-t border-slate-200 pt-6">
                <button
                  onClick={() => toggleSection('history')}
                  className="flex items-center justify-between w-full mb-4 px-3 py-2 rounded-lg hover:bg-slate-50 transition-colors group"
                >
                  <h2 className="text-lg font-bold text-slate-900">Medical History</h2>
                  {expandedSections.has('history') ? (
                    <ChevronUp className="w-5 h-5 text-slate-400" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-slate-400" />
                  )}
                </button>
                
                {expandedSections.has('history') && (
                <div className="space-y-2">
                  {/* Render checkboxes before Prior PCI */}
                  {[
                    { label: 'Hypertension', value: hypertension, setter: setHypertension },
                    { label: 'Hyperlipidemia', value: hyperlipidemia, setter: setHyperlipidemia },
                    { label: 'Type 2 Diabetes', value: diabetes, setter: setDiabetes },
                    { label: 'Chronic Kidney Disease', value: ckd, setter: setCkd },
                    { label: 'Coronary Artery Disease', value: cad, setter: setCad },
                    { label: 'Prior MI', value: priorMI, setter: setPriorMI },
                  ].map((item) => (
                    <label key={item.label} className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={item.value}
                        onChange={(e) => item.setter(e.target.checked)}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700">{item.label}</span>
                    </label>
                  ))}

                  {/* Prior PCI with conditional timing field */}
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={priorPCI}
                      onChange={(e) => setPriorPCI(e.target.checked)}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">Prior PCI</span>
                  </label>

                  {priorPCI && (
                    <div className="mt-3 ml-6 p-3 bg-gradient-to-r from-primary-lime/10 to-primary-yellow/10 rounded-lg border border-primary-lime/30">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        PCI Timing (important for antithrombotic management)
                      </label>
                      <select
                        value={pciTiming}
                        onChange={(e) => setPciTiming(e.target.value as any)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="<3 months">&lt;3 months ago</option>
                        <option value="3-6 months">3-6 months ago</option>
                        <option value="6-12 months">6-12 months ago</option>
                        <option value=">12 months">&gt;12 months ago</option>
                      </select>
                    </div>
                  )}

                  {/* Render checkboxes between Prior PCI and Heart Failure */}
                  {[
                    { label: 'Prior Stroke', value: stroke, setter: setStroke },
                    { label: 'Prior TIA', value: tia, setter: setTia },
                    { label: 'Peripheral Artery Disease', value: pad, setter: setPad },
                  ].map((item) => (
                    <label key={item.label} className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={item.value}
                        onChange={(e) => item.setter(e.target.checked)}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700">{item.label}</span>
                    </label>
                  ))}

                  {/* Heart Failure with conditional EF field */}
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={heartFailure}
                      onChange={(e) => setHeartFailure(e.target.checked)}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">Heart Failure</span>
                  </label>

                  {heartFailure && (
                    <div className="mt-3 ml-6 p-3 bg-gradient-to-r from-primary-blue/10 to-primary-mint/10 rounded-lg border border-primary-blue/30">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Ejection Fraction (EF) %
                      </label>
                      <input
                        type="number"
                        value={ejectionFraction}
                        onChange={(e) => setEjectionFraction(e.target.value)}
                        placeholder="e.g., 35"
                        min="10"
                        max="80"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-blue focus:border-primary-blue"
                      />
                    </div>
                  )}

                  {/* Atrial fibrillation */}
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={atrialFibrillation}
                      onChange={(e) => setAtrialFibrillation(e.target.checked)}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">Atrial Fibrillation</span>
                  </label>
                </div>
                )}
              </div>

              {/* Labs */}
              <div className="mb-6 border-t border-slate-200 pt-6">
                <button
                  onClick={() => toggleSection('labs')}
                  className="flex items-center justify-between w-full mb-4 px-3 py-2 rounded-lg hover:bg-slate-50 transition-colors group"
                >
                  <h2 className="text-lg font-bold text-slate-900">Laboratory Values</h2>
                  {expandedSections.has('labs') ? (
                    <ChevronUp className="w-5 h-5 text-slate-400" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-slate-400" />
                  )}
                </button>
                
                {expandedSections.has('labs') && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Creatinine (mg/dL)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={creatinine}
                      onChange={(e) => setCreatinine(e.target.value)}
                      placeholder="1.0"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Potassium (mEq/L)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={potassium}
                      onChange={(e) => setPotassium(e.target.value)}
                      placeholder="4.2"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Total Cholesterol</label>
                    <input
                      type="number"
                      value={totalCholesterol}
                      onChange={(e) => setTotalCholesterol(e.target.value)}
                      placeholder="220"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">LDL (mg/dL)</label>
                    <input
                      type="number"
                      value={ldl}
                      onChange={(e) => setLdl(e.target.value)}
                      placeholder="150"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">HDL (mg/dL)</label>
                    <input
                      type="number"
                      value={hdl}
                      onChange={(e) => setHdl(e.target.value)}
                      placeholder="45"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Triglycerides (mg/dL)</label>
                    <input
                      type="number"
                      value={triglycerides}
                      onChange={(e) => setTriglycerides(e.target.value)}
                      placeholder="180"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">A1c (%)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={a1c}
                      onChange={(e) => setA1c(e.target.value)}
                      placeholder="5.8"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Urine Albumin-to-Creatinine Ratio (mg/g)</label>
                    <input
                      type="number"
                      value={uacr}
                      onChange={(e) => setUacr(e.target.value)}
                      placeholder="45"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
                )}
              </div>

              {/* BP Readings */}
              <div className="mb-6 border-t border-slate-200 pt-6">
                <button
                  onClick={() => toggleSection('bp')}
                  className="flex items-center justify-between w-full mb-4 px-3 py-2 rounded-lg hover:bg-slate-50 transition-colors group"
                >
                  <h2 className="text-lg font-bold text-slate-900">Blood Pressure Readings</h2>
                  {expandedSections.has('bp') ? (
                    <ChevronUp className="w-5 h-5 text-slate-400" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-slate-400" />
                  )}
                </button>
                
                {expandedSections.has('bp') && (
                <div className="space-y-2">
                  {bpReadings.map((reading, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <input
                        type="number"
                        value={reading.systolic}
                        onChange={(e) => updateBPReading(index, 'systolic', e.target.value)}
                        placeholder="Systolic"
                        className="w-24 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      <span className="text-gray-600">/</span>
                      <input
                        type="number"
                        value={reading.diastolic}
                        onChange={(e) => updateBPReading(index, 'diastolic', e.target.value)}
                        placeholder="Diastolic"
                        className="w-24 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      <span className="text-sm text-gray-600">mmHg</span>
                      {bpReadings.length > 1 && (
                        <button
                          onClick={() => removeBPReading(index)}
                          className="text-red-600 hover:text-red-800 text-sm"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    onClick={addBPReading}
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                  >
                    + Add Reading
                  </button>
                </div>
                )}
              </div>

              {/* Current Medications */}
              <div className="mb-6 border-t border-slate-200 pt-6">
                <button
                  onClick={() => toggleSection('meds')}
                  className="flex items-center justify-between w-full mb-4 px-3 py-2 rounded-lg hover:bg-slate-50 transition-colors group"
                >
                  <h2 className="text-lg font-bold text-slate-900">Current Medications</h2>
                  {expandedSections.has('meds') ? (
                    <ChevronUp className="w-5 h-5 text-slate-400" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-slate-400" />
                  )}
                </button>
                
                {expandedSections.has('meds') && (
                <div className="space-y-2">
                  {medications.filter(m => m.genericName).map((med) => (
                    <div key={med.id} className="flex items-center justify-between p-3 bg-gradient-to-r from-primary-mint/10 to-primary-teal/10 rounded-lg border border-primary-mint/30 hover:shadow-md transition-all group">
                      <div className="flex-1">
                        <div className="font-semibold text-gray-900 capitalize">{med.genericName}</div>
                        <div className="text-sm text-gray-600 flex items-center gap-2 mt-0.5">
                          <span>{med.dose}</span>
                          {med.category && med.category !== 'Other' && (
                            <>
                              <span className="text-gray-400">•</span>
                              <span className="text-xs px-2 py-0.5 bg-primary-teal/20 text-primary-teal rounded-full">{med.category}</span>
                            </>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => removeMedication(med.id)}
                        className="text-red-500 hover:text-red-700 opacity-0 group-hover:opacity-100 transition-opacity p-2"
                        title="Remove medication"
                      >
                        ✕
                      </button>
                    </div>
                  ))}

                  {medications.some(m => !m.genericName) ? (
                    <div className="border-2 border-dashed border-primary-mint rounded-lg p-4 bg-white">
                      <MedicationAutocomplete
                        value=""
                        onSelect={(selected) => {
                          const emptyMed = medications.find(m => !m.genericName);
                          if (emptyMed) {
                            setMedications(
                              medications.map((m) =>
                                m.id === emptyMed.id
                                  ? {
                                      ...m,
                                      genericName: selected.name,
                                      dose: selected.dose,
                                      category: selected.category as MedicationCategory,
                                    }
                                  : m
                              )
                            );
                          }
                        }}
                        placeholder="Start typing medication name (e.g., lis...)"
                      />
                      <button
                        onClick={() => {
                          const emptyMed = medications.find(m => !m.genericName);
                          if (emptyMed) {
                            removeMedication(emptyMed.id);
                          }
                        }}
                        className="text-gray-500 hover:text-gray-700 text-sm mt-2"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={addMedication}
                      className="w-full text-primary-teal hover:text-primary-blue text-sm font-bold py-3 border-2 border-dashed border-primary-mint rounded-lg hover:bg-primary-mint/10 hover:border-primary-teal transition-all duration-200"
                    >
                      + Add Medication
                    </button>
                  )}
                </div>
                )}
              </div>

              {/* Allergies */}
              <div className="mb-6 border-t border-slate-200 pt-6">
                <button
                  onClick={() => toggleSection('allergies')}
                  className="flex items-center justify-between w-full mb-4 px-3 py-2 rounded-lg hover:bg-slate-50 transition-colors group"
                >
                  <h2 className="text-lg font-bold text-slate-900">Drug Allergies</h2>
                  {expandedSections.has('allergies') ? (
                    <ChevronUp className="w-5 h-5 text-slate-400" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-slate-400" />
                  )}
                </button>
                
                {expandedSections.has('allergies') && (
                <div className="space-y-3">
                  {/* NKDA Toggle */}
                  <label className="flex items-center p-3 bg-gradient-to-r from-primary-yellow/10 to-primary-lime/10 rounded-lg border-2 border-primary-yellow/30 cursor-pointer hover:bg-primary-yellow/20 transition-all">
                    <input
                      type="checkbox"
                      checked={nkda}
                      onChange={(e) => {
                        setNkda(e.target.checked);
                        if (e.target.checked) {
                          setAllergies([]);
                        }
                      }}
                      className="w-5 h-5 text-primary-lime border-gray-300 rounded focus:ring-primary-lime"
                    />
                    <span className="ml-3 font-semibold text-gray-900">No Known Drug Allergies (NKDA)</span>
                  </label>

                  {!nkda && (
                    <>
                      <div className="space-y-2">
                        {allergies.map((allergy) => (
                          <div key={allergy.id} className="flex gap-2 items-start">
                            <input
                              type="text"
                              value={allergy.medication}
                              onChange={(e) => updateAllergy(allergy.id, 'medication', e.target.value)}
                              placeholder="Medication"
                              className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-lime focus:border-primary-lime"
                            />
                            <input
                              type="text"
                              value={allergy.reaction}
                              onChange={(e) => updateAllergy(allergy.id, 'reaction', e.target.value)}
                              placeholder="Reaction"
                              className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-lime focus:border-primary-lime"
                            />
                            <button
                              onClick={() => removeAllergy(allergy.id)}
                              className="text-red-500 hover:text-red-700 text-sm p-2"
                              title="Remove allergy"
                            >
                              ✕
                            </button>
                          </div>
                        ))}
                      </div>
                      <button
                        onClick={() => {
                          addAllergy();
                          setNkda(false);
                        }}
                        className="w-full text-primary-lime hover:text-primary-yellow text-sm font-bold py-3 border-2 border-dashed border-primary-yellow rounded-lg hover:bg-primary-yellow/10 hover:border-primary-lime transition-all duration-200"
                      >
                        + Add Allergy
                      </button>
                    </>
                  )}
                </div>
                )}
              </div>

              <button
                onClick={onGenerateReport}
                className="w-full bg-gradient-to-br from-blue-600 to-blue-700 text-white px-6 py-4 rounded-xl hover:from-blue-700 hover:to-blue-800 font-bold shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-[1.02] flex items-center justify-center gap-2"
              >
                <ClipboardCheck className="w-5 h-5" />
                Generate Clinical Report
              </button>
            </div>
          </div>

          {/* Right Panel - Report Preview */}
          <div className="col-span-3">
            <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-6 h-[calc(100vh-10rem)]">
              {report ? (
                <div className="h-full flex flex-col">
                  <div className="flex gap-3 mb-4 no-print">
                    <button
                      onClick={copyToClipboard}
                      className="flex items-center gap-2 bg-gradient-to-r from-slate-700 to-slate-800 text-white px-5 py-3 rounded-xl hover:from-slate-800 hover:to-slate-900 font-semibold shadow-lg hover:shadow-xl transition-all duration-200"
                    >
                      <Copy className="w-4 h-4" />
                      Copy to Clipboard
                    </button>
                    <button
                      onClick={() => window.print()}
                      className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white px-5 py-3 rounded-xl hover:from-blue-700 hover:to-blue-800 font-semibold shadow-lg hover:shadow-xl transition-all duration-200"
                    >
                      <Printer className="w-4 h-4" />
                      Print Report
                    </button>
                  </div>

                  {/* Domain Filter - Compact */}
                  <div className="mb-4 p-4 bg-gradient-to-br from-slate-50 to-blue-50/50 rounded-xl border border-slate-200 no-print">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex flex-wrap gap-2 flex-1">
                        {[
                          { name: 'BLOOD_PRESSURE' as DomainName, label: 'BP', icon: Droplet },
                          { name: 'LIPID_MANAGEMENT' as DomainName, label: 'Lipids', icon: Activity },
                          { name: 'DIABETES_CARDIORENAL' as DomainName, label: 'Diabetes', icon: Heart },
                          { name: 'HEART_FAILURE' as DomainName, label: 'HF', icon: Heart },
                          { name: 'ANTIPLATELET_ANTICOAGULATION' as DomainName, label: 'Anticoag', icon: Pill },
                          { name: 'RISK_FACTOR_MODIFICATION' as DomainName, label: 'Lifestyle', icon: FileText },
                        ].map((domain) => {
                          const Icon = domain.icon;
                          return (
                            <label
                              key={domain.name}
                              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg cursor-pointer transition-all text-xs font-semibold border ${
                                selectedDomains.has(domain.name)
                                  ? 'bg-blue-600 text-white border-blue-700 shadow-md'
                                  : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50 hover:border-blue-300'
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={selectedDomains.has(domain.name)}
                                onChange={() => toggleDomain(domain.name)}
                                className="sr-only"
                              />
                              <Icon className="w-3.5 h-3.5" />
                              <span>{domain.label}</span>
                            </label>
                          );
                        })}
                      </div>
                      <button
                        onClick={toggleAllDomains}
                        className="text-xs px-4 py-2 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 hover:border-blue-400 font-semibold text-slate-700 whitespace-nowrap transition-colors"
                      >
                        {selectedDomains.size === 6 ? 'Clear All' : 'Select All'}
                      </button>
                    </div>
                  </div>

                  <div className="flex-1 overflow-auto bg-gradient-to-br from-slate-50 to-blue-50/30 p-8 rounded-xl border border-slate-200 print-content">
                    <pre className="whitespace-pre-wrap font-mono text-sm text-slate-800 leading-relaxed">
                      {report}
                    </pre>
                  </div>
                </div>
              ) : (
                <div className="h-full flex items-center justify-center">
                  <div className="text-center p-8">
                    <div className="w-32 h-32 mx-auto mb-6 bg-gradient-to-br from-blue-500/10 to-indigo-500/10 rounded-full flex items-center justify-center shadow-xl">
                      <FileText className="w-16 h-16 text-blue-600" />
                    </div>
                    <p className="text-2xl font-bold text-slate-900 mb-2">No Report Generated</p>
                    <p className="text-sm text-slate-600 max-w-md mx-auto font-medium">
                      Fill in patient information and click "Generate Clinical Report" to create evidence-based recommendations
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;
