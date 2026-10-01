import test from 'node:test';
import assert from 'node:assert/strict';
import type { PatientData, Medication, DomainName } from '../src/types';
import { performClinicalCalculations, calculateAllPREVENTRisks, categorizePREVENTRisk } from '../src/logic/calculations';
import { calculateCreatinineClearance, getApixabanAFDose } from '../src/logic/calculations/anticoagulantDosing';
import { generateAllDomainRecommendations, generateBPRecommendations, generateLipidRecommendations, generateHeartFailureRecommendations, generateDiabetesRecommendations, generateAnticoagulationRecommendations } from '../src/logic/recommendations';
import { generateClinicalReport } from '../src/logic/report/generateReport';
import { formatReportAsText } from '../src/logic/report/formatReport';
import { getContraindicationAlerts } from '../src/logic/safety/contraindications';
import { getDoseAdjustmentAlerts } from '../src/logic/safety/doseAdjustments';

type Overrides = Omit<Partial<PatientData>, 'demographics' | 'history' | 'labs'> & {
  demographics?: Partial<PatientData['demographics']>;
  history?: Partial<PatientData['history']>;
  labs?: PatientData['labs'];
};
function patient(overrides: Overrides = {}): PatientData {
  return {
    demographics: { age: 55, sex: 'male', race: 'white', heightFeet: 5, heightInches: 10, weightLbs: 180, smokingStatus: 'never', ...overrides.demographics },
    history: { hypertension: false, diabetes: false, ckd: false, cad: false, priorMI: false, priorPCI: false, stroke: false, tia: false, pad: false, hyperlipidemia: false, heartFailure: false, atrialFibrillation: false, ...overrides.history },
    labs: overrides.labs ?? { creatinine: 1, potassium: 4.5, totalCholesterol: 200, hdl: 50, ldl: 130, triglycerides: 100 },
    bpReadings: overrides.bpReadings ?? [{ systolic: 120, diastolic: 75 }],
    medications: overrides.medications ?? [], allergies: overrides.allergies ?? [],
  };
}
const medication = (genericName: string, category: Medication['category'], dose = '10mg'): Medication => ({ id: genericName, genericName, category, dose, frequency: 'daily' });
const analyze = (p: PatientData) => performClinicalCalculations(p);
const report = (p: PatientData, domains?: ReadonlySet<DomainName>) => generateClinicalReport(p, analyze(p), domains);
const text = (p: PatientData) => formatReportAsText(report(p));
const proposed = (p: PatientData) => generateAllDomainRecommendations(p, analyze(p)).flatMap(d => d.recommendations).filter(r => ['ADD','INCREASE','SWITCH','CONSIDER'].includes(r.action));
const hf = (egfr: number, potassium?: number) => patient({ history: { heartFailure: true, ejectionFraction: 35 }, labs: { egfr, potassium } });
const dmCKD = (egfr: number, potassium?: number) => patient({ history: { diabetes: true, ckd: true }, labs: { egfr, potassium, uacr: 100 }, medications: [medication('losartan','ARB')] });

// Missing information must never become a normal measurement or a diagnosis.
for (const [name, overrides] of [
  ['blank age', { demographics: { age: 0 } }],
  ['nonfinite lab', { labs: { creatinine: NaN } }],
  ['zero potassium', { labs: { potassium: 0 } }],
  ['incomplete BP', { bpReadings: [{ systolic: 130, diastolic: 0 }] }],
  ['HDL above total cholesterol', { labs: { totalCholesterol: 150, hdl: 160 } }],
] as [string, Overrides][]) test(`CV validation rejects ${name}`, () => assert.throws(() => analyze(patient(overrides))));
test('partial assessment keeps missing BP, renal function and risk unknown', () => {
  const p = patient({ labs: {}, bpReadings: [] });
  const c = analyze(p);
  assert.equal(c.egfr, null); assert.equal(c.ckdStage, null); assert.equal(c.ascvdRisk, null);
  assert.equal(c.bpClassification, 'Not assessed');
  assert.doesNotMatch(text(p), /0\/0|ADD Lisinopril|CKD Stage 5|Total CVD: 0\.0/);
  assert.match(text(p), /BP: Not assessed/);
  assert.match(text(p), /Kidney function: Unknown/);
});
test('one reduced eGFR does not establish CKD or dialysis', () => {
  const p = patient({ labs: { egfr: 12 } });
  assert.equal(analyze(p).ckdStage, null);
  assert.match(text(p), /single result does not establish CKD/);
  assert.doesNotMatch(text(p), /on dialysis/);
});
test('reported stage 5 CKD does not imply dialysis', () => {
  const p = patient({ history: { ckd: true }, labs: { egfr: 12 } });
  assert.equal(analyze(p).ckdStage, 5);
  assert.doesNotMatch(report(p).riskProfile, /on dialysis|5D/);
});

