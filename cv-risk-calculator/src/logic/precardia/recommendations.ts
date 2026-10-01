// Source: Thompson et al. JACC 2026;88:1543–1643 (2024 recommendations reaffirmed).
// Section references are retained with the decisions for auditability.
import type { PreCardiaData, RCRIResult, SurgicalRisk, FunctionalCapacityInfo, PreCardiaRecommendations } from '../../types/precardia.types';
import { getPCIGuidance } from './guideline';

export function generateRecommendations(
  data: PreCardiaData,
  rcri: RCRIResult,
  surgeryRisk: SurgicalRisk,
  capacity: FunctionalCapacityInfo
): PreCardiaRecommendations {
  const general: string[] = [];
  const testing: string[] = [];
  const medications: string[] = [];
  const elective = data.surgeryUrgency === 'elective';
  const expedited = data.surgeryUrgency === 'emergency' || data.surgeryUrgency === 'urgent';
  const active = data.unstableAngina || data.decompensatedHF || data.significantArrhythmia || data.severeValvularDisease;
  const elevatedSurgery = surgeryRisk.level === 'Intermediate' || surgeryRisk.level === 'High';
  const externalElevatedRisk = Boolean(data.riskCalculator && Number.isFinite(data.estimatedMaceRisk) && data.estimatedMaceRisk! >= 1 && data.estimatedMaceRisk! <= 100);
  const elevatedCalculatedRisk = rcri.score > 1 || externalElevatedRisk;
  const limitedCapacity = capacity.category === 'poor' || capacity.category === 'unknown';
  const priorPCI = data.stentType === 'des' || data.stentType === 'bms' || data.balloonAngioplasty;
  const knownCVD = Boolean(data.ischemicHeartDisease || data.recentMI === 'yes' || priorPCI || data.cabg === 'yes' || data.tavrTavi === 'yes' || data.teer === 'yes' || data.heartFailure || data.cerebrovascularDisease || data.atrialFibrillation || data.valvularHeartDisease || data.pulmonaryHypertension || data.congenitalHeartDisease || active);
  const symptoms = Boolean(data.cardiovascularSymptoms || data.newOrWorseningDyspnea || active);

  // Table 2 / Figure 1: emergency and unstable conditions precede elective testing.
  if (data.surgeryUrgency === 'emergency') {
    general.push('Emergency surgery (<2 hours): proceed with necessary surgery; do not delay for routine cardiac testing. Coordinate focused stabilization and intraoperative/postoperative monitoring.');
  } else if (data.surgeryUrgency === 'urgent') {
    general.push('Urgent surgery (≥2 to <24 hours): perform focused evaluation and optimization within the available window; do not delay necessary intervention for routine stress testing or CCTA.');
  } else if (data.surgeryUrgency === 'time-sensitive') {
    general.push('Time-sensitive surgery: up to 3 months may be available for evaluation if delay does not worsen outcomes. Agree on timing and alternatives with the patient and perioperative team.');
  }
  if (active) {
    const problems = [data.unstableAngina && 'ACS/unstable angina', data.decompensatedHF && 'decompensated HF', data.significantArrhythmia && 'unstable arrhythmia', data.severeValvularDisease && 'severe symptomatic valve disease'].filter(Boolean).join(', ');
    general.push(`${problems}: ${elective ? 'defer elective surgery for evaluation and treatment' : 'obtain prompt multidisciplinary evaluation and stabilization matched to surgical urgency'}. Routine ischemia screening is inappropriate during instability; pursue condition-directed evaluation (Figure 1, Sections 4.3 and 6).`);
  } else if (symptoms) {
    general.push('Cardiovascular symptoms require clinical assessment for an independent diagnostic indication, even when the planned procedure or calculated risk is low. Do not interpret a low RCRI as clearance.');
  }
  if (surgeryRisk.level === 'Variable') {
    general.push('Procedure risk is unknown. Establish procedure-specific risk and use a validated perioperative risk calculator before applying the elevated-risk testing pathway.');
  }

  general.push(...getPCIGuidance(data));
  if (data.recentMI === 'yes') {
    general.push('Recent MI: assess residual ischemia, clinical stability, revascularization and antiplatelet requirements with cardiology. Active ACS warrants deferral of elective surgery; this guideline does not establish a universal 60-day clearance rule after MI (Sections 6.1 and 7.5).');
  }
  if (data.cabg === 'yes') {
    general.push('Prior CABG is a risk modifier. Assess recovery, symptoms and residual cardiac disease with the treating team; do not apply a universal 6-week waiting period as a recommendation from this guideline.');
  }
  if (data.tavrTavi === 'yes') {
    general.push('After successful TAVR/TAVI, noncardiac surgery can reasonably occur early, including within 30 days when clinically indicated. Confirm valve performance and clinical stability; no mandatory 30-day delay is specified (Section 6.4.4, Class 2a).');
  }
  if (data.teer === 'yes') {
    general.push('After successful mitral TEER, noncardiac surgery is reasonable as clinically indicated. Confirm procedural success, residual valve disease and the antithrombotic plan; no mandatory 4-week delay is specified (Section 6.4.4, Class 2a).');
  }
  if (data.cerebrovascularDisease) {
    general.push(elective && data.strokeTiming === 'lt3mo'
      ? 'Stroke/TIA <3 months: delaying elective surgery until ≥3 months after the most recent event is reasonable (Section 6.7, Class 2a).'
      : data.strokeTiming === 'ge3mo'
        ? 'Most recent stroke/TIA was ≥3 months ago. Individualize residual neurologic, vascular and antithrombotic risks.'
        : 'Verify the most recent stroke/TIA date. For elective surgery, a delay of ≥3 months after the event is reasonable; urgent/time-sensitive decisions require individualized risk assessment (Section 6.7).');
  }

  // Sections 4.1 and 4.2: distinguish disease-directed tests from routine screening.
  if (!expedited && !active && elevatedSurgery) {
    testing.push(knownCVD || symptoms
      ? 'A preoperative resting 12-lead ECG is reasonable for known CVD or cardiovascular symptoms before elevated-risk surgery (Section 4.1, Class 2a). Review prior tracings; no universal 3-month expiration is established.'
      : 'A baseline 12-lead ECG may be considered for an asymptomatic patient undergoing elevated-risk surgery (Section 4.1, Class 2b).');
  } else if (!symptoms && surgeryRisk.level === 'Low') {
    testing.push('Routine preoperative ECG is not recommended in asymptomatic patients having low-risk surgery (Class 3: No benefit).');
  }
  if (data.newOrWorseningDyspnea || data.decompensatedHF) {
    testing.push('Evaluate LV function for new dyspnea, HF findings or suspected new/worsening ventricular dysfunction; worsening known HF also warrants reassessment. Match testing to urgency and do not delay emergency surgery (Section 4.2.1).');
  } else if (data.heartFailure && !symptoms) {
    testing.push('Clinically stable, asymptomatic HF: routine repeat assessment of LV function is not recommended solely because the last echocardiogram is over a year old (Section 4.2.1, Class 3: No benefit).');
  }
  if (data.valvularHeartDisease || data.severeValvularDisease) {
    if (data.severeValvularDisease || data.valvularSeverity === 'severe') {
      general.push('Severe valve disease: evaluate valve-specific intervention indications before elective surgery. Severe AS/MS require valve-team assessment; asymptomatic disease does not automatically preclude surgery (Section 6.4).');
    }
    const significantValve = data.valvularSeverity === 'moderate' || data.valvularSeverity === 'severe' || data.severeValvularDisease;
    const regurgitation = data.valvularType === 'aortic-regurgitation' || data.valvularType === 'mitral-regurgitation';
    if (significantValve) {
      testing.push(data.valvularType === 'aortic-stenosis' && elevatedSurgery || regurgitation
        ? 'Review adequate current echocardiographic assessment of valve severity and ventricular function; preoperative echocardiography is recommended for suspected moderate/severe AS before elective elevated-risk surgery, or moderate/severe regurgitation before elective surgery (Sections 6.4.1 and 6.4.3).'
        : 'Review valve type, severity, symptoms, ventricular function and existing echocardiography with the valve team to determine whether repeat imaging is needed (Section 6.4).');
    }
  }

  // Section 3.4: missing BNP and missing troponin are independent decisions.
  const biomarkerEligible = elevatedSurgery && (knownCVD || data.age >= 65 || (data.age >= 45 && symptoms));
  const bnpAvailable = Number.isFinite(data.bnp) && data.bnp! >= 0;
  const ntAvailable = Number.isFinite(data.ntproBNP) && data.ntproBNP! >= 0;
  const troponinAvailable = Number.isFinite(data.troponin) && data.troponin! >= 0;
  const validURL = Number.isFinite(data.troponinUpperLimit) && data.troponinUpperLimit! > 0;
  const abnormalBNP = bnpAvailable && data.bnp! > 92;
  const abnormalNT = ntAvailable && data.ntproBNP! >= 300;
  const abnormalTroponin = troponinAvailable && validURL && data.troponin! > data.troponinUpperLimit!;
  if (biomarkerEligible && !expedited && !active) {
    if (!bnpAvailable && !ntAvailable) testing.push('Measuring BNP or NT-proBNP before elevated-risk surgery is reasonable for known CVD, age ≥65, or age ≥45 with CVD symptoms (Section 3.4, Class 2a).');
    if (!troponinAvailable) testing.push('A baseline cardiac troponin may be reasonable in the same eligible population (Section 3.4, Class 2b); this is distinct from BNP/NT-proBNP testing.');
  }
  if (abnormalBNP) testing.push(`BNP ${data.bnp} pg/mL is above the Figure 1 threshold (>92). Discuss perioperative risk and whether further evaluation would change care; this alone does not diagnose HF or mandate ischemia testing.`);
  if (abnormalNT) testing.push(`NT-proBNP ${data.ntproBNP} pg/mL meets the Figure 1 threshold (≥300). Discuss perioperative risk and whether further evaluation would change care; this alone does not diagnose HF or mandate ischemia testing.`);
  if (abnormalTroponin) testing.push(`Troponin ${data.troponin} ng/mL is above the supplied assay 99th-percentile limit (${data.troponinUpperLimit} ng/mL). Evaluate myocardial injury and clinical context; an elevated value alone does not establish acute MI.`);
  if (troponinAvailable && !validURL) testing.push('Troponin cannot be classified without the local assay-specific 99th-percentile upper reference limit in matching units; confirm with the laboratory.');

  // Sections 4.3 / 4.5: one pathway supplies ALL ischemia-testing advice.
  const canScreen = !expedited && !active;
  const incompleteRCRI = data.surgeryType === 'other' && (!data.otherRcriHighRisk || data.otherRcriHighRisk === 'unknown');
  const anyAbnormalBiomarker = abnormalBNP || abnormalNT || abnormalTroponin;
  const normalMeasuredBiomarkers = (bnpAvailable || ntAvailable || troponinAvailable) && !anyAbnormalBiomarker && (!troponinAvailable || validURL);
  if (canScreen) {
    if (surgeryRisk.level === 'Variable' || (incompleteRCRI && !elevatedCalculatedRisk && surgeryRisk.level !== 'Low')) {
      testing.push('Confirm the procedure category and RCRI surgical criterion before interpreting calculated risk or considering routine ischemia testing. Unknown information is not evidence of low risk.');
    } else if (surgeryRisk.level === 'Low' || !elevatedCalculatedRisk || !limitedCapacity) {
      testing.push('Routine preoperative stress testing or CCTA is not recommended for low-risk procedures, low calculated risk, or adequate functional capacity with stable symptoms (Sections 4.3 and 4.5, Class 3: No benefit). New symptoms still require evaluation on their own merits.');
    } else if (elevatedSurgery) {
      const needsModalityReview = data.pulmonaryHypertension || (data.valvularHeartDisease && data.valvularType === 'aortic-stenosis' && data.valvularSeverity === 'severe');
      if (needsModalityReview) {
        testing.push('Obtain specialist review of PH severity or severe aortic stenosis before choosing ischemia testing. Severe PH and severe/symptomatic AS can contraindicate stress testing; this form cannot select a safe modality from the available information (Section 4.3.1, Table 7).');
      } else if (normalMeasuredBiomarkers) {
        testing.push('Available biomarkers are below the Figure 1 abnormal thresholds. The stepwise pathway supports proceeding without further routine ischemia testing after clinical review; investigate any independent diagnostic indication.');
      } else {
        testing.push('Elevated-risk surgery, elevated calculated risk and poor/unknown capacity: stress testing OR CCTA may be considered only if the result would change care, after biomarker review and shared decision-making (Sections 4.3 and 4.5, Class 2b). These are alternatives, not a routine pair of tests.');
      }
    }
  } else {
    testing.push('Do not pursue routine preoperative stress testing or CCTA during an active unstable cardiac condition or if it would delay urgent/emergency surgery. Use focused, condition-directed evaluation.');
  }

  // Sections 6.3 and 7: medication indications must not be inferred from risk alone.
  if (data.betaBlocker) medications.push('Continue established beta-blocker therapy through the perioperative period as clinical circumstances permit (Section 7.7, Class 1).');
  else if (data.newBetaBlockerIndication) medications.push(elective
    ? 'For a confirmed new beta-blocker indication, initiation may be considered sufficiently before elective surgery, optimally >7 days, for tolerance assessment and titration. Do not initiate on the day of surgery without an immediate clinical need (Section 7.7).'
    : 'A new beta-blocker indication requires individualized treatment; do not initiate solely for surgical risk reduction on the day of surgery.');
  if (data.statin) medications.push('Continue statin therapy perioperatively (Section 7.1, Class 1).');
  else medications.push('Assess the usual ASCVD/10-year-risk indication for a statin; if criteria are met, initiate with intent for long-term treatment. Surgery type alone is not an indication (Section 7.1).');
  if (data.aceARB) {
    if (data.raasIndication === 'hfref') medications.push('For chronic ACE inhibitor/ARB therapy used for HFrEF, perioperative continuation is reasonable, individualized to hemodynamics and contraindications (Section 7.2, Class 2a).');
    else if (data.raasIndication === 'hypertension' && data.bloodPressureControlled && elevatedSurgery && !expedited) medications.push('For selected patients taking ACE inhibitor/ARB for hypertension with controlled BP and elevated-risk surgery, omission 24 hours before surgery may reduce intraoperative hypotension; individualize and restart when clinically reasonable (Section 7.2, Class 2b).');
    else medications.push('Individualize ACE inhibitor/ARB management after confirming indication and BP. A routine hold is not established for all patients: the 24-hour omission option applies to selected controlled-hypertension patients having elevated-risk surgery; continuation is reasonable for HFrEF (Section 7.2).');
  }
  if (data.sglt2i) medications.push(expedited
    ? 'SGLT2 inhibitor: withhold now and alert anesthesia to perioperative ketoacidosis/metabolic-acidosis risk if the usual 3–4-day washout is unavailable; do not delay emergency surgery solely to complete washout.'
    : 'Withhold canagliflozin, dapagliflozin or empagliflozin for ≥3 days and ertugliflozin for ≥4 days before scheduled surgery (Section 7.8, Class 1). Reinitiation requires clinical review after recovery; this guideline does not establish a universal restart interval.');
  if (data.heartFailure && !data.decompensatedHF) medications.push('For compensated HF, continuing GDMT other than SGLT2 inhibitors is reasonable unless contraindicated; individualize to hemodynamics (Section 6.3).');
  if (data.anticoagulant) medications.push('Create an agent-specific anticoagulant plan with the prescribing and procedural teams, accounting for renal clearance, thrombotic risk, bleeding risk and neuraxial procedures (Tables 13–14). Some minimal-bleeding-risk procedures need no interruption. Routine heparin bridging is harmful for most patients; reserve consideration for selected high-thrombotic-risk patients interrupting a VKA. Resume after hemostasis (Section 7.6).');
  if (data.antiplatelet && !priorPCI) medications.push('Without prior PCI, continuation of aspirin for chronic coronary disease may be reasonable when cardiac risk outweighs bleeding. Do not routinely initiate aspirin for elective noncarotid surgery. Coordinate any P2Y12 interruption with the prescribing team (Section 7.5).');

  if (data.diabetes || data.diabetesInsulin) testing.push('For elective surgery in patients with diabetes, HbA1c testing is reasonable if no result is available within the prior 3 months; coordinate perioperative glycemic management (Section 7.8).');
  if (limitedCapacity) general.push(data.useDASI && data.dasiCompleted
    ? 'DASI ≤34 meets the poor-functional-capacity criterion, even when formula-estimated METs exceed 4. Use the DASI criterion in risk assessment.'
    : capacity.category === 'unknown' ? 'Functional capacity is unknown or the DASI assessment is incomplete; complete a structured assessment when feasible.' : 'Clinical functional capacity is <4 METs. Consider optimization and perioperative support in the context of overall risk.');
  if (data.hypertension) general.push('Review BP before surgery. With elevated-risk elective surgery, cardiovascular risk factors and recent poorly controlled BP (SBP ≥180 or DBP ≥110 mm Hg), deferral may be considered. Avoid intraoperative/postoperative hypotension and restart antihypertensives when clinically reasonable (Section 6.2).');
  if (data.pulmonaryHypertension) general.push('Clarify PH severity and mechanism; continue established PAH-targeted therapy. For severe PH and elevated-risk surgery, consultation with a specialist PH center and invasive monitoring are reasonable; do not infer severe PH from this checkbox alone (Section 6.3.2).');
  if (data.congenitalHeartDisease) general.push('Establish congenital lesion complexity and functional status. Intermediate/elevated-risk lesions require ACHD specialist consultation before elective surgery (Section 6.3.3).');
  if (data.hasCIED || data.pacemaker || data.icd || data.crt) general.push('Coordinate a CIED plan if electromagnetic interference is anticipated: confirm device/model, pacing dependence, magnet response, surgical location and backup pacing/defibrillation. Restore modified settings and ICD therapies before discharge from monitoring; recent interrogation alone does not replace this plan (Section 6.6).');
  if (data.atrialFibrillation && data.afibType === 'new-onset') general.push('New-onset perioperative AF: evaluate and treat triggers such as pain, anemia or sepsis. Assess postoperative anticoagulation against bleeding risk; arrange outpatient thromboembolic-risk assessment and AF surveillance (Section 6.5).');
  if (data.frailtyScore !== undefined && data.frailtyScore >= 4) general.push('Frailty/vulnerability is a risk modifier; plan nutrition, mobility and postoperative support with the perioperative team. The Clinical Frailty Scale should not be treated as a stand-alone surgical risk estimate (Section 3.3).');
  else if (elevatedSurgery && data.age >= 65 && data.frailtyScore === undefined) general.push('A validated frailty assessment is reasonable at age ≥65 before elevated-risk surgery (Section 3.3).');
  if (data.sleepApnea) general.push('Known OSA: coordinate the perioperative airway, respiratory monitoring and usual treatment plan with anesthesia (Section 6.8).');

  // Section 9.1: postoperative surveillance is Class 2b, not universal monitoring.
  const cvRiskFactors = data.hypertension || data.diabetes || data.diabetesInsulin || data.currentSmoker || data.obesity;
  if (elevatedSurgery && (knownCVD || symptoms || (data.age >= 65 && cvRiskFactors))) {
    general.push('Measuring troponin at 24 and 48 hours after surgery may be reasonable for known CVD, CVD symptoms, or age ≥65 with cardiovascular risk factors having elevated-risk surgery (Section 9.1, Class 2b). Evaluate any myocardial injury and arrange cardiovascular follow-up if MINS is identified.');
  } else if (surgeryRisk.level === 'Low') {
    general.push('Routine postoperative troponin screening is not indicated for low-risk surgery without symptoms/signs of ischemia or MI (Section 9.1, Class 3: No benefit).');
  }

  return {
    general, testing, medications,
    testingPrinciples: [
      'Use the same clinical indications for cardiovascular testing/treatment as outside the surgical setting; order tests only when results could change care.',
      'Risk modifiers (severe valve disease, PH, congenital disease, prior PCI/CABG, recent stroke, CIED and frailty) need individualized assessment even with a low RCRI.',
      'Routine invasive coronary angiography or prophylactic revascularization for non-left-main stable CAD is not recommended solely to reduce surgical risk (Sections 4.6 and 6.1.1).',
      'This is an adult preoperative decision aid. Anesthesia, complex disease, device programming and postoperative complication treatment require a separate specialist plan.',
    ],
  };
}
