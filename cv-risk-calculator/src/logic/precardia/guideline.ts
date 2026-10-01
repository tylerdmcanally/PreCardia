import type { PreCardiaData, SurgicalRisk } from '../../types/precardia.types';
import { SURGICAL_RISK } from './constants';

export const PERIOPERATIVE_GUIDELINE = {
  label: '2026 AHA/ACC multisociety perioperative guideline',
  citation: 'Thompson A, Fleischmann KE, Smilowitz NR, et al. 2026 AHA/ACC/ACS/ASNC/HRS/SCA/SCCT/SCMR/SVM Guideline for Perioperative Cardiovascular Management for Noncardiac Surgery. JACC. 2026;88:1543–1643.',
  url: 'https://doi.org/10.1016/j.jacc.2026.06.017',
  note: 'Reaffirmation of the 2024 recommendations; no changes to recommendations in the 2026 publication.',
};

export function getSurgicalRisk(data: PreCardiaData): SurgicalRisk {
  if (data.surgeryType !== 'other' && SURGICAL_RISK[data.surgeryType]) {
    return SURGICAL_RISK[data.surgeryType];
  }
  return {
    level: data.otherSurgeryRisk === 'low' ? 'Low' : data.otherSurgeryRisk === 'elevated' ? 'High' : 'Variable',
    risk: data.otherSurgeryRisk === 'low' ? '<1%' : data.otherSurgeryRisk === 'elevated' ? '≥1%' : 'Unknown',
    description: data.otherSurgery || 'Unspecified procedure',
  };
}

// Section 7.5: calendar-month boundaries and antiplatelet interruption matter.
export function getPCIGuidance(data: PreCardiaData): string[] {
  const guidance: string[] = [];
  const elective = data.surgeryUrgency === 'elective';
  const timeSensitive = data.surgeryUrgency === 'time-sensitive';
  const stented = data.stentType === 'bms' || data.stentType === 'des';
  if (data.balloonAngioplasty && !stented) {
    if (elective && data.balloonTiming !== 'ge14d') {
      guidance.push('Balloon angioplasty without a stent: delay elective surgery for at least 14 days. Verify the procedure date when timing is unknown (Section 7.5, Class 1).');
    } else {
      guidance.push('Prior balloon angioplasty without a stent: the elective minimum interval is 14 days; coordinate antiplatelet therapy and surgical urgency with cardiology.');
    }
  }
  if (!stented) return guidance;

  guidance.push('Prior coronary stent: use multidisciplinary shared decision-making to balance bleeding, stent thrombosis, and the consequences of delaying surgery (Section 7.5).');
  const timing = data.pciTiming || 'unknown';
  const interruptionPossible = data.antiplateletInterruption !== 'no';
  if (timing === 'unknown') {
    guidance.push('PCI timing is unknown or recorded only in legacy week ranges. Verify exact date, indication, and antiplatelet plan before applying 30-day or 3/6/12-month thresholds; timing alone does not establish readiness for surgery.');
  }
  if (data.antiplateletInterruption === undefined || data.antiplateletInterruption === 'unknown') {
    guidance.push('Whether one or more antiplatelet agents must be interrupted is unknown; confirm with the surgical and cardiology teams.');
  }
  if (elective && timing === 'le30d' && interruptionPossible) {
    guidance.push('BMS or DES PCI ≤30 days: elective surgery requiring interruption of any antiplatelet agent is potentially harmful because of stent thrombosis and ischemic risk (Class 3: Harm).');
  }
  if (data.stentType === 'des' && elective && interruptionPossible) {
    if (data.pciIndication === 'acs') {
      guidance.push(timing === 'ge12mo'
        ? 'DES for ACS: the ≥12-month interval for elective surgery requiring antiplatelet interruption has been reached; still individualize the perioperative plan.'
        : 'DES placed for ACS: ideally delay elective surgery requiring interruption of any antiplatelet agent until ≥12 months after PCI (Class 1).');
    } else if (data.pciIndication === 'ccd') {
      guidance.push(timing === '6to12mo' || timing === 'ge12mo'
        ? 'DES for chronic coronary disease: the ≥6-month elective interval has been reached; still individualize the antiplatelet and surgical plan.'
        : 'DES placed for chronic coronary disease: delaying elective surgery requiring antiplatelet interruption until ≥6 months after PCI is reasonable (Class 2a).');
    } else {
      guidance.push('DES indication is unknown: confirm ACS versus chronic coronary disease. With antiplatelet interruption, the elective targets are ≥12 months after ACS and ≥6 months after chronic coronary disease; do not assume that 3 months is sufficient.');
    }
  }
  if (data.stentType === 'des' && timeSensitive && interruptionPossible) {
    guidance.push(['3to6mo', '6to12mo', 'ge12mo'].includes(timing)
      ? 'Time-sensitive surgery after DES may be considered ≥3 months after PCI when the harm of delay outweighs cardiac risk and antiplatelet interruption is needed (Class 2b).'
      : 'Time-sensitive surgery requiring antiplatelet interruption after DES: the ≥3-month threshold has not been established. Discuss delay versus the consequences of waiting with cardiology and the surgical team.');
  }
  if (!elective && ((data.stentType === 'bms' && timing === 'le30d') || (data.stentType === 'des' && ['le30d', 'gt30d-lt3mo'].includes(timing)))) {
    guidance.push('If time-sensitive surgery must proceed within 30 days of BMS or <3 months of DES, continue DAPT unless bleeding risk outweighs prevention of stent thrombosis (Class 1). Urgent/emergency cases require an immediate individualized plan.');
  }
  guidance.push('After prior PCI, continue aspirin 75–100 mg perioperatively if possible (Class 1); reconcile the actual antiplatelet regimen with cardiology.');
  return guidance;
}
