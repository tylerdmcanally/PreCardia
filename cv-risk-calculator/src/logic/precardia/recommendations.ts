// PreCardia Recommendations Generator
// Based on 2024 ACC/AHA/ACCP/HRS Guidelines

import { PreCardiaData, RCRIResult, SurgicalRisk, FunctionalCapacityInfo, PreCardiaRecommendations } from '../../types/precardia.types';

export function generateRecommendations(
  data: PreCardiaData,
  rcri: RCRIResult,
  surgeryRisk: SurgicalRisk,
  functionalCapacityInfo: FunctionalCapacityInfo
): PreCardiaRecommendations {
  const recommendations: string[] = [];
  const testingRecommendations: string[] = [];
  const medicationRecommendations: string[] = [];

  // Active cardiac conditions check
  const hasActiveConditions = data.unstableAngina || data.decompensatedHF ||
                               data.significantArrhythmia || data.severeValvularDisease;
  const surgeryUrgency = data.surgeryUrgency || 'elective';
  const isEmergency = surgeryUrgency === 'emergency';
  const isUrgent = surgeryUrgency === 'urgent';
  const isTimeSensitive = surgeryUrgency === 'time-sensitive';
  const shouldDeferElectiveTesting = hasActiveConditions && surgeryUrgency === 'elective';

  // STEP 1: Active cardiac conditions
  if (data.unstableAngina) {
    recommendations.push(
      'URGENT: Active unstable angina or ACS present. Elective surgery should be DELAYED until cardiac condition is stabilized. Urgent/emergent surgery requires cardiology consultation and enhanced monitoring.'
    );
  }
  if (data.decompensatedHF) {
    recommendations.push(
      'URGENT: Decompensated heart failure present. Elective surgery should be DELAYED until heart failure is optimized. Urgent/emergent surgery requires cardiology consultation and aggressive diuresis/optimization.'
    );
  }
  if (data.significantArrhythmia) {
    recommendations.push(
      'URGENT: Significant arrhythmia present (symptomatic bradycardia, high-grade AV block, or hemodynamically unstable SVT). Elective surgery should be DELAYED until arrhythmia is controlled. Urgent/emergent surgery requires cardiology/EP consultation.'
    );
  }
  if (data.severeValvularDisease) {
    recommendations.push(
      'URGENT: Severe symptomatic valvular disease present. Elective surgery should be DELAYED. Consider valvular intervention before noncardiac surgery. Urgent/emergent surgery requires cardiology consultation and echocardiography.'
    );
  }

  if (data.valvularHeartDisease) {
    if (data.valvularSeverity === 'severe' && !data.severeValvularDisease) {
      recommendations.push(
        'Severe valvular disease identified. Ensure recent echocardiography and cardiology evaluation before proceeding with noncardiac surgery.'
      );
    } else if (data.valvularSeverity === 'moderate') {
      testingRecommendations.push(
        'Moderate valvular disease noted. Review most recent echocardiogram; consider repeat imaging if symptoms have progressed or study >1 year old.'
      );
    }
  }

  // Surgery urgency messages
  if (isEmergency) {
    recommendations.push(
      'Emergency surgery (<2 hours): proceed immediately; prioritize intraoperative and postoperative monitoring. Perform only tests that will change management without delaying incision.'
    );
  } else if (isUrgent) {
    recommendations.push(
      'Urgent surgery (2-24 hours): optimize as feasible without delaying necessary intervention. Order only tests that will change perioperative management in the limited window.'
    );
  } else if (isTimeSensitive) {
    recommendations.push(
      'Time-sensitive surgery (≤3 months): brief delay is acceptable when targeted evaluation or optimization can meaningfully reduce perioperative risk.'
    );
  }

  if (shouldDeferElectiveTesting) {
    recommendations.push(
      'Active cardiac condition identified in an elective case. Defer elective surgery and stabilize/optimize the condition before pursuing additional testing or proceeding.'
    );
  }

  // Recent interventions timing
  if (data.stentType === 'bms' && data.stentTiming) {
    if (data.stentTiming === 'lt2w' || data.stentTiming === '2to4w') {
      if (surgeryUrgency === 'elective' || surgeryUrgency === 'time-sensitive') {
        recommendations.push(
          'Bare-metal stent placed <4 weeks ago. Defer elective or time-sensitive noncardiac surgery until ≥30 days post-PCI when feasible; maintain dual antiplatelet therapy.'
        );
      } else {
        recommendations.push(
          'Bare-metal stent placed <4 weeks ago. Proceeding before 30 days carries high stent thrombosis risk—coordinate urgently with cardiology and maintain antiplatelet therapy if surgery cannot be delayed.'
        );
      }
    }
  } else if (data.stentType === 'des' && data.stentTiming) {
    if (data.stentTiming === 'lt2w' || data.stentTiming === '2to4w') {
      recommendations.push(
        'Drug-eluting stent placed <4 weeks ago. Avoid elective or time-sensitive surgery; if urgent/emergent, involve cardiology, maintain dual antiplatelet therapy, and weigh bleeding vs. thrombosis risk.'
      );
    } else if (data.stentTiming === '4to12w') {
      if (surgeryUrgency === 'elective' || surgeryUrgency === 'time-sensitive') {
        recommendations.push(
          'Drug-eluting stent placed 4-12 weeks ago. Prefer to delay elective or time-sensitive surgery until ≥3 months post-PCI; if surgery must proceed, continue aspirin, minimize interruption of the P2Y12 inhibitor, and coordinate closely with cardiology.'
        );
      } else {
        recommendations.push(
          'Drug-eluting stent placed 4-12 weeks ago. For urgent/emergent surgery, maintain aspirin, resume the P2Y12 inhibitor as soon as feasible, and engage cardiology to balance bleeding and thrombosis risks.'
        );
      }
    }
  }

  if (data.recentMI === 'yes' && data.miTiming) {
    if (data.miTiming === 'lt4w' || data.miTiming === '4to8w') {
      if (surgeryUrgency === 'elective' || surgeryUrgency === 'time-sensitive') {
        recommendations.push(
          'Myocardial infarction within the past 60 days. Elective or time-sensitive surgery should be deferred until ≥60 days post-MI when possible.'
        );
      } else {
        recommendations.push(
          'Myocardial infarction within the past 60 days. If surgery cannot be delayed, ensure intensive perioperative monitoring and cardiology involvement.'
        );
      }
    }
  }

  if (data.cabgTiming === 'lt6w') {
    if (surgeryUrgency === 'elective' || surgeryUrgency === 'time-sensitive') {
      recommendations.push(
        'Recent CABG (<6 weeks). Delay elective or time-sensitive surgery until ≥6 weeks post-CABG when feasible to reduce complications.'
      );
    } else {
      recommendations.push(
        'Recent CABG (<6 weeks). Proceeding early increases risk—engage cardiology/cardiothoracic surgery for optimization if non-elective surgery is unavoidable.'
      );
    }
  }

  if (data.tavrTiming === 'lt4w') {
    if (surgeryUrgency === 'elective' || surgeryUrgency === 'time-sensitive') {
      recommendations.push(
        'Transcatheter valve intervention <30 days. Defer elective or time-sensitive noncardiac surgery until ≥30 days if possible.'
      );
    } else {
      recommendations.push(
        'Transcatheter valve intervention <30 days. If urgent/emergent surgery is required, coordinate with the structural heart team for periprocedural planning.'
      );
    }
  }

  if (data.teer === 'yes' && data.teerTiming === 'lt4w') {
    recommendations.push(
      'Recent TEER (<4 weeks). If surgery is elective/time-sensitive, defer until ≥4 weeks post-procedure when feasible; if urgent, coordinate with structural heart team regarding anticoagulation and leaflet durability.'
    );
  }

  // Functional capacity assessment
  const functionalCapacity = functionalCapacityInfo.category || data.functionalCapacity || 'unknown';
  const allowAdditionalTesting = !(isEmergency || shouldDeferElectiveTesting);

  // STEP 2: Testing recommendations
  if (allowAdditionalTesting) {
    // ECG recommendations
    if (surgeryRisk.level === 'High' || surgeryRisk.level === 'Intermediate') {
      const needsECG = rcri.score >= 1 ||
                       data.hypertension ||
                       data.atrialFibrillation ||
                       data.ischemicHeartDisease ||
                       data.heartFailure ||
                       (data.age >= 65);

      if (needsECG) {
        testingRecommendations.push(
          'Preoperative ECG recommended (obtain if not performed within 3 months).'
        );
      }
    }

    // Stress testing recommendations
    const qualifiesForStressEvaluation =
      (surgeryRisk.level === 'High' || surgeryRisk.level === 'Intermediate') &&
      (functionalCapacity === 'poor' || functionalCapacity === 'unknown');

    if (qualifiesForStressEvaluation) {
      const capacityDescriptor = functionalCapacity === 'poor'
        ? 'poor (<4 METs) functional capacity'
        : 'unknown functional capacity';

      if (rcri.score >= 2) {
        testingRecommendations.push(
          `Consider preoperative stress testing (exercise or pharmacologic) given ${capacityDescriptor} and elevated cardiac risk (RCRI ≥2).`
        );
      } else if (rcri.score >= 1 || data.ischemicHeartDisease || data.heartFailure) {
        testingRecommendations.push(
          `Consider preoperative stress testing (exercise or pharmacologic) given ${capacityDescriptor} plus additional clinical risk factors.`
        );
      } else {
        testingRecommendations.push(
          `Stress testing is not recommended: despite ${capacityDescriptor}, overall perioperative cardiac risk is low (RCRI 0 and no high-risk features). Optimize medical therapy and proceed without additional testing.`
        );
      }
    }

    if (surgeryRisk.level === 'Low') {
      testingRecommendations.push(
        'Stress testing is not recommended for low-risk (<1% MACE) surgical procedures per 2024 guidelines.'
      );
    }

    // Echocardiography recommendations
    if (data.heartFailure) {
      testingRecommendations.push(
        'Consider preoperative echocardiography to assess left ventricular function if symptoms have worsened or no study within the last year.'
      );
    }

    // Biomarker recommendations
    if (data.bnp || data.ntproBNP || data.troponin) {
      if (data.bnp && data.bnp >= 92) {
        testingRecommendations.push(
          `BNP ≥92 pg/mL (${data.bnp} pg/mL) exceeds guideline threshold and suggests higher perioperative cardiac risk. Consider further optimization and enhanced surveillance.`
        );
      }
      if (data.ntproBNP && data.ntproBNP >= 300) {
        testingRecommendations.push(
          `NT-proBNP ≥300 pg/mL (${data.ntproBNP} pg/mL) is associated with increased perioperative cardiac risk. Optimize heart failure management and plan enhanced monitoring.`
        );
      }
      if (data.troponin && data.troponinUpperLimit) {
        if (data.troponin >= data.troponinUpperLimit) {
          testingRecommendations.push(
            `Troponin ${data.troponin} ng/mL exceeds the provided 99th percentile (${data.troponinUpperLimit} ng/mL). Evaluate for myocardial injury/ischemia before elective surgery proceeds.`
          );
        }
      }
    } else {
      if (surgeryRisk.level === 'High' || surgeryRisk.level === 'Intermediate') {
        const shouldMeasureBiomarkers =
          (data.age >= 65) ||
          (data.age >= 45 && (rcri.score >= 1 || data.hypertension || data.diabetesInsulin)) ||
          (data.ischemicHeartDisease || data.heartFailure) ||
          ((functionalCapacity === 'poor' || functionalCapacity === 'unknown') && rcri.score >= 2);

        if (shouldMeasureBiomarkers) {
          testingRecommendations.push(
            'Consider measuring BNP/NT-proBNP or troponin for additional risk stratification per 2024 guidelines.'
          );
        }
      }
    }

    // CCTA recommendation
    if ((surgeryRisk.level === 'High' || surgeryRisk.level === 'Intermediate') &&
        functionalCapacity === 'poor' &&
        (rcri.score >= 2 || data.ischemicHeartDisease) &&
        !data.unstableAngina) {
      testingRecommendations.push(
        'Consider coronary CT angiography (CCTA) as an alternative to stress testing for patients with poor functional capacity who cannot exercise, per 2024 guidelines.'
      );
    }
  }

  // Medication management
  if (data.betaBlocker) {
    medicationRecommendations.push(
      'Continue chronic beta-blocker therapy perioperatively. Avoid initiating on the day of surgery; if new therapy is indicated, titrate at least 7 days in advance.'
    );
  } else if ((rcri.score >= 2 || data.ischemicHeartDisease) &&
             (surgeryUrgency === 'elective' || surgeryUrgency === 'time-sensitive')) {
    medicationRecommendations.push(
      'Beta-blocker initiation may be reasonable for elevated-risk patients, but begin ≥7 days before surgery to allow dose titration and tolerance assessment. Do not start within 24 hours of surgery.'
    );
  }

  if (data.statin) {
    medicationRecommendations.push('Continue statin therapy perioperatively.');
  } else if (surgeryRisk.description && /vascular/i.test(surgeryRisk.description)) {
    medicationRecommendations.push(
      'Consider initiating statin therapy prior to vascular surgery if time permits, consistent with guideline recommendations for atherosclerotic risk reduction.'
    );
  }

  if (data.aceARB) {
    if (data.heartFailure) {
      medicationRecommendations.push(
        'Continue ACE inhibitor/ARB used for heart failure unless contraindications arise; monitor for perioperative hypotension.'
      );
    } else {
      medicationRecommendations.push(
        'For ACE inhibitor/ARB used solely for hypertension, withhold the morning of surgery to reduce intraoperative hypotension risk; resume when hemodynamically stable.'
      );
    }
  }

  if (data.sglt2i) {
    medicationRecommendations.push(
      'Hold SGLT2 inhibitor 3 days before surgery (4 days for ertugliflozin) to mitigate risk of perioperative euglycemic ketoacidosis; restart when eating reliably.'
    );
  }

  if (data.anticoagulant) {
    medicationRecommendations.push(
      'Coordinate perioperative anticoagulant management with the prescribing team; follow guideline hold intervals (warfarin ~5 days, DOACs 24-72 hours based on renal function and bleeding risk) and reserve bridging for high thromboembolic risk.'
    );
  }

  if (data.antiplatelet) {
    medicationRecommendations.push(
      'Review bleeding versus thrombosis risk when adjusting antiplatelet therapy; continue aspirin for secondary prevention when feasible and coordinate P2Y12 interruption with cardiology.'
    );
  }

  // Cardiology consultation
  const needsCardiologyConsult = hasActiveConditions ||
                                 rcri.score >= 3 ||
                                 data.recentMI === 'yes' ||
                                 data.pulmonaryHypertension ||
                                 data.congenitalHeartDisease ||
                                 (data.valvularHeartDisease && data.valvularSeverity === 'severe') ||
                                 data.hasCIED;

  if (needsCardiologyConsult) {
    recommendations.push(
      'Consider cardiology consultation for perioperative optimization given elevated cardiac risk or complex cardiac condition.'
    );
  }

  // Functional capacity recommendations
  if (functionalCapacity === 'poor' && surgeryRisk.level !== 'Low') {
    recommendations.push(
      'Poor functional capacity (<4 METs) identified. Consider optimization of medical therapy and close perioperative monitoring. Enhanced surveillance may be warranted.'
    );
  }

  if (typeof data.frailtyScore === 'number') {
    if (data.frailtyScore >= 6) {
      recommendations.push('Moderate to severe frailty noted (Clinical Frailty Scale ≥6). Engage geriatrics or perioperative medicine team for optimization and postoperative support planning.');
    } else if (data.frailtyScore >= 4) {
      recommendations.push('Mild frailty identified (Clinical Frailty Scale 4-5). Address nutrition, mobility, and social supports prior to surgery.');
    }
  }

  // Postoperative monitoring
  if (rcri.score >= 2 || surgeryRisk.level === 'High' || functionalCapacity === 'poor') {
    recommendations.push(
      'Enhanced postoperative cardiac monitoring (troponin, ECG) recommended for 24-48 hours for elevated-risk patients per 2024 guidelines.'
    );
  }

  // Testing principles
  const testingPrinciples = [
    'Perform tests only when results will change perioperative management.',
    'Stress testing: reserve for poor or unknown functional capacity with elevated risk or other independent indications (e.g., new ischemic symptoms); do NOT test low-risk, asymptomatic patients.',
    'Transthoracic echocardiography: obtain only when symptoms or signs suggest left ventricular dysfunction or valvular disease without recent assessment.',
    'Cardiac biomarkers (BNP/NT-proBNP, troponin): consider for intermediate/high-risk surgery with age ≥65, known CVD, or poor functional capacity with RCRI ≥2.',
    'Coronary angiography: reserve for patients meeting criteria for catheterization independent of noncardiac surgery (e.g., unstable angina, acute MI).'
  ];

  return {
    general: recommendations,
    testing: testingRecommendations,
    medications: medicationRecommendations,
    testingPrinciples
  };
}