// AHA PREVENT quick-start guide: primary prevention and validated input ranges.
for (const condition of ['cad','priorMI','priorPCI','stroke','tia','pad','heartFailure','dialysis'] as const) test(`PREVENT withheld for ${condition}`, () => {
  const c = analyze(patient({ history: { [condition]: true } }));
  assert.ok(Object.values(c.preventRisks).every(v => v === null));
  assert.match(c.preventUnavailableReason!, /Not applicable/);
});
const baseInputs = { age: 55, sex: 'male' as const, totalCholesterol: 200, hdl: 50, systolicBP: 120, onBPMeds: false, diabetic: false, smoker: false, bmi: 25, egfr: 90, onStatin: false };
for (const age of [29,30,59,60,79,80]) test(`PREVENT age eligibility at ${age}`, () => {
  const risks = calculateAllPREVENTRisks({ ...baseInputs, age });
  assert.equal(risks.ascvd_10yr !== null, age >= 30 && age <= 79);
  assert.equal(risks.ascvd_30yr !== null, age >= 30 && age <= 59);
});
for (const egfr of [14.9,15,140,140.1]) test(`PREVENT renal eligibility at ${egfr}`, () => assert.equal(calculateAllPREVENTRisks({ ...baseInputs, egfr }).ascvd_10yr !== null, egfr >= 15 && egfr <= 140));
test('PREVENT outcomes require their own inputs, not fabricated missing values', () => {
  const missingBMI = calculateAllPREVENTRisks({ ...baseInputs, bmi: NaN });
  assert.notEqual(missingBMI.ascvd_10yr, null); assert.equal(missingBMI.heartFailure_10yr, null);
  const missingLipids = calculateAllPREVENTRisks({ ...baseInputs, totalCholesterol: NaN, hdl: NaN });
  assert.equal(missingLipids.ascvd_10yr, null); assert.ok(Number.isFinite(missingLipids.heartFailure_10yr));
});
// 2026 dyslipidemia categories use PREVENT-ASCVD, not total CVD.
for (const [risk,category] of [[2.99,'low'],[3,'borderline'],[4.99,'borderline'],[5,'intermediate'],[9.99,'intermediate'],[10,'high']] as const) test(`2026 ASCVD threshold at ${risk}`, () => assert.equal(categorizePREVENTRisk(risk), category));
test('high-risk primary prevention gets a high-intensity statin plan', () => {
  const p = patient({ demographics: { age: 70, smokingStatus: 'current' }, bpReadings: [{ systolic: 160, diastolic: 85 }] });
  const c = analyze(p);
  assert.equal(c.ascvdRisk, c.preventRisks.ascvd_10yr);
  assert.notEqual(c.ascvdRisk, c.preventRisks.totalCVD_10yr);
  assert.ok(c.ascvdRisk! >= 10);
  const statin = generateLipidRecommendations(p,c).find(r => r.medication === 'Atorvastatin');
  assert.match(statin!.recommendedDose!, /40mg/);
});
test('risk decisions do not round 9.99% up to the high-risk threshold', () => {
  const p = patient(); const c = { ...analyze(p), ascvdRisk: 9.99 };
  const statin = generateLipidRecommendations(p,c).find(r => r.medication === 'Atorvastatin');
  assert.match(statin!.recommendedDose!, /10–20mg/);
});
test('DM plus CAD produces one statin start and simvastatin switches to a high-intensity agent', () => {
  for (const medications of [[], [medication('simvastatin','Statin','20mg')]]) {
    const p = patient({ history: { diabetes: true, cad: true }, medications });
    const statins = proposed(p).filter(r => /statin/i.test(r.medication));
    assert.equal(statins.length,1); assert.equal(statins[0].medication,'Atorvastatin');
    assert.equal(statins[0].action, medications.length ? 'SWITCH' : 'ADD');
    assert.match(statins[0].recommendedDose!, /40mg/);
  }
});
test('stage 1 BP medication decision uses total CVD rather than ASCVD', () => {
  const p = patient({ bpReadings: [{ systolic: 135, diastolic: 82 }] });
  for (const totalCVD of [7.49,7.5]) {
    const c = analyze(p); c.ascvdRisk = 4; c.preventRisks.totalCVD_10yr = totalCVD;
    assert.equal(generateBPRecommendations(p,c).some(r => r.action === 'CONSIDER' && /Lisinopril|Amlodipine/.test(r.medication)), totalCVD >= 7.5);
  }
});

