import test from 'node:test';
import assert from 'node:assert/strict';
import type { PreCardiaData } from '../src/types/precardia.types';
import { calculateRCRI, calculateDASI, assessFunctionalCapacity, getDASIFunctionalCapacity, calculateEGFR } from '../src/logic/precardia/calculations';
import { getSurgicalRisk, getPCIGuidance } from '../src/logic/precardia/guideline';
import { generateRecommendations } from '../src/logic/precardia/recommendations';
import { generatePreCardiaReport } from '../src/logic/precardia/reportGenerator';

function patient(overrides: Partial<PreCardiaData> = {}): PreCardiaData {
  return {
    age: 60, sex: 'female', weight: 0, height: 0, unitSystem: 'metric',
    unstableAngina: false, decompensatedHF: false, significantArrhythmia: false, severeValvularDisease: false,
    ischemicHeartDisease: false, heartFailure: false, cerebrovascularDisease: false, diabetesInsulin: false, renalDysfunction: false,
    hypertension: false, atrialFibrillation: false, diabetes: false, ckd: false, copd: false, sleepApnea: false, obesity: false, currentSmoker: false,
    recentMI: 'no', cabg: 'no', tavrTavi: 'no', betaBlocker: false, statin: false, aceARB: false, sglt2i: false, anticoagulant: false,
    functionalCapacity: 'moderate', useDASI: false, surgeryType: 'intermediate-orthopedic', surgeryUrgency: 'elective',
    ...overrides,
  };
}
function advice(overrides: Partial<PreCardiaData> = {}) {
  const data = patient(overrides);
  const result = generateRecommendations(data, calculateRCRI(data), getSurgicalRisk(data), assessFunctionalCapacity(data));
  return { general: result.general.join('\n'), testing: result.testing.join('\n'), meds: result.medications.join('\n') };
}
const elevated: Partial<PreCardiaData> = { ischemicHeartDisease: true, heartFailure: true, functionalCapacity: 'poor' };
const pci = (overrides: Partial<PreCardiaData>) => getPCIGuidance(patient({ stentType: 'des', antiplateletInterruption: 'yes', ...overrides })).join('\n');

// Tables 4–5, Sections 3.2 / 4.3 / 4.5.
test('DASI complete questionnaire has the published maximum of 58.2', () => {
  const answers = Object.fromEntries(Array.from({ length: 12 }, (_, i) => [`dasi${i + 1}`, true]));
  assert.equal(calculateDASI(answers).score, 58.2);
});
for (const score of [0, 10.25, 34, 34.01, 58.2]) {
  test(`DASI criterion at ${score} is independent of formula METs`, () => {
    const result = { score, vo2peak: 0.43 * score + 9.6, mets: (0.43 * score + 9.6) / 3.5 };
    assert.equal(getDASIFunctionalCapacity(result).category === 'poor', score <= 34);
  });
}
test('unreviewed DASI is unknown, including when answers would score highly', () => {
  assert.equal(assessFunctionalCapacity(patient({ useDASI: true, dasi5: true, dasi8: true, dasi12: true })).category, 'unknown');
  assert.equal(assessFunctionalCapacity(patient({ useDASI: true, dasiCompleted: true })).category, 'poor');
});
test('DASI poor criterion is honored in full report even when estimated METs exceed four', () => {
  const report = generatePreCardiaReport(patient({ ...elevated, useDASI: true, dasiCompleted: true, dasi1: true, dasi2: true, dasi3: true, dasi4: true, dasi5: true }));
  assert.match(report, /Poor by DASI/);
  assert.match(report, /stress testing OR CCTA may be considered/);
  assert.doesNotMatch(report, /Median Score|APPROPRIATE \(A\)|2024 ACC\/AHA Appropriate Use/);
});
for (const [creatinine, score] of [[1.99, 0], [2, 1], [2.01, 1]]) {
  test(`RCRI renal criterion follows Table 4 at creatinine ${creatinine}`, () => assert.equal(calculateRCRI(patient({ creatinine })).score, score));
}
test('RCRI counts each factor once and has a maximum of six', () => {
  assert.equal(calculateRCRI(patient({ ischemicHeartDisease: true, recentMI: 'yes', unstableAngina: true, heartFailure: true, decompensatedHF: true, cerebrovascularDisease: true, diabetesInsulin: true, renalDysfunction: true, creatinine: 4, surgeryType: 'high-aortic' })).score, 6);
});
test('unlisted procedure RCRI factor can be confirmed, or remains provisional', () => {
  assert.equal(calculateRCRI(patient({ surgeryType: 'other', otherRcriHighRisk: 'yes' })).score, 1);
  assert.match(generatePreCardiaReport(patient({ surgeryType: 'other' })), /score is provisional/);
  assert.match(advice({ surgeryType: 'other' }).testing, /Unknown information is not evidence of low risk/);
});

