import { ClinicalDomain, MonitoringPlan, PatientData, ClinicalCalculations } from '../../types';

export function buildMonitoringPlan(domains: ClinicalDomain[], patientData: PatientData, calculations: ClinicalCalculations): MonitoringPlan {
  const plan: MonitoringPlan = { shortTerm: [], mediumTerm: [], longTerm: [] };
  if (calculations.bpClassification === 'Hypertensive Crisis' || (patientData.labs.potassium ?? 0) >= 6) {
    plan.shortTerm.push({ timing: 'Now', tests: ['Prompt clinical assessment, repeat measurement and targeted testing'], purpose: 'Assess acute target-organ injury or clinically significant hyperkalemia before routine optimization.' });
    return plan;
  }
  const changes = domains.flatMap(d => d.recommendations).filter(r => ['ADD', 'INCREASE', 'SWITCH', 'CONSIDER'].includes(r.action));
  const includes = (pattern: RegExp) => changes.some(r => pattern.test(r.medication));
  if (includes(/lisinopril|losartan|sacubitril|valsartan|chlorthalidone/i)) plan.shortTerm.push({
    timing: 'Within 1–2 weeks after an agreed medication change', tests: ['Basic metabolic panel and BP review'],
    purpose: 'Check kidney function, electrolytes, volume status and tolerability; obtain baseline results before initiation.',
    action: 'Promptly reassess significant creatinine or potassium changes and reversible causes; individualize holding/reducing therapy.',
  });
  if (includes(/spironolactone|eplerenone/i)) plan.shortTerm.push({
    timing: 'If MRA initiated: about 3 days, 1 week, then monthly for 3 months', tests: ['Potassium and creatinine/eGFR'],
    purpose: 'Detect hyperkalemia and worsening kidney function after initiation or dose changes.',
  });
  if (includes(/finerenone/i)) plan.shortTerm.push({
    timing: 'If finerenone initiated: 4 weeks, with earlier checks when indicated', tests: ['Potassium and eGFR'],
    purpose: 'Review eligibility and dose; arrange additional early potassium monitoring if baseline K is >4.8–5.0.',
  });
  if (includes(/empagliflozin|dapagliflozin/i)) plan.shortTerm.push({
    timing: 'Before initiation and early follow-up individualized to renal/volume risk', tests: ['Renal function and volume-status review'],
    purpose: 'Confirm SGLT2 indication and renal eligibility; discuss adverse effects and sick-day/perioperative holds.',
  });
  if (domains.some(d => d.name === 'BLOOD_PRESSURE')) plan.shortTerm.push({
    timing: 'Ongoing', tests: ['Home BP log using validated equipment and correct technique'], purpose: 'Confirm the BP pattern and response to agreed treatment changes.',
  });
  if (includes(/statin|ezetimibe|nonstatin/i)) plan.mediumTerm.push({
    timing: '4–12 weeks after a treatment change', tests: ['Lipid panel'], purpose: 'Assess response and adherence before further intensification.',
  });
  if (patientData.history.diabetes && domains.some(d => d.name === 'DIABETES_CARDIORENAL')) plan.mediumTerm.push({
    timing: 'About 3 months after a treatment change', tests: ['Hemoglobin A1c'], purpose: `Assess glucose control against an individualized goal (usual goal <${calculations.a1cGoal}%).`,
  });
  if (domains.length) plan.longTerm.push({
    timing: 'Individualized follow-up', tests: ['Reassess selected conditions, adherence, tolerability and patient priorities'], purpose: 'Use the domain-specific guidance above to select tests and intervals; this is not a standing laboratory order set.',
  });
  return plan;
}
