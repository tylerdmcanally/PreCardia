import { PatientData, ClinicalCalculations, DomainRecommendation } from '../../types';
import { GUIDELINES } from '../../data/guidelines';
import { getSafetyRecommendationsForDomain } from '../safety';
import { hasMedicationInCategory } from '../safety/utils';
import { calculateCreatinineClearance, getApixabanAFDose } from '../calculations/anticoagulantDosing';

export function generateAnticoagulationRecommendations(patientData: PatientData, calculations: ClinicalCalculations): DomainRecommendation[] {
  const recommendations = getSafetyRecommendationsForDomain('ANTIPLATELET_ANTICOAGULATION',patientData,calculations);
  const { history, medications } = patientData;
  const hasAnticoagulant = hasMedicationInCategory(medications,'Anticoagulant');
  const hasAntiplatelet = hasMedicationInCategory(medications,'Antiplatelet');
  const hasWarfarin = medications.some(m=>/warfarin/i.test(m.genericName));
  const hasDOAC = medications.some(m=>/apixaban|rivaroxaban|dabigatran|edoxaban/i.test(m.genericName));
  const hasCAD = history.cad || history.priorMI || history.priorPCI;
  const evidence = GUIDELINES.AFIB_2023;
  const valve = history.afValveStatus ?? 'unknown';
  const crcl = calculateCreatinineClearance(patientData);
  const dose = getApixabanAFDose(patientData);
  const elevatedRisk = calculations.cha2ds2vasc?.riskCategory !== 'Low';

  if (history.atrialFibrillation && calculations.cha2ds2vasc) {
    const score = calculations.cha2ds2vasc.score;
    if (valve === 'mechanical' || valve === 'mitral-stenosis') {
      recommendations.push({priority:'HIGH',action:'EVALUATE',medication:'Warfarin / valve-specific anticoagulation',evidence,
        rationale:'Mechanical valve or moderate-or-greater mitral stenosis requires a warfarin-based strategy rather than a DOAC, independent of CHA2DS2-VASc.',
        monitoring:'Confirm valve type, INR target, bleeding considerations and transition plan with the treating team. Mechanical-valve INR targets vary; do not use a universal target or interrupt anticoagulation without a plan.'});
    } else if (valve === 'unknown') {
      recommendations.push({priority:'HIGH',action:'EVALUATE',medication:'Valve history before anticoagulant selection',evidence,
        rationale:`AF with CHA2DS2-VASc ${score}: establish whether a mechanical valve or moderate-or-greater mitral stenosis is present before choosing or switching an anticoagulant.`,
        monitoring:'Review valve history, bleeding/contraindications, kidney function, weight, interactions and the current indication. Do not infer DOAC eligibility from a missing valve history.'});
    } else if (elevatedRisk && (!hasAnticoagulant || (hasWarfarin && !hasDOAC))) {
      const incomplete = crcl === null || dose === null;
      const severeKidneyDisease = history.dialysis || (crcl !== null && crcl < 15);
      recommendations.push({priority:calculations.cha2ds2vasc.riskCategory === 'High' ? 'HIGH' : 'MODERATE',
        action:incomplete || severeKidneyDisease ? 'EVALUATE' : 'CONSIDER',
        medication:incomplete || severeKidneyDisease ? 'Anticoagulation strategy' : 'Apixaban',
        recommendedDose:incomplete || severeKidneyDisease ? undefined : `${dose} for AF, if otherwise eligible`,evidence,
        rationale:`CHA2DS2-VASc ${score}: anticoagulation ${calculations.cha2ds2vasc.riskCategory === 'High' ? 'is recommended' : 'is reasonable after shared decision-making'}. ${incomplete ? 'Obtain age, weight and creatinine; missing renal data cannot select warfarin or establish a dose.' : severeKidneyDisease ? 'For dialysis/CrCl <15, individualized warfarin or evidence-based apixaban may be reasonable; specialist review is needed.' : 'DOACs are preferred over warfarin for eligible AF patients.'}`,
        monitoring:'Review active/recent bleeding, interactions, renal stability and patient preferences. Bleeding scores identify modifiable risks and must not be used alone to deny anticoagulation.',
        additionalNotes:hasWarfarin ? 'If switching to apixaban, discontinue warfarin and initiate apixaban when INR is <2.0 using a coordinated transition plan.' : 'Aspirin alone or with clopidogrel is not an alternative to anticoagulation for AF stroke prevention.'});
    } else if (!elevatedRisk && !hasAnticoagulant && valve === 'none') {
      recommendations.push({priority:'LOW',action:'MONITOR',medication:'AF stroke risk',evidence,
        rationale:'Anticoagulation is not routinely indicated by this low CHA2DS2-VASc score alone. Aspirin provides no benefit for AF stroke prevention.',monitoring:'Reassess risk periodically and when comorbidities change.'});
    }
    if (hasCAD) {
      const remotePCI = history.priorPCI && history.pciTiming === '>12 months';
      recommendations.push({priority:'MODERATE',action:'EVALUATE',medication:'Combined anticoagulant / antiplatelet plan',evidence,
        rationale:remotePCI ? 'Beyond one year after revascularization, OAC monotherapy is recommended for stable CAD without prior stent thrombosis when anticoagulation is indicated.'
          : 'Clarify the exact PCI/ACS date, ACS versus elective PCI, ischemic risk and bleeding risk before changing combined therapy. A <3-month category does not establish whether aspirin should stop today.',
        monitoring:remotePCI ? 'Confirm no recent ACS, recurrent ischemia or stent thrombosis before withdrawing an antiplatelet; coordinate with the treating cardiologist.'
          : 'For most AF patients after PCI, early aspirin discontinuation at 1–4 weeks and OAC plus a P2Y12 inhibitor is preferred over prolonged triple therapy. Individualize duration and confirm the existing PCI plan.'});
    }
  }
  // This pathway must remain reachable in patients without AF.
  if (!history.atrialFibrillation && hasCAD) {
    if (!hasAntiplatelet && !hasAnticoagulant) recommendations.push({priority:'HIGH',action:'CONSIDER',medication:'Secondary-prevention antiplatelet therapy',recommendedDose:'Low-dose aspirin 75–100mg daily if eligible',
      rationale:'Established coronary disease generally supports single-antiplatelet therapy when there is no indication for oral anticoagulation. Assess bleeding risk, allergy and the post-ACS/PCI plan first.',evidence:GUIDELINES.CCD_2023});
    if (history.priorMI || history.priorPCI) recommendations.push({priority:'MODERATE',action:'EVALUATE',medication:'Post-ACS / PCI antiplatelet duration',evidence:GUIDELINES.CCD_2023,
      rationale:'Determine exact event timing, ACS versus elective PCI and bleeding risk. A history of MI alone does not justify starting or restarting 12 months of DAPT.',monitoring:'Confirm the interventional/discharge plan before starting or stopping a P2Y12 inhibitor.'});
  }
  if (hasAnticoagulant && hasAntiplatelet && !medications.some(m=>m.category==='GI Protection - PPI')) recommendations.push({priority:'MODERATE',action:'CONSIDER',medication:'GI protection',evidence:GUIDELINES.AFIB_PCI_2020,
    rationale:'Review PPI gastroprotection when multiple antithrombotic agents are used, and avoid NSAIDs.'});
  return recommendations;
}
