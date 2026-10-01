import type { PreCardiaData } from '../types/precardia.types';

export type PerioperativeContext = Pick<PreCardiaData,
  'cardiovascularSymptoms' | 'newOrWorseningDyspnea' | 'strokeTiming' |
  'pciIndication' | 'antiplateletInterruption' | 'balloonAngioplasty' | 'balloonTiming' |
  'raasIndication' | 'bloodPressureControlled' | 'newBetaBlockerIndication' |
  'estimatedMaceRisk' | 'riskCalculator' | 'otherSurgeryRisk' | 'otherRcriHighRisk'>;

interface Props {
  value: PerioperativeContext;
  onChange: (value: PerioperativeContext) => void;
  hasStroke: boolean;
  hasStent: boolean;
  takesRaas: boolean;
  takesBetaBlocker: boolean;
  otherSurgery: boolean;
}

const inputClass = 'w-full px-3 py-2 border-2 border-cardio-border rounded focus:border-cardio-secondary focus:outline-none';

// These fields distinguish guideline populations without inferring diagnoses from RCRI.
export function PerioperativeContextFields({ value, onChange, hasStroke, hasStent, takesRaas, takesBetaBlocker, otherSurgery }: Props) {
  const update = <K extends keyof PerioperativeContext>(key: K, next: PerioperativeContext[K]) => onChange({ ...value, [key]: next });
  return (
    <section className="bg-white rounded-lg shadow-cardio p-6 mb-4 space-y-4">
      <h2 className="text-xl font-bold text-cardio-primary">Perioperative Decision Details</h2>
      <p className="text-sm text-gray-600">Use known clinical information. Leave uncertain items unknown; they will be identified for review in the report.</p>
      <label className="flex items-start gap-3">
        <input type="checkbox" checked={Boolean(value.cardiovascularSymptoms)} onChange={e => update('cardiovascularSymptoms', e.target.checked)} />
        <span>Cardiovascular symptoms (chest pain, dyspnea, unexplained palpitations, syncope or murmur)</span>
      </label>
      <label className="flex items-start gap-3">
        <input type="checkbox" checked={Boolean(value.newOrWorseningDyspnea)} onChange={e => update('newOrWorseningDyspnea', e.target.checked)} />
        <span>New dyspnea, HF findings, or suspected new/worsening ventricular dysfunction</span>
      </label>
      {hasStroke && <label className="block space-y-2">
        <span>Most recent stroke or TIA</span>
        <select className={inputClass} value={value.strokeTiming || 'unknown'} onChange={e => update('strokeTiming', e.target.value as PreCardiaData['strokeTiming'])}>
          <option value="unknown">Unknown</option><option value="lt3mo">Less than 3 months ago</option><option value="ge3mo">At least 3 months ago</option>
        </select>
      </label>}
      {hasStent ? <fieldset className="space-y-3 border border-cardio-border rounded p-4">
        <legend className="px-2 font-semibold">Coronary stent plan</legend>
        <label className="block space-y-2"><span>Indication for PCI</span>
          <select className={inputClass} value={value.pciIndication || 'unknown'} onChange={e => update('pciIndication', e.target.value as PreCardiaData['pciIndication'])}>
            <option value="unknown">Unknown</option><option value="acs">Acute coronary syndrome (ACS)</option><option value="ccd">Chronic coronary disease</option>
          </select>
        </label>
        <label className="block space-y-2"><span>Will surgery require interruption of any antiplatelet agent?</span>
          <select className={inputClass} value={value.antiplateletInterruption || 'unknown'} onChange={e => update('antiplateletInterruption', e.target.value as PreCardiaData['antiplateletInterruption'])}>
            <option value="unknown">Unknown / plan pending</option><option value="yes">Yes</option><option value="no">No</option>
          </select>
        </label>
      </fieldset> : <div className="space-y-3">
        <label className="flex items-center gap-3"><input type="checkbox" checked={Boolean(value.balloonAngioplasty)} onChange={e => update('balloonAngioplasty', e.target.checked)} /><span>Recent balloon angioplasty without a stent</span></label>
        {value.balloonAngioplasty && <label className="block space-y-2"><span>Balloon angioplasty timing</span>
          <select className={inputClass} value={value.balloonTiming || 'unknown'} onChange={e => update('balloonTiming', e.target.value as PreCardiaData['balloonTiming'])}>
            <option value="unknown">Unknown</option><option value="lt14d">Less than 14 days</option><option value="ge14d">At least 14 days</option>
          </select>
        </label>}
      </div>}
      {takesRaas && <fieldset className="space-y-3 border border-cardio-border rounded p-4">
        <legend className="px-2 font-semibold">ACE inhibitor / ARB indication</legend>
        <label className="block space-y-2"><span>Primary treatment indication</span>
          <select className={inputClass} value={value.raasIndication || 'unknown'} onChange={e => update('raasIndication', e.target.value as PreCardiaData['raasIndication'])}>
            <option value="unknown">Unknown</option><option value="hypertension">Hypertension</option><option value="hfref">Heart failure with reduced EF (HFrEF)</option><option value="other">Other (including HFpEF or kidney disease)</option>
          </select>
        </label>
        {value.raasIndication === 'hypertension' && <label className="flex items-center gap-3"><input type="checkbox" checked={Boolean(value.bloodPressureControlled)} onChange={e => update('bloodPressureControlled', e.target.checked)} /><span>Blood pressure is confirmed controlled</span></label>}
      </fieldset>}
      {!takesBetaBlocker && <label className="flex items-center gap-3"><input type="checkbox" checked={Boolean(value.newBetaBlockerIndication)} onChange={e => update('newBetaBlockerIndication', e.target.checked)} /><span>Confirmed new clinical indication for a beta-blocker, independent of surgery</span></label>}
      {otherSurgery && <label className="block space-y-2"><span>Risk category of the unlisted procedure</span>
        <select className={inputClass} value={value.otherSurgeryRisk || 'unknown'} onChange={e => update('otherSurgeryRisk', e.target.value as PreCardiaData['otherSurgeryRisk'])}>
          <option value="unknown">Unknown / requires assessment</option><option value="low">Low (&lt;1%)</option><option value="elevated">Elevated (≥1%)</option>
        </select>
      </label>}
      {otherSurgery && <label className="block space-y-2"><span>Does the unlisted procedure meet the RCRI high-risk surgical criterion?</span>
        <select className={inputClass} value={value.otherRcriHighRisk || 'unknown'} onChange={e => update('otherRcriHighRisk', e.target.value as PreCardiaData['otherRcriHighRisk'])}>
          <option value="unknown">Unknown / requires confirmation</option><option value="yes">Yes — intraperitoneal, intrathoracic or suprainguinal vascular</option><option value="no">No</option>
        </select>
      </label>}
      <fieldset className="grid gap-3 sm:grid-cols-2 border border-cardio-border rounded p-4">
        <legend className="px-2 font-semibold">Additional validated risk estimate (optional)</legend>
        <label className="block space-y-2"><span>Risk calculator used</span>
          <select className={inputClass} value={value.riskCalculator || ''} onChange={e => update('riskCalculator', e.target.value as PreCardiaData['riskCalculator'] || undefined)}>
            <option value="">Not supplied</option><option value="acs-nsqip">ACS NSQIP cardiac risk</option><option value="gupta-mica">Gupta MICA</option>
          </select>
        </label>
        <label className="block space-y-2"><span>Calculated cardiac event risk (%)</span><input className={inputClass} type="number" min="0" max="100" step="any" value={value.estimatedMaceRisk ?? ''} onChange={e => update('estimatedMaceRisk', e.target.value === '' ? undefined : Number(e.target.value))} /></label>
        <p className="text-sm text-gray-600 sm:col-span-2">Enter the cardiac event estimate, not all-cause mortality or overall complications. Confirm the calculator’s endpoint and inputs.</p>
      </fieldset>
    </section>
  );
}