// Stress/CCTA: all required conditions, with no bypass through a second engine.
for (const surgeryType of ['low-cataract', 'intermediate-orthopedic', 'high-aortic']) {
  for (const functionalCapacity of ['poor', 'unknown', 'moderate'] as const) {
    test(`ischemia testing gate: ${surgeryType}, ${functionalCapacity}`, () => {
      const output = advice({ ...elevated, surgeryType, functionalCapacity });
      assert.equal(output.testing.includes('stress testing OR CCTA may be considered'), surgeryType !== 'low-cataract' && functionalCapacity !== 'moderate');
    });
  }
}
test('one RCRI point with poor capacity does not qualify for routine ischemia screening', () => {
  assert.doesNotMatch(advice({ ischemicHeartDisease: true, functionalCapacity: 'poor' }).testing, /stress testing OR CCTA may be considered/);
});
for (const risk of [0, 0.99, 1, 2]) {
  test(`external validated estimate ${risk}% is used with procedure and capacity gates`, () => {
    assert.equal(advice({ riskCalculator: 'gupta-mica', estimatedMaceRisk: risk, functionalCapacity: 'unknown' }).testing.includes('stress testing OR CCTA may be considered'), risk >= 1);
  });
}
for (const surgeryUrgency of ['emergency', 'urgent', 'time-sensitive', 'elective'] as const) {
  for (const condition of ['unstableAngina', 'decompensatedHF', 'significantArrhythmia', 'severeValvularDisease'] as const) {
    test(`no routine ischemia testing for ${condition} during ${surgeryUrgency} surgery`, () => {
      const output = advice({ ...elevated, [condition]: true, surgeryUrgency });
      assert.match(output.testing, /Do not pursue routine preoperative stress testing or CCTA/);
      assert.doesNotMatch(output.testing, /stress testing OR CCTA may be considered/);
    });
  }
}
test('urgent and emergency surgery do not get routine stress/CCTA even without active illness', () => {
  for (const surgeryUrgency of ['urgent', 'emergency'] as const) assert.doesNotMatch(advice({ ...elevated, surgeryUrgency }).testing, /stress testing OR CCTA may be considered/);
});
test('stable HF does not trigger annual routine echo, but new dyspnea does trigger evaluation', () => {
  assert.match(advice({ heartFailure: true }).testing, /routine repeat assessment of LV function is not recommended/);
  assert.match(advice({ newOrWorseningDyspnea: true }).testing, /Evaluate LV function/);
});
test('PH or severe AS requires modality review rather than a generic stress-test suggestion', () => {
  for (const condition of [{ pulmonaryHypertension: true }, { valvularHeartDisease: true, valvularType: 'aortic-stenosis' as const, valvularSeverity: 'severe' as const }]) {
    const output = advice({ ...elevated, ...condition });
    assert.match(output.testing, /Obtain specialist review/);
    assert.doesNotMatch(output.testing, /stress testing OR CCTA may be considered/);
  }
});

