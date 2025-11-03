import { PatientData, ClinicalCalculations, DomainRecommendation } from '../../types';
import { GUIDELINES } from '../../data/guidelines';
import { getSafetyRecommendationsForDomain } from '../safety';

export function generateAnticoagulationRecommendations(
  patientData: PatientData,
  calculations: ClinicalCalculations
): DomainRecommendation[] {
  const recommendations: DomainRecommendation[] = [
    ...getSafetyRecommendationsForDomain(
      'ANTIPLATELET_ANTICOAGULATION',
      patientData,
      calculations
    ),
  ];
  const { history, medications } = patientData;
  const { cha2ds2vasc, egfr } = calculations;


  // Only generate recommendations if patient has atrial fibrillation
  if (!history.atrialFibrillation || !cha2ds2vasc) {
    return recommendations;
  }

  const hasAnticoagulant = medications.some(
    (m) =>
      m.category === 'Anticoagulant' ||
      m.genericName.toLowerCase().includes('apixaban') ||
      m.genericName.toLowerCase().includes('rivaroxaban') ||
      m.genericName.toLowerCase().includes('edoxaban') ||
      m.genericName.toLowerCase().includes('dabigatran') ||
      m.genericName.toLowerCase().includes('warfarin')
  );

  const hasDOAC = medications.some(
    (m) =>
      (m.category === 'Anticoagulant' && !m.genericName.toLowerCase().includes('warfarin')) ||
      m.genericName.toLowerCase().includes('apixaban') ||
      m.genericName.toLowerCase().includes('rivaroxaban') ||
      m.genericName.toLowerCase().includes('edoxaban') ||
      m.genericName.toLowerCase().includes('dabigatran')
  );

  const hasWarfarin = medications.some(
    (m) => (m.category === 'Anticoagulant' && m.genericName.toLowerCase().includes('warfarin'))
  );

  const { score, riskCategory } = cha2ds2vasc;
  const canUseDOAC = egfr >= 30;

  

  

  // HIGH PRIORITY: High CHA2DS2-VASc needs anticoagulation
  if (riskCategory === 'High' && !hasAnticoagulant) {
    recommendations.push({
      priority: 'HIGH',
      action: 'ADD',
      medication: canUseDOAC ? 'Apixaban' : 'Warfarin',
      recommendedDose: canUseDOAC ? '5mg twice daily' : 'Goal INR 2-3',
      rationale: `Atrial fibrillation with CHA2DS2-VASc score ${score} (${riskCategory} risk, ${cha2ds2vasc.annualStrokeRisk} annual stroke risk) requires anticoagulation for stroke prevention.`,
      evidence: GUIDELINES.AFIB_2023,
      monitoring: canUseDOAC
        ? 'Monitor renal function every 3-6 months. Assess bleeding risk (consider HAS-BLED score). Watch for signs of bleeding.'
        : 'INR monitoring: check INR 2-3 times weekly initially, then weekly until stable, then monthly. Goal INR 2-3.',
      additionalNotes: canUseDOAC
        ? 'DOACs preferred over warfarin (no dietary restrictions, no INR monitoring, similar efficacy). Reduce to 2.5mg BID if meets 2 of 3: age ≥80, weight ≤60kg, Cr ≥1.5.'
        : `DOAC not recommended due to eGFR ${egfr.toFixed(0)}. Warfarin requires careful INR monitoring and dietary counseling (avoid high vitamin K foods).`,
    });
  }

  // HIGH PRIORITY: Warfarin to DOAC switch recommendation
  if (riskCategory === 'High' && hasWarfarin && !hasDOAC && egfr >= 30) {
    recommendations.push({
      priority: 'HIGH',
      action: 'SWITCH',
      medication: 'Apixaban',
      recommendedDose: '5mg twice daily',
      rationale: `Patient on warfarin for atrial fibrillation; DOACs have similar efficacy with lower bleeding risk and no dietary restrictions or INR monitoring required.`,
      evidence: GUIDELINES.AFIB_2023,
      monitoring:
        'STOP warfarin when INR <2.0, then start apixaban. Monitor renal function every 3-6 months. Watch for bleeding signs.',
      additionalNotes:
        'RE-LY, ROCKET-AF, ARISTOTLE trials showed DOACs non-inferior to warfarin with improved safety profile. Dose adjust to 2.5mg BID if meets 2 of 3 criteria: age ≥80, weight ≤60kg, Cr ≥1.5.',
    });
  }

  

  // MODERATE PRIORITY: Moderate CHA2DS2-VASc - consider anticoagulation
  if (riskCategory === 'Moderate' && !hasAnticoagulant) {
    recommendations.push({
      priority: 'MODERATE',
      action: 'CONSIDER',
      medication: canUseDOAC ? 'Apixaban' : 'Warfarin',
      recommendedDose: canUseDOAC ? '5mg twice daily' : 'Goal INR 2-3',
      rationale: `Atrial fibrillation with CHA2DS2-VASc score ${score} (${riskCategory} risk, ${cha2ds2vasc.annualStrokeRisk} annual stroke risk). Anticoagulation should be considered based on bleeding risk and patient preference.`,
      evidence: GUIDELINES.AFIB_2023,
      monitoring:
        'Assess bleeding risk using HAS-BLED score. Discuss risks/benefits with patient. If started, monitor as above.',
      additionalNotes:
        'Consider anticoagulation if HAS-BLED <3 and patient accepts treatment. May consider aspirin alone if anticoagulation declined, though less effective for stroke prevention.',
    });
  }

  // LOW PRIORITY: Low risk - no anticoagulation needed, but if on it, can continue
  if (riskCategory === 'Low' && !hasAnticoagulant) {
    recommendations.push({
      priority: 'LOW',
      action: 'MONITOR',
      medication: 'N/A',
      recommendedDose: 'N/A',
      rationale: `Atrial fibrillation with CHA2DS2-VASc score ${score} (${riskCategory} risk, ${cha2ds2vasc.annualStrokeRisk} annual stroke risk). Anticoagulation not routinely recommended.`,
      evidence: GUIDELINES.AFIB_2023,
      monitoring: 'No anticoagulation needed. May consider aspirin, though benefit is minimal. Reassess annually.',
      additionalNotes:
        'Low stroke risk does not warrant anticoagulation given bleeding risk. Ensure good rate/rhythm control of atrial fibrillation.',
    });
  }

  

  // SPECIAL SCENARIO: AF + PCI requiring timing-specific antithrombotic management
  const hasAFWithPCI = history.atrialFibrillation && history.priorPCI && (riskCategory === 'High' || riskCategory === 'Moderate');

  if (hasAFWithPCI && history.pciTiming) {
    const hasAspirin = medications.some((m) => m.genericName.toLowerCase().includes('aspirin'));
    const hasP2Y12 = medications.some(
      (m) =>
        m.genericName.toLowerCase().includes('clopidogrel') ||
        m.genericName.toLowerCase().includes('prasugrel') ||
        m.genericName.toLowerCase().includes('ticagrelor')
    );
    const hasPPI = medications.some(
      (m) =>
        m.category === 'GI Protection - PPI' ||
        m.genericName.toLowerCase().includes('omeprazole') ||
        m.genericName.toLowerCase().includes('pantoprazole') ||
        m.genericName.toLowerCase().includes('esomeprazole') ||
        m.genericName.toLowerCase().includes('lansoprazole')
    );

    const onTripleTherapy = hasAnticoagulant && hasAspirin && hasP2Y12;
    const onDualTherapy = hasAnticoagulant && (hasAspirin || hasP2Y12) && !(hasAspirin && hasP2Y12);
    const onDAPT = !hasAnticoagulant && hasAspirin && hasP2Y12;
    const onMultipleAntithrombotics = (hasAnticoagulant && (hasAspirin || hasP2Y12)) || onDAPT;

    const pciTiming = history.pciTiming;

    // TIMING-SPECIFIC RECOMMENDATIONS
    if (pciTiming === '<3 months') {
      // Very recent PCI: May need triple therapy initially if high-risk PCI, but transition quickly
      if (onTripleTherapy) {
        recommendations.push({
          priority: 'HIGH',
          action: 'EVALUATE',
          medication: 'Triple Therapy (Anticoagulant + Aspirin + P2Y12 inhibitor)',
          recommendedDose: 'N/A',
          rationale: `AF + PCI <3 months ago: Triple therapy acceptable for very short duration (days to 1 month max) in high-risk PCI, but HIGH BLEEDING RISK. Transition to dual therapy ASAP.`,
          evidence: GUIDELINES.AFIB_PCI_2020,
          monitoring: 'DISCONTINUE aspirin and transition to dual therapy (anticoagulant + clopidogrel) within 1 month of PCI. Assess HAS-BLED score regularly.',
          additionalNotes: 'Triple therapy duration should be <30 days even in high-risk PCI. Consider reduced-dose DOAC if high bleeding risk. Reassess at 1 month post-PCI.',
        });
      } else if (!hasAnticoagulant && onDAPT) {
        recommendations.push({
          priority: 'HIGH',
          action: 'ADD',
          medication: canUseDOAC ? 'Apixaban' : 'Warfarin',
          recommendedDose: canUseDOAC ? '5mg twice daily' : 'Goal INR 2-3',
          rationale: `CRITICAL: AF (CHA2DS2-VASc ${score}) + recent PCI (<3 months) on DAPT only. Must add anticoagulation for stroke prevention. DISCONTINUE aspirin, continue clopidogrel + anticoagulant.`,
          evidence: GUIDELINES.AFIB_PCI_2020,
          monitoring: 'Add anticoagulant now. Stop aspirin to reduce bleeding risk. Continue dual therapy (anticoagulant + clopidogrel) for 6-12 months post-PCI.',
          additionalNotes: 'Anticoagulation is REQUIRED for AF stroke prevention. DOACs preferred. Continue P2Y12 inhibitor for 6-12 months, then anticoagulation alone.',
        });
      } else if (hasAnticoagulant && !hasP2Y12) {
        recommendations.push({
          priority: 'HIGH',
          action: 'ADD',
          medication: 'Clopidogrel',
          recommendedDose: '75mg daily',
          rationale: `AF + recent PCI (<3 months): Requires dual therapy with anticoagulant + P2Y12 inhibitor for 6-12 months to prevent stent thrombosis.`,
          evidence: GUIDELINES.AFIB_PCI_2020,
          monitoring: 'Add clopidogrel 75mg daily. Continue dual therapy for 6-12 months post-PCI. Monitor for bleeding.',
          additionalNotes: 'P2Y12 inhibitor (clopidogrel) required after PCI to prevent stent thrombosis. Dual therapy reduces bleeding vs triple therapy.',
        });
      }
    } else if (pciTiming === '3-6 months' || pciTiming === '6-12 months') {
      // 3-12 months post-PCI: Should be on dual therapy (anticoagulant + P2Y12)
      if (onTripleTherapy) {
        recommendations.push({
          priority: 'HIGH',
          action: 'DISCONTINUE',
          medication: 'Aspirin',
          recommendedDose: 'N/A',
          rationale: `AF + PCI ${pciTiming} ago: TRIPLE THERAPY TOO LONG. Should have transitioned to dual therapy within 1 month. Stop aspirin immediately to reduce bleeding risk.`,
          evidence: GUIDELINES.AFIB_PCI_2020,
          monitoring: 'STOP aspirin now. Continue anticoagulant + clopidogrel for 6-12 months total from PCI date, then anticoagulation alone.',
          additionalNotes: 'CRITICAL: Triple therapy increases major bleeding 2-4x. Should be <30 days duration. Transition to dual therapy now.',
        });
      } else if (!hasAnticoagulant && onDAPT) {
        recommendations.push({
          priority: 'HIGH',
          action: 'ADD',
          medication: canUseDOAC ? 'Apixaban' : 'Warfarin',
          recommendedDose: canUseDOAC ? '5mg twice daily' : 'Goal INR 2-3',
          rationale: `CRITICAL: AF (CHA2DS2-VASc ${score}) + PCI ${pciTiming} ago on DAPT only. Must add anticoagulation. DISCONTINUE aspirin, continue clopidogrel + anticoagulant.`,
          evidence: GUIDELINES.AFIB_PCI_2020,
          monitoring: `Add anticoagulant now. Stop aspirin. Continue dual therapy (anticoagulant + clopidogrel) through 12 months post-PCI${pciTiming === '6-12 months' ? ', then transition to anticoagulation alone' : ''}.`,
          additionalNotes: 'Anticoagulation is REQUIRED for AF. DOACs preferred. Continue P2Y12 inhibitor through 12 months post-PCI for stent protection.',
        });
      } else if (hasAnticoagulant && hasAspirin && !hasP2Y12) {
        recommendations.push({
          priority: 'HIGH',
          action: 'SWITCH',
          medication: 'Clopidogrel (switch from aspirin)',
          recommendedDose: '75mg daily',
          rationale: `AF + PCI ${pciTiming} ago: Clopidogrel (P2Y12 inhibitor) preferred over aspirin when combined with anticoagulant (lower bleeding, better stent protection).`,
          evidence: GUIDELINES.AFIB_PCI_2020,
          monitoring: `Switch aspirin to clopidogrel 75mg daily. Continue dual therapy through 12 months post-PCI${pciTiming === '6-12 months' ? ', then transition to anticoagulation alone' : ''}.`,
          additionalNotes: 'P2Y12 inhibitor superior to aspirin post-PCI. Continue through 12 months, then anticoagulation monotherapy.',
        });
      } else if (hasAnticoagulant && !hasP2Y12 && !hasAspirin) {
        recommendations.push({
          priority: 'HIGH',
          action: 'ADD',
          medication: 'Clopidogrel',
          recommendedDose: '75mg daily',
          rationale: `AF + PCI ${pciTiming} ago: Requires dual therapy (anticoagulant + P2Y12 inhibitor) through 12 months post-PCI to prevent stent thrombosis.`,
          evidence: GUIDELINES.AFIB_PCI_2020,
          monitoring: `Add clopidogrel 75mg daily. Continue dual therapy through 12 months post-PCI${pciTiming === '6-12 months' ? ', then transition to anticoagulation alone' : ''}.`,
          additionalNotes: 'P2Y12 inhibitor required after PCI. Dual therapy through 12 months, then anticoagulation monotherapy.',
        });
      }
    } else if (pciTiming === '>12 months') {
      // Remote PCI: Should be on anticoagulation ALONE (no antiplatelet needed)
      if (onTripleTherapy || (hasAnticoagulant && (hasAspirin || hasP2Y12))) {
        const antiplateletMeds = [];
        if (hasAspirin) antiplateletMeds.push('aspirin');
        if (hasP2Y12) antiplateletMeds.push('clopidogrel/P2Y12 inhibitor');

        recommendations.push({
          priority: 'MODERATE',
          action: 'DISCONTINUE',
          medication: antiplateletMeds.join(' and '),
          recommendedDose: 'N/A',
          rationale: `AF + remote PCI (>12 months ago): Standard DAPT duration complete. Anticoagulation ALONE provides adequate protection. Continuing antiplatelet increases bleeding risk without added benefit.`,
          evidence: GUIDELINES.AFIB_PCI_2020,
          monitoring: 'STOP antiplatelet therapy. Continue anticoagulation alone for AF stroke prevention. Reassess if recurrent ACS/PCI.',
          additionalNotes: '2020 ACC Consensus: After 12 months post-PCI, transition to anticoagulation monotherapy in AF patients. Reduces bleeding without compromising efficacy.',
        });
      } else if (!hasAnticoagulant && (hasAspirin || hasP2Y12)) {
        recommendations.push({
          priority: 'HIGH',
          action: 'SWITCH',
          medication: canUseDOAC ? 'Apixaban' : 'Warfarin',
          recommendedDose: canUseDOAC ? '5mg twice daily' : 'Goal INR 2-3',
          rationale: `CRITICAL: AF (CHA2DS2-VASc ${score}) + remote PCI (>12 months). On antiplatelet only, but requires anticoagulation for stroke prevention. DISCONTINUE antiplatelet, START anticoagulant.`,
          evidence: GUIDELINES.AFIB_PCI_2020,
          monitoring: 'Stop antiplatelet therapy. Start anticoagulant for AF. Anticoagulation monotherapy is standard for remote PCI in AF patients.',
          additionalNotes: 'After 12 months post-PCI, anticoagulation alone is appropriate. No benefit from continuing antiplatelet long-term.',
        });
      }
    }

    // PPI recommendation for any patient on multiple antithrombotics
    if (onMultipleAntithrombotics && !hasPPI) {
      recommendations.push({
        priority: 'MODERATE',
        action: 'ADD',
        medication: 'Pantoprazole',
        recommendedDose: '40mg daily',
        rationale: 'Patient on multiple antithrombotic agents requires GI protection. PPI reduces GI bleeding risk by 50-70%.',
        evidence: GUIDELINES.AFIB_PCI_2020,
        monitoring: 'Start PPI for GI protection. Continue while on dual/triple therapy. Avoid NSAIDs and other GI irritants.',
        additionalNotes: '2020 ACC Expert Consensus recommends PPI for all patients on ≥2 antithrombotic agents to reduce GI bleeding risk.',
      });
    }
  } else if ((history.cad || history.priorMI) && (riskCategory === 'High' || riskCategory === 'Moderate') && !history.priorPCI) {
    // AF + CAD/MI but NO documented PCI - give general guidance
    const hasAspirin = medications.some((m) => m.genericName.toLowerCase().includes('aspirin'));
    const hasP2Y12 = medications.some(
      (m) =>
        m.genericName.toLowerCase().includes('clopidogrel') ||
        m.genericName.toLowerCase().includes('prasugrel') ||
        m.genericName.toLowerCase().includes('ticagrelor')
    );
    const hasPPI = medications.some(
      (m) =>
        m.category === 'GI Protection - PPI' ||
        m.genericName.toLowerCase().includes('omeprazole') ||
        m.genericName.toLowerCase().includes('pantoprazole') ||
        m.genericName.toLowerCase().includes('esomeprazole') ||
        m.genericName.toLowerCase().includes('lansoprazole')
    );

    const onMultipleAntithrombotics = hasAnticoagulant && (hasAspirin || hasP2Y12);

    if (hasAspirin || hasP2Y12) {
      recommendations.push({
        priority: 'MODERATE',
        action: 'EVALUATE',
        medication: 'Antiplatelet therapy (aspirin/clopidogrel)',
        recommendedDose: 'N/A',
        rationale: `AF with CAD/MI: Patient on antiplatelet therapy. If remote from any PCI/ACS event (>12 months), consider transitioning to anticoagulation alone to reduce bleeding risk.`,
        evidence: GUIDELINES.AFIB_PCI_2020,
        monitoring: 'Clarify timing of last PCI/ACS event. If >12 months remote, consider stopping antiplatelet and continuing anticoagulation alone.',
        additionalNotes: 'Long-term antiplatelet + anticoagulant increases bleeding. Anticoagulation alone is standard for stable CAD in AF patients without recent PCI.',
      });
    }

    if (onMultipleAntithrombotics && !hasPPI) {
      recommendations.push({
        priority: 'MODERATE',
        action: 'ADD',
        medication: 'Pantoprazole',
        recommendedDose: '40mg daily',
        rationale: 'Patient on multiple antithrombotic agents requires GI protection. PPI reduces GI bleeding risk by 50-70%.',
        evidence: GUIDELINES.AFIB_PCI_2020,
        monitoring: 'Start PPI for GI protection. Continue while on combination therapy. Avoid NSAIDs.',
        additionalNotes: '2020 ACC Expert Consensus recommends PPI for all patients on ≥2 antithrombotic agents.',
      });
    }
  }

  // ANTIPLATELET THERAPY FOR CAD/MI PATIENTS (without Atrial Fibrillation requiring anticoagulation)
  const hasCADorMIWithoutAF = (history.cad || history.priorMI) && !history.atrialFibrillation;

  if (hasCADorMIWithoutAF) {
    const hasAspirin = medications.some((m) => m.genericName.toLowerCase().includes('aspirin'));
    const hasP2Y12 = medications.some(
      (m) =>
        m.genericName.toLowerCase().includes('clopidogrel') ||
        m.genericName.toLowerCase().includes('prasugrel') ||
        m.genericName.toLowerCase().includes('ticagrelor')
    );

    // HIGH PRIORITY: Post-MI requires DAPT for 12 months
    if (history.priorMI && (!hasAspirin || !hasP2Y12)) {
      if (!hasAspirin) {
        recommendations.push({
          priority: 'HIGH',
          action: 'ADD',
          medication: 'Aspirin',
          recommendedDose: '81mg daily',
          rationale: 'Prior MI requires lifelong aspirin for secondary prevention; reduces recurrent MI and CV death by 25%',
          evidence: GUIDELINES.STEMI_2013,
          monitoring: 'Monitor for GI bleeding, easy bruising. Consider PPI if high GI bleeding risk.',
          additionalNotes: 'Aspirin is cornerstone of secondary prevention post-MI. Do not discontinue without cardiologist consultation.',
        });
      }

      if (!hasP2Y12) {
        recommendations.push({
          priority: 'HIGH',
          action: 'ADD',
          medication: 'Clopidogrel',
          recommendedDose: '75mg daily',
          rationale: 'Prior MI requires dual antiplatelet therapy (DAPT) with aspirin + P2Y12 inhibitor for at least 12 months post-MI',
          evidence: GUIDELINES.STEMI_2013,
          monitoring: 'Continue for 12 months post-MI, then reassess. Monitor for bleeding. Hold 5 days before elective surgery.',
          additionalNotes: 'DAPT reduces stent thrombosis and recurrent MI. After 12 months, typically continue aspirin alone long-term.',
        });
      }
    } else if (history.cad && !history.priorMI && !hasAspirin) {
      // MODERATE PRIORITY: Stable CAD requires aspirin
      recommendations.push({
        priority: 'MODERATE',
        action: 'ADD',
        medication: 'Aspirin',
        recommendedDose: '81mg daily',
        rationale: 'Stable CAD requires aspirin for secondary prevention; reduces CV events',
        evidence: GUIDELINES.STEMI_2013,
        monitoring: 'Monitor for GI bleeding, easy bruising. Consider PPI if high GI bleeding risk.',
        additionalNotes: 'Lifelong aspirin for CAD patients unless contraindicated. Do not discontinue without cardiologist consultation.',
      });
    }
  }

  return sortByPriority(recommendations);
}

function sortByPriority(recommendations: DomainRecommendation[]): DomainRecommendation[] {
  const priorityOrder = { HIGH: 1, MODERATE: 2, LOW: 3 };
  return recommendations.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
}
