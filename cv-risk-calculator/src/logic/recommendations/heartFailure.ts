import { PatientData, ClinicalCalculations, DomainRecommendation } from '../../types';
import { GUIDELINES } from '../../data/guidelines';
import { getSafetyRecommendationsForDomain, hasMRASafetyHold } from '../safety';
import { getMedicationsByCategory, hasMedicationInCategory } from '../safety/utils';

export function generateHeartFailureRecommendations(
  patientData: PatientData,
  calculations: ClinicalCalculations
): DomainRecommendation[] {
  const recommendations: DomainRecommendation[] = [
    ...getSafetyRecommendationsForDomain('HEART_FAILURE', patientData, calculations),
  ];
  const { history, medications, demographics } = patientData;
  const { egfr } = calculations;
  const potassiumValue = patientData.labs.potassium ?? 0;
  const mraOnHold = hasMRASafetyHold(patientData, calculations);
  const onDialysis = Boolean(history.dialysis);

  if (!history.heartFailure) {
    return recommendations;
  }

  const ejectionFraction = history.ejectionFraction || 0;
  const isHFrEF = ejectionFraction > 0 && ejectionFraction <= 40;
  const isHFmrEF = ejectionFraction > 40 && ejectionFraction <= 49;

  // Check current medications
  const hasACEI = hasMedicationInCategory(medications, 'ACE Inhibitor');
  const hasARB = hasMedicationInCategory(medications, 'ARB');
  const hasARNI = hasMedicationInCategory(medications, 'ARNI');
  const hasBetaBlocker = hasMedicationInCategory(medications, 'Beta Blocker');
  const hasMRA = hasMedicationInCategory(medications, 'MRA');
  const hasSGLT2i = hasMedicationInCategory(medications, 'Diabetes - SGLT2i');
  const hasHydralazine = medications.some((m) => m.genericName.toLowerCase().includes('hydralazine'));
  const hasIsosorbide = medications.some(
    (m) =>
      m.genericName.toLowerCase().includes('isosorbide dinitrate') ||
      m.genericName.toLowerCase().includes('isosorbide mononitrate')
  );
  const hasRAASi = hasARNI || hasACEI || hasARB;

  // Only provide HFrEF recommendations if we have an EF
  if (!isHFrEF) {
    if (ejectionFraction === 0) {
      recommendations.push({
        priority: 'HIGH',
        action: 'EVALUATE',
        medication: 'N/A',
        recommendedDose: 'N/A',
        rationale: 'Heart failure diagnosis requires echocardiogram to classify by ejection fraction (HFrEF ≤40%, HFmrEF 41-49%, HFpEF ≥50%) and guide GDMT',
        evidence: GUIDELINES.HF_2022,
        monitoring: 'Order transthoracic echocardiogram with assessment of LVEF, chamber sizes, valvular function, and diastolic parameters',
        additionalNotes: 'EF classification determines eligibility for four-pillar GDMT. Consider BNP/NT-proBNP if diagnosis uncertain.',
      });
      return sortByPriority(recommendations);
    }

    if (isHFmrEF) {
      if (!hasSGLT2i && egfr >= 20 && !onDialysis) {
        recommendations.push({
          priority: 'HIGH',
          action: 'ADD',
          medication: 'Dapagliflozin',
          recommendedDose: '10mg daily',
          rationale: `HFmrEF (EF ${ejectionFraction}%): SGLT2 inhibitors carry Class 2a recommendation to reduce HF admissions and CV death.`,
          evidence: GUIDELINES.HF_2022,
          monitoring: 'Monitor renal function and volume status; educate on genital mycotic infection risk.',
        });
      } else if (!hasSGLT2i && onDialysis) {
        recommendations.push({
          priority: 'HIGH',
          action: 'DEFER',
          medication: 'SGLT2i (Dapagliflozin/Empagliflozin)',
          recommendedDose: 'N/A',
          rationale: 'SGLT2 inhibitors have no evidence or labeling support in dialysis-dependent patients; avoid initiation.',
          evidence: GUIDELINES.HF_2022,
          monitoring: 'Optimize other HF therapies (ARNI/ACEI/ARB, beta blocker, MRA if safe) and reassess if off dialysis.',
        });
      }
      if (!hasRAASi) {
        recommendations.push({
          priority: 'MODERATE',
          action: 'CONSIDER',
          medication: 'Sacubitril/Valsartan or ACE-I/ARB',
          recommendedDose: 'Start low, uptitrate every 2-4 weeks',
          rationale: `HFmrEF (EF ${ejectionFraction}%): RAAS inhibition (ARNI/ACE-I/ARB) may improve outcomes (Class 2b).`,
          evidence: GUIDELINES.HF_2022,
          monitoring: 'Monitor renal function and potassium 1-2 weeks after initiation or dose change.',
        });
      }
      if (!hasBetaBlocker) {
        recommendations.push({
          priority: 'MODERATE',
          action: 'CONSIDER',
          medication: 'Evidence-based beta blocker',
          recommendedDose: 'Carvedilol, metoprolol succinate, or bisoprolol per HFrEF titration',
          rationale: `HFmrEF (EF ${ejectionFraction}%): Beta-blockers carry Class 2b recommendation; follow HFrEF titration strategy.`,
          evidence: GUIDELINES.HF_2022,
          monitoring: 'Check HR/BP at each titration visit; target resting HR 50-60 bpm if tolerated.',
        });
      }
      if (!hasMRA && egfr >= 30 && potassiumValue < 5 && !mraOnHold) {
        recommendations.push({
          priority: 'MODERATE',
          action: 'CONSIDER',
          medication: 'Spironolactone or Eplerenone',
          recommendedDose: 'Start 12.5-25mg daily',
          rationale: `HFmrEF (EF ${ejectionFraction}%): MRA therapy may reduce hospitalizations (Class 2b).`,
          evidence: GUIDELINES.HF_2022,
          monitoring: 'Check BMP at 3 days, 1 week, then monthly for 3 months; hold if K+ >5.5.',
        });
      }
      recommendations.push({
        priority: 'LOW',
        action: 'MONITOR',
        medication: 'Risk factor optimization',
        recommendedDose: 'N/A',
        rationale: 'HFmrEF outcomes improve with aggressive BP (<130/80), weight, diabetes, and AF management.',
        evidence: GUIDELINES.HF_2022,
      });
    } else {
      // HFpEF
      if (!hasSGLT2i && egfr >= 20 && !onDialysis) {
        recommendations.push({
          priority: 'HIGH',
          action: 'ADD',
          medication: 'Empagliflozin',
          recommendedDose: '10mg daily',
          rationale: `HFpEF (EF ${ejectionFraction}%): SGLT2 inhibitors (Class 2a) reduce HF hospitalizations (EMPEROR-Preserved, DELIVER).`,
          evidence: GUIDELINES.HF_2022,
          monitoring: 'Monitor renal function and volume status; counsel on transient eGFR dip.',
        });
      } else if (!hasSGLT2i && onDialysis) {
        recommendations.push({
          priority: 'HIGH',
          action: 'DEFER',
          medication: 'SGLT2i (Empagliflozin/Dapagliflozin)',
          recommendedDose: 'N/A',
          rationale: 'SGLT2 inhibitors are not recommended in ESKD on dialysis; focus on volume/BP control and GDMT pillars that remain safe.',
          evidence: GUIDELINES.HF_2022,
          monitoring: 'Reassess candidacy only if kidney function recovers above eGFR threshold.',
        });
      }
      if (!hasMRA && egfr >= 30 && potassiumValue < 5 && !mraOnHold) {
        recommendations.push({
          priority: 'MODERATE',
          action: 'CONSIDER',
          medication: 'Spironolactone',
          recommendedDose: '12.5-25mg daily',
          rationale: 'HFpEF patients with elevated BNP benefit from MRA to reduce hospitalizations (TOPCAT).',
          evidence: GUIDELINES.HF_2022,
          monitoring: 'BMP at 3 days, 1 week, then monthly x3; discontinue if K+ >5.5 or eGFR <30.',
        });
      }
      recommendations.push({
        priority: 'MODERATE',
        action: 'CONSIDER',
        medication: 'BP, weight, rhythm management',
        recommendedDose: 'N/A',
        rationale: 'HFpEF care focuses on BP <130/80, weight loss, diuretics for congestion, and AF rate/rhythm control.',
        evidence: GUIDELINES.HF_2022,
        monitoring: 'Coordinate diuretic titration, sleep apnea screening, and obesity interventions with primary team.',
      });
    }

    return sortByPriority(recommendations);
  }


  // HIGH PRIORITY: ARNI (Entresto) as FIRST-LINE RASi per 2022 Guidelines (Class 1a)
  if (!hasARNI && !hasACEI && !hasARB && egfr >= 30) {
    recommendations.push({
      priority: 'HIGH',
      action: 'ADD',
      medication: 'Sacubitril/Valsartan (Entresto)',
      recommendedDose: 'Start 24/26mg BID (or 49/51mg BID if SBP >100), target 97/103mg BID',
      rationale: `HFrEF (EF ${ejectionFraction}%): ARNi is first-line RASi therapy per 2022 AHA/ACC/HFSA guidelines (Class 1a); reduces CV death and HF hospitalization by 20% vs ACE-I`,
      evidence: '2022 AHA/ACC/HFSA Heart Failure Guidelines',
      monitoring: 'BP and renal function at 1-2 weeks after initiation and dose changes; monitor for symptomatic hypotension',
      additionalNotes: 'PARADIGM-HF trial: 20% reduction in CV mortality. Part of four-pillar GDMT. Titrate every 2-4 weeks as tolerated.',
    });
  }

  // HIGH PRIORITY: Switch from ACE-I to ARNI requires DISCONTINUING ACE-I first
  if (!hasARNI && hasACEI && egfr >= 30) {
    const aceInhibitor = getMedicationsByCategory(medications, ['ACE Inhibitor'])[0];

    // Step 1: DISCONTINUE ACE-I (separate prominent recommendation)
    recommendations.push({
      priority: 'HIGH',
      action: 'DISCONTINUE',
      medication: `${aceInhibitor?.genericName || 'ACE Inhibitor'} (current medication)`,
      recommendedDose: 'N/A',
      rationale: `HFrEF (EF ${ejectionFraction}%): Must STOP ACE-I to switch to Entresto (ARNI), which is superior per 2022 guidelines but CANNOT be given with ACE-I due to life-threatening angioedema risk`,
      evidence: '2022 AHA/ACC/HFSA Heart Failure Guidelines',
      monitoring: 'CRITICAL: STOP ACE-I now. WAIT 36 HOURS before starting Entresto. Document time of last ACE-I dose.',
      additionalNotes: 'Angioedema can be fatal. ACE-I must be completely washed out before starting Entresto. See separate recommendation to ADD Entresto after washout.',
    });

    // Step 2: ADD Entresto (after washout)
    recommendations.push({
      priority: 'HIGH',
      action: 'ADD',
      medication: 'Sacubitril/Valsartan (Entresto)',
      recommendedDose: 'Start 24/26mg BID (or 49/51mg BID if SBP >100), target 97/103mg BID',
      rationale: `HFrEF (EF ${ejectionFraction}%): ARNI (Entresto) is preferred FIRST-LINE therapy per 2022 guidelines; 20% reduction in CV mortality vs ACE-I`,
      evidence: '2022 AHA/ACC/HFSA Heart Failure Guidelines',
      monitoring: `Start Entresto 36+ hours AFTER last ACE-I dose. Check BP and renal function at 1-2 weeks. Monitor for hypotension, hyperkalemia.`,
      additionalNotes: 'PARADIGM-HF trial: Entresto superior to enalapril for HFrEF. Must have stopped ACE-I ≥36 hours prior. Uptitrate every 2-4 weeks as tolerated.',
    });
  } else if (!hasARNI && hasARB && !hasACEI && egfr >= 30) {
    const arb = getMedicationsByCategory(medications, ['ARB'])[0];
    recommendations.push({
      priority: 'HIGH',
      action: 'SWITCH',
      medication: 'Sacubitril/Valsartan (Entresto)',
      recommendedDose: 'Start 24/26mg BID (or 49/51mg BID if SBP >100), target 97/103mg BID',
      rationale: `HFrEF (EF ${ejectionFraction}%): ARNi preferred over ARB per 2022 guidelines (Class 1a); superior mortality and hospitalization benefit`,
      evidence: '2022 AHA/ACC/HFSA Heart Failure Guidelines',
      monitoring: `DISCONTINUE ${arb?.genericName || 'ARB'} and start Entresto on next day (no washout needed for ARB). Check BP and renal function at 1-2 weeks.`,
      additionalNotes: 'PARADIGM-HF: 20% reduction in CV mortality. ARB can be stopped and Entresto started next day without washout period.',
    });
  }

  // HIGH PRIORITY: Beta-blocker for HFrEF (Pillar 2 of GDMT)
  if (!hasBetaBlocker) {
    recommendations.push({
      priority: 'HIGH',
      action: 'ADD',
      medication: 'Carvedilol',
      recommendedDose: 'Start 3.125mg BID, target 25mg BID (50mg BID if >85kg)',
      rationale: `HFrEF (EF ${ejectionFraction}%): Beta-blocker is second pillar of four-pillar GDMT per 2022 guidelines; reduces CV death by 34%`,
      evidence: '2022 AHA/ACC/HFSA Heart Failure Guidelines',
      monitoring: 'Start low, go slow; check HR and BP at each titration; increase dose every 2 weeks. Monitor for bradycardia, hypotension.',
      additionalNotes: 'Alternative: Metoprolol succinate 12.5-25mg daily, target 200mg daily. CONTRAINDICATIONS: Carvedilol contraindicated in asthma; use cardioselective beta-blocker (metoprolol succinate) instead. Avoid if severe bradycardia (<50 bpm), 2nd/3rd degree AV block, or cardiogenic shock.',
    });
  }

  // HIGH PRIORITY: MRA (spironolactone/eplerenone) for HFrEF (Pillar 3 of GDMT)
  // CONTRAINDICATION CHECK: MRA with hyperkalemia or severe renal dysfunction
  if (!hasMRA && (potassiumValue >= 5.0 || (egfr > 0 && egfr < 30))) {
    let contraindicationReason = '';
    if (potassiumValue >= 5.5) {
      contraindicationReason = `CONTRAINDICATED: K+ ${potassiumValue.toFixed(1)} mEq/L (absolute contraindication ≥5.5). Risk of life-threatening hyperkalemia.`;
    } else if (potassiumValue >= 5.0) {
      contraindicationReason = `CAUTION: K+ ${potassiumValue.toFixed(1)} mEq/L. MRA initiation not recommended per 2022 guidelines until K+ <5.0.`;
    } else if (egfr > 0 && egfr < 30) {
      contraindicationReason = `CONTRAINDICATED: eGFR ${egfr.toFixed(0)} mL/min/1.73m2 <30. Risk of severe hyperkalemia with MRA.`;
    }

    recommendations.push({
      priority: 'HIGH',
      action: 'DEFER',
      medication: 'MRA (Spironolactone/Eplerenone)',
      recommendedDose: 'N/A',
      rationale: `HFrEF requires MRA as part of four-pillar GDMT, but ${contraindicationReason}`,
      evidence: '2022 AHA/ACC/HFSA Heart Failure Guidelines',
      monitoring: potassiumValue >= 5.0
        ? 'Optimize other GDMT (ARNI, beta-blocker, SGLT2i). Recheck K+ after diuretic optimization and dietary counseling (avoid K+ supplements, salt substitutes). Reassess MRA when K+ <5.0.'
        : 'Optimize other three pillars of GDMT. Consider nephrology referral for advanced CKD. Reassess MRA candidacy if eGFR improves with SGLT2i therapy.',
      additionalNotes: 'MRA significantly reduces mortality in HFrEF but requires careful K+ and renal monitoring. Consider K+ binder (patiromer) if persistent hyperkalemia prevents MRA use.',
    });
  } else if (!hasMRA && egfr >= 30 && potassiumValue < 5.0 && !mraOnHold) {
    recommendations.push({
      priority: 'HIGH',
      action: 'ADD',
      medication: 'Spironolactone',
      recommendedDose: 'Start 12.5-25mg daily, target 25-50mg daily',
      rationale: `HFrEF (EF ${ejectionFraction}%): MRA is third pillar of four-pillar GDMT; reduces mortality by 30% in symptomatic HF`,
      evidence: '2022 AHA/ACC/HFSA Heart Failure Guidelines',
      monitoring: 'CRITICAL: Check K+ and Cr at 3 days, 1 week, and monthly for 3 months. HOLD if K+ >5.5. Dose reduce if K+ 5.0-5.5.',
      additionalNotes: 'RALES trial: 30% mortality reduction. CONTRAINDICATIONS: K+ ≥5.5, eGFR <30. Eplerenone alternative if gynecomastia. Avoid K+ supplements, salt substitutes, NSAIDs.',
    });
  }

  // HIGH PRIORITY: SGLT2i for HFrEF (Pillar 4 of GDMT - Class 1a regardless of diabetes)
  if (!hasSGLT2i) {
    if (onDialysis) {
      recommendations.push({
        priority: 'HIGH',
        action: 'DEFER',
        medication: 'SGLT2i (Dapagliflozin/Empagliflozin)',
        recommendedDose: 'N/A',
        rationale:
          'HFrEF pillar therapy includes SGLT2i, but these agents are not studied or labeled for patients on dialysis; avoid initiation.',
        evidence: '2022 AHA/ACC/HFSA Heart Failure Guidelines',
        monitoring:
          'Optimize ARNI/ACEI/ARB, beta-blocker, and MRA (if safe) instead. Reassess only if kidney function recovers above eGFR 20.',
      });
    } else if (egfr > 0 && egfr < 20) {
      recommendations.push({
        priority: 'HIGH',
        action: 'DEFER',
        medication: 'SGLT2i (Dapagliflozin/Empagliflozin)',
        recommendedDose: 'N/A',
        rationale: `HFrEF requires SGLT2i as part of four-pillar GDMT, but NOT INDICATED: eGFR ${egfr.toFixed(0)} mL/min/1.73m2 <20. SGLT2i not indicated for HF when eGFR <20.`,
        evidence: '2022 AHA/ACC/HFSA Heart Failure Guidelines',
        monitoring: 'Optimize other three pillars of GDMT (ARNI, beta-blocker, MRA). Consider nephrology referral. Reassess SGLT2i if eGFR improves.',
        additionalNotes: 'SGLT2i significantly reduces HF hospitalization and CV death but efficacy/safety not established in severe CKD (eGFR <20) for HF indication.',
      });
    } else if (egfr >= 20) {
      recommendations.push({
        priority: 'HIGH',
        action: 'ADD',
        medication: 'Dapagliflozin',
        recommendedDose: '10mg daily',
        rationale: `HFrEF (EF ${ejectionFraction}%): SGLT2i is fourth pillar of GDMT per 2022 guidelines (Class 1a); reduces CV death and HF hospitalization by 26% regardless of diabetes status`,
        evidence: '2022 AHA/ACC/HFSA Heart Failure Guidelines',
        monitoring: 'Monitor for genital mycotic infections (10-15%); eGFR may dip 3-5 points initially (expected hemodynamic effect, beneficial long-term). Monitor for volume depletion, DKA (rare).',
        additionalNotes: 'DAPA-HF trial: benefit in diabetic AND non-diabetic patients. Empagliflozin also Class 1a. Can use down to eGFR 20. CONTRAINDICATIONS: Type 1 diabetes (not FDA-approved), history of DKA. Stop 3 days before surgery to prevent DKA.',
      });
    }
  }

  if (
    isHFrEF &&
    demographics.race === 'black' &&
    (hasARNI || hasACEI || hasARB) &&
    hasBetaBlocker &&
    hasMRA &&
    !hasHydralazine &&
    !hasIsosorbide
  ) {
    recommendations.push({
      priority: 'HIGH',
      action: 'ADD',
      medication: 'Hydralazine + Isosorbide dinitrate',
      recommendedDose: 'Hydralazine 37.5mg + Isosorbide dinitrate 20mg TID (BiDil), uptitrate as tolerated',
      rationale:
        'Black patients with HFrEF and persistent symptoms derive mortality benefit from hydralazine/isosorbide layered on top of GDMT (Class I).',
      evidence: GUIDELINES.HF_2022,
      monitoring: 'Monitor for hypotension and headaches; reinforce adherence to thrice-daily dosing.',
      additionalNotes: 'A-HeFT trial demonstrated 43% mortality reduction with hydralazine/isosorbide in this population.',
    });
  }

  if (isHFrEF && ejectionFraction <= 35 && (hasARNI || hasACEI || hasARB) && hasBetaBlocker) {
    recommendations.push({
      priority: 'MODERATE',
      action: 'EVALUATE',
      medication: 'ICD/CRT candidacy',
      recommendedDose: 'N/A',
      rationale:
        'EF ≤35% after guideline-directed therapy warrants reassessment for ICD and/or CRT to reduce sudden cardiac death per ACC/AHA.',
      evidence: GUIDELINES.HF_2022,
      monitoring: 'Refer to electrophysiology once on GDMT ≥3 months; gather NYHA class and QRS duration to guide decision.',
      additionalNotes: 'Document shared decision-making and repeat echocardiogram after optimization if not yet performed.',
    });
  }

  return sortByPriority(recommendations);
}

function sortByPriority(recs: DomainRecommendation[]): DomainRecommendation[] {
  const priorityOrder = { HIGH: 0, MODERATE: 1, LOW: 2 };
  return recs.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
}