// Sections 3.4 / 9.1 and Figure 1: eligibility, independent missing tests, exact boundaries.
for (const [age, cardiovascularSymptoms, expected] of [[44, true, false], [45, true, true], [45, false, false], [64, false, false], [65, false, true]] as const) {
  test(`preoperative biomarkers: age ${age}, symptoms ${cardiovascularSymptoms}`, () => {
    assert.equal(advice({ age, cardiovascularSymptoms }).testing.includes('Measuring BNP or NT-proBNP'), expected);
  });
}
test('known CVD qualifies below 45; hypertension alone below 65 does not', () => {
  assert.match(advice({ age: 30, cerebrovascularDisease: true }).testing, /Measuring BNP or NT-proBNP/);
  assert.doesNotMatch(advice({ age: 50, hypertension: true }).testing, /Measuring BNP or NT-proBNP/);
});
test('prior valve intervention establishes known CVD without a duplicate valve checkbox', () => {
  for (const intervention of [{ tavrTavi: 'yes' as const }, { teer: 'yes' as const }]) {
    const output = advice({ age: 40, ...intervention });
    assert.match(output.testing, /Measuring BNP or NT-proBNP/);
    assert.match(output.general, /Measuring troponin at 24 and 48/);
  }
});
test('existing BNP does not suppress baseline troponin consideration or vice versa', () => {
  assert.match(advice({ age: 70, bnp: 0 }).testing, /baseline cardiac troponin/);
  assert.doesNotMatch(advice({ age: 70, bnp: 0 }).testing, /Measuring BNP or NT-proBNP/);
  assert.match(advice({ age: 70, troponin: 0, troponinUpperLimit: 0.014 }).testing, /Measuring BNP or NT-proBNP/);
});
test('BNP threshold is strictly >92 and NT-proBNP is ≥300', () => {
  assert.doesNotMatch(advice({ bnp: 92 }).testing, /BNP 92 pg\/mL is above/);
  assert.match(advice({ bnp: 92.01 }).testing, /BNP 92.01 pg\/mL is above/);
  assert.doesNotMatch(advice({ ntproBNP: 299 }).testing, /meets the Figure 1 threshold/);
  assert.match(advice({ ntproBNP: 300 }).testing, /meets the Figure 1 threshold/);
});
test('troponin requires strictly above valid assay URL, not equal; unknown URL stays unclassified', () => {
  assert.doesNotMatch(advice({ troponin: 0.014, troponinUpperLimit: 0.014 }).testing, /is above the supplied/);
  assert.match(advice({ troponin: 0.015, troponinUpperLimit: 0.014 }).testing, /is above the supplied/);
  assert.match(advice({ troponin: 0 }).testing, /cannot be classified/);
});
test('normal measured biomarkers avoid reflex ischemia screening, abnormal values require discussion', () => {
  assert.match(advice({ ...elevated, ntproBNP: 100 }).testing, /without further routine ischemia testing/);
  assert.doesNotMatch(advice({ ...elevated, ntproBNP: 100, troponin: 0.02, troponinUpperLimit: 0.014 }).testing, /Available biomarkers are below/);
  assert.doesNotMatch(advice({ ...elevated, troponin: 0.01 }).testing, /Available biomarkers are below/);
});
test('postoperative surveillance is optional, at 24 AND 48 h, with distinct eligibility', () => {
  assert.match(advice({ age: 65, hypertension: true }).general, /24 and 48 hours.*may be reasonable/);
  assert.doesNotMatch(advice({ age: 65 }).general, /Measuring troponin at 24 and 48/);
  assert.doesNotMatch(advice({ age: 64, hypertension: true }).general, /Measuring troponin at 24 and 48/);
  assert.match(advice({ age: 30, heartFailure: true }).general, /Measuring troponin at 24 and 48/);
  assert.doesNotMatch(advice({ age: 70, heartFailure: true, surgeryType: 'low-cataract' }).general, /Measuring troponin at 24 and 48/);
});

// Section 7.5: do not collapse the elective and time-sensitive pathways.
for (const pciTiming of ['le30d', 'gt30d-lt3mo', '3to6mo', '6to12mo'] as const) {
  test(`ACS DES at ${pciTiming} retains 12-month elective target`, () => assert.match(pci({ pciIndication: 'acs', pciTiming }), /until ≥12 months/));
}
test('CCD DES reaches elective interval at 6 months, not 3 months', () => {
  assert.match(pci({ pciIndication: 'ccd', pciTiming: '3to6mo' }), /until ≥6 months/);
  assert.match(pci({ pciIndication: 'ccd', pciTiming: '6to12mo' }), /≥6-month elective interval has been reached/);
  assert.match(pci({ pciIndication: 'acs', pciTiming: 'ge12mo' }), /≥12-month interval.*has been reached/);
});
test('time-sensitive DES ≥3 months differs from elective target', () => {
  assert.match(pci({ surgeryUrgency: 'time-sensitive', pciTiming: '3to6mo' }), /may be considered ≥3 months/);
  assert.match(pci({ surgeryUrgency: 'time-sensitive', pciTiming: 'gt30d-lt3mo' }), /threshold has not been established/);
});
test('BMS/DES at day 30 with interruption retains Class 3 harm warning', () => {
  for (const stentType of ['bms', 'des'] as const) assert.match(pci({ stentType, pciTiming: 'le30d' }), /potentially harmful/);
  assert.doesNotMatch(pci({ pciTiming: 'le30d', antiplateletInterruption: 'no' }), /elective surgery requiring interruption of any antiplatelet agent is potentially harmful/);
});
test('unknown indication and legacy week timing never produce false readiness', () => {
  assert.match(pci({ stentTiming: 'gt12w' }), /Verify exact date/);
  assert.match(pci({ pciTiming: '3to6mo', pciIndication: 'unknown' }), /do not assume that 3 months is sufficient/);
});
test('early time-sensitive PCI retains DAPT and all prior PCI retains aspirin guidance', () => {
  assert.match(pci({ surgeryUrgency: 'time-sensitive', pciTiming: 'gt30d-lt3mo' }), /continue DAPT unless bleeding risk outweighs/);
  assert.match(pci({ pciTiming: 'ge12mo' }), /continue aspirin 75–100 mg/);
});
test('balloon angioplasty has a 14-day elective minimum', () => assert.match(advice({ balloonAngioplasty: true, balloonTiming: 'lt14d' }).general, /delay elective surgery for at least 14 days/));
test('TAVR and TEER advice permits early surgery after successful intervention', () => {
  const out = advice({ tavrTavi: 'yes', tavrTiming: 'lt4w', teer: 'yes', teerTiming: 'lt4w' });
  assert.match(out.general, /including within 30 days/);
  assert.match(out.general, /no mandatory 4-week delay/);
  assert.doesNotMatch(out.general, /Defer elective.*until ≥30 days|defer until ≥4 weeks/);
});
test('stroke/TIA timing includes three-month elective delay, and unknown timing is not reassurance', () => {
  assert.match(advice({ cerebrovascularDisease: true, strokeTiming: 'lt3mo' }).general, /delaying elective surgery until ≥3 months/);
  assert.match(advice({ cerebrovascularDisease: true }).general, /Verify the most recent stroke\/TIA date/);
});
test('parent no flags prevent stale intervention timings from generating advice', () => {
  assert.doesNotMatch(advice({ cabgTiming: 'lt6w', tavrTiming: 'lt4w', teerTiming: 'lt4w' }).general, /Prior CABG|After successful/);
});