// 2022 HF: MRA initiation eGFR >30 and K <5; missing K is not a normal result.
for (const [egfr,k,eligible] of [[30,4.5,false],[30.1,4.5,true],[60,4.99,true],[60,5,false],[60,undefined,false]] as const) test(`MRA initiation at eGFR ${egfr}, K ${k}`, () => {
  const p = hf(egfr,k);
  assert.equal(generateHeartFailureRecommendations(p,analyze(p)).some(r => r.action === 'ADD' && r.medication === 'Spironolactone'), eligible);
});
test('missing safety labs do not propose RAAS initiation', () => {
  const p = hf(60);
  assert.ok(!proposed(p).some(r => /Sacubitril|Lisinopril|Losartan/i.test(r.medication)));
});
test('ACE-I to ARNI is one coordinated switch with the 36-hour washout', () => {
  const p = hf(60,4.5); p.medications = [medication('lisinopril','ACE Inhibitor')];
  const recs = generateHeartFailureRecommendations(p,analyze(p));
  const switchRec = recs.find(r => r.action === 'SWITCH' && /Sacubitril/.test(r.medication));
  assert.match(switchRec!.monitoring!, /36 HOURS/);
  assert.ok(!recs.some(r => r.action === 'DISCONTINUE' && /lisinopril/i.test(r.medication)));
});
// US labels: dapagliflozin initiation >=25; empagliflozin HF evidence >=20.
for (const egfr of [19.9,20,24.9,25]) test(`HF SGLT2 initiation at eGFR ${egfr}`, () => {
  const p = hf(egfr,4.5);
  const sglt2 = proposed(p).filter(r => /Dapagliflozin|Empagliflozin/.test(r.medication));
  assert.equal(sglt2.length, egfr < 20 ? 0 : 1);
  if (egfr >= 20) assert.equal(sglt2[0].medication, egfr < 25 ? 'Empagliflozin' : 'Dapagliflozin');
});
test('diabetes plus HF does not duplicate SGLT2 initiation', () => {
  const p = hf(60,4.5); p.history.diabetes = true;
  assert.equal(proposed(p).filter(r => /Dapagliflozin|Empagliflozin/.test(r.medication)).length, 1);
});
for (const k of [undefined,4.8,5,5.01,6]) test(`finerenone potassium gate at ${k}`, () => {
  const p = dmCKD(40,k);
  const rec = generateDiabetesRecommendations(p,analyze(p)).find(r => r.medication === 'Finerenone');
  assert.equal(rec!.action, k !== undefined && k <= 5 ? 'CONSIDER' : 'DEFER');
});
test('finerenone needs renal eligibility and existing RAAS therapy', () => {
  for (const p of [dmCKD(24.9,4.5), { ...dmCKD(40,4.5), medications: [] }]) {
    assert.equal(generateDiabetesRecommendations(p,analyze(p)).find(r => r.medication === 'Finerenone')!.action,'DEFER');
  }
});
test('existing finerenone is not automatically stopped using the steroidal-MRA eGFR cutoff', () => {
  const p = dmCKD(28,4.5); p.medications.push(medication('finerenone','MRA'));
  assert.ok(!getContraindicationAlerts(p,analyze(p)).some(r => r.recommendation.action === 'DISCONTINUE' && /finerenone/i.test(r.recommendation.medication)));
});
test('metformin at eGFR 30–44 is not newly initiated and existing dosing is 1000mg total daily', () => {
  const p = dmCKD(36,4.5);
  assert.ok(!proposed(p).some(r => r.medication === 'Metformin'));
  p.medications.push(medication('metformin','Diabetes - Metformin','1000mg'));
  const rec = getDoseAdjustmentAlerts(p,analyze(p)).find(r => /metformin/i.test(r.recommendation.medication))!.recommendation;
  assert.match(rec.recommendedDose!, /1000mg total per day/);
  assert.doesNotMatch(rec.recommendedDose!, /BID|2000/);
});
for (const [drug,overrides,blocked] of [
  ['Jardiance', { history: { heartFailure: true, ejectionFraction: 55 } }, /Empagliflozin/i],
  ['Lipitor', { history: { cad: true } }, /Atorvastatin/i],
  ['Aspirin', { history: { cad: true } }, /antiplatelet/i],
  ['Metformin', { history: { diabetes: true } }, /Metformin/i],
] as [string,Overrides,RegExp][]) test(`documented ${drug} allergy blocks a matching proposed start`, () => {
  const p = patient({ ...overrides, allergies: [{ id: 'a', medication: drug, reaction: 'rash' }] });
  assert.ok(!proposed(p).some(r => blocked.test(r.medication)));
});