// Section 7 medication distinctions.
test('RCRI alone never starts a beta-blocker; confirmed new indication uses >7 days', () => {
  assert.doesNotMatch(advice(elevated).meds, /beta-blocker/);
  assert.match(advice({ newBetaBlockerIndication: true }).meds, /optimally >7 days/);
  assert.match(advice({ betaBlocker: true }).meds, /Continue established beta-blocker/);
});
test('RAAS omission requires controlled hypertension and elevated-risk surgery', () => {
  assert.match(advice({ aceARB: true, raasIndication: 'hypertension', bloodPressureControlled: true }).meds, /omission 24 hours before surgery may reduce/);
  for (const overrides of [{ bloodPressureControlled: false }, { surgeryType: 'low-cataract' }, { surgeryUrgency: 'emergency' as const }]) {
    assert.doesNotMatch(advice({ aceARB: true, raasIndication: 'hypertension', bloodPressureControlled: true, ...overrides }).meds, /omission 24 hours before surgery may reduce/);
  }
});
test('RAAS HFrEF continuation cannot be inferred from generic HF or HFpEF', () => {
  assert.match(advice({ aceARB: true, raasIndication: 'hfref' }).meds, /HFrEF, perioperative continuation is reasonable/);
  assert.match(advice({ aceARB: true, heartFailure: true }).meds, /Individualize ACE inhibitor\/ARB management after confirming indication/);
});
test('SGLT2 washout distinguishes ertugliflozin and urgent cases', () => {
  assert.match(advice({ sglt2i: true }).meds, /≥3 days and ertugliflozin for ≥4 days/);
  assert.match(advice({ sglt2i: true, surgeryUrgency: 'emergency' }).meds, /do not delay emergency surgery/);
});
test('anticoagulants need drug-specific planning and selective VKA bridging', () => {
  const out = advice({ anticoagulant: true }).meds;
  assert.match(out, /Routine heparin bridging is harmful for most/);
  assert.match(out, /interrupting a VKA/);
  assert.doesNotMatch(out, /DOACs 24-72/);
});
test('new AF, CIED and PH retain specific management prompts', () => {
  const out = advice({ atrialFibrillation: true, afibType: 'new-onset', hasCIED: true, pulmonaryHypertension: true }).general;
  assert.match(out, /outpatient thromboembolic-risk assessment and AF surveillance/);
  assert.match(out, /Restore modified settings and ICD therapies/);
  assert.match(out, /do not infer severe PH/);
});
test('report cites 2026 reaffirmation and does not mislabel RCRI percentages as MACE', () => {
  const report = generatePreCardiaReport(patient({ bnp: 0, ntproBNP: 0, troponin: 0, troponinUpperLimit: 0.014 }));
  assert.match(report, /2026 AHA\/ACC/);
  assert.match(report, /10.1016\/j.jacc.2026.06.017/);
  assert.match(report, /BNP: 0 pg\/mL/);
  assert.match(report, /Troponin: 0 ng\/mL/);
  assert.doesNotMatch(report, /30-day MACE Risk:|0.4%|0.9%|6.6%|11.0%|Elective \(>3 months\)/);
});
test('adult scope is enforced at report boundary', () => {
  for (const age of [17, 0, Number.NaN, 18.5]) assert.throws(() => generatePreCardiaReport(patient({ age })), /adults age 18/);
});
test('eGFR uses shared 2021 equation and does not assume male coefficients for other', () => {
  assert.equal(calculateEGFR(1, 60, 'female'), 64);
  assert.equal(calculateEGFR(1, 60, 'male'), 86);
  assert.equal(calculateEGFR(1, 60, 'other'), null);
  assert.equal(calculateEGFR(Number.NaN, 60, 'female'), null);
});