// 2023 AF guideline and US apixaban label: indication and valve status precede dose selection.
const af = (history: Partial<PatientData['history']> = {}) => patient({ history: { atrialFibrillation: true, hypertension: true, diabetes: true, ...history } });
for (const valve of ['unknown','mechanical','mitral-stenosis'] as const) test(`AF ${valve} valve status cannot select a DOAC`, () => {
  const p = af({ afValveStatus: valve });
  assert.ok(!proposed(p).some(r => /Apixaban|Rivaroxaban|Dabigatran|Edoxaban/i.test(r.medication)));
  assert.match(JSON.stringify(generateAnticoagulationRecommendations(p,analyze(p))), valve === 'unknown' ? /Valve history/ : /Warfarin/);
});
test('missing AF renal information does not select warfarin or a dose', () => {
  const p = af({ afValveStatus: 'none' }); p.labs = {};
  const recs = generateAnticoagulationRecommendations(p,analyze(p));
  assert.ok(!recs.some(r => r.action === 'ADD' || r.action === 'SWITCH'));
  assert.ok(!recs.some(r => r.medication === 'Warfarin' || r.medication === 'Apixaban'));
});
test('low-risk AF does not recommend aspirin or invented individualized stroke risk', () => {
  const p = patient({ history: { atrialFibrillation: true, afValveStatus: 'none' } });
  assert.ok(!proposed(p).some(r => /aspirin/i.test(r.medication + r.recommendedDose)));
  assert.equal(analyze(p).cha2ds2vasc!.annualStrokeRisk,'<1% risk stratum');
});
for (const [age,weightKg,creatinine,dose] of [[79,61,1.5,'5mg'],[80,61,1.5,'2.5mg'],[80,60,1.4,'2.5mg'],[79,60,1.5,'2.5mg']] as const) test(`US apixaban AF rule at ${age} years / ${weightKg}kg / Cr ${creatinine}`, () => {
  const p = af({ afValveStatus: 'none' });
  p.demographics.age=age; p.demographics.weightLbs=weightKg*2.20462; p.labs.creatinine=creatinine;
  assert.equal(getApixabanAFDose(p),`${dose} twice daily`);
});
test('indexed eGFR alone does not reduce apixaban and CG clearance is independently calculated', () => {
  const p = af({ afValveStatus: 'none' }); p.labs = { egfr: 28, creatinine: 1.5, potassium: 4.5 };
  assert.equal(getApixabanAFDose(p),'5mg twice daily');
  assert.ok(calculateCreatinineClearance(p)! > 50);
});
test('dialysis does not automatically discontinue apixaban', () => {
  const p = af({ afValveStatus: 'none', dialysis: true }); p.medications=[medication('apixaban','Anticoagulant','5mg')];
  assert.ok(!getContraindicationAlerts(p,analyze(p)).some(r => r.recommendation.action === 'DISCONTINUE' && /apixaban/i.test(r.recommendation.medication)));
});
test('CAD without AF reaches antiplatelet review; old MI does not automatically start DAPT or beta blocker', () => {
  const p = patient({ history: { cad: true, priorMI: true } });
  assert.ok(report(p).domains.some(d => d.name === 'ANTIPLATELET_ANTICOAGULATION'));
  assert.ok(!proposed(p).some(r => /clopidogrel|ticagrelor|metoprolol|carvedilol/i.test(r.medication)));
  assert.match(text(p), /history of MI alone does not justify/);
});
for (const [name,overrides] of [['BP 190/125',{ bpReadings: [{ systolic: 190, diastolic: 125 }] }],['K 6',{ labs: { potassium: 6, egfr: 40 } }]] as [string,Overrides][]) test(`${name} supersedes routine optimization even when all domains are deselected`, () => {
  const p = patient(overrides); const r = report(p,new Set());
  assert.equal(r.domains.length,1); assert.equal(r.domains[0].name,'BLOOD_PRESSURE');
  assert.match(r.followUpPlan,/Immediate clinical assessment/);
  assert.doesNotMatch(r.followUpPlan,/4 weeks|4–12|3 months/);
  assert.equal(proposed(p).length,0);
});
test('report domain filtering rebuilds monitoring, follow-up and references consistently', () => {
  const p = patient({ history: { diabetes: true, hypertension: true }, bpReadings: [{ systolic: 150, diastolic: 90 }] });
  const r = report(p,new Set(['LIPID_MANAGEMENT']));
  assert.ok(r.domains.every(d => d.name === 'LIPID_MANAGEMENT'));
  assert.doesNotMatch(JSON.stringify(r.monitoringPlan), /Home BP|Hemoglobin A1c|Basic metabolic/);
  assert.doesNotMatch(r.followUpPlan,/BP follow-up|Diabetes follow-up/);
  assert.match(r.references,/2026/);
});

test('urgent hyperkalemia retains current MRA holding guidance', () => {
  const p = hf(40,6); p.medications = [medication('spironolactone','MRA')];
  assert.match(text(p), /HOLD spironolactone/);
});

test('overlapping diabetic CKD and HFrEF indications never propose two MRAs', () => {
  const p = dmCKD(40,4.5); p.history.heartFailure = true; p.history.ejectionFraction = 35;
  assert.equal(proposed(p).filter(r => /finerenone|spironolactone|eplerenone/i.test(r.medication)).length,1);
});
