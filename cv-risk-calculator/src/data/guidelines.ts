export const GUIDELINES = {
  BP_2017: '2017 ACC/AHA HTN Guideline',
  CHOLESTEROL_2018: '2018 ACC/AHA Cholesterol Guideline',
  CHOLESTEROL_2022: '2022 ACC Expert Consensus on Non-Statin Therapies',
  PREVENT_2023: '2023 AHA PREVENT Equations',
  ADA_2024: '2024 ADA Standards of Care',
  KDIGO_2022: '2022 KDIGO Guidelines',
  HF_2022: '2022 ACC/AHA/HFSA Heart Failure Guideline',
  STEMI_2013: '2013 ACCF/AHA STEMI Guideline',
  AFIB_2019: '2019 AHA/ACC/HRS Atrial Fibrillation Guidelines',
  AFIB_2023: '2023 ACC/AHA/ACCP/HRS Atrial Fibrillation Guideline',
  AFIB_PCI_2020: '2020 ACC Expert Consensus: Anticoagulant/Antiplatelet in AF with PCI',
};

export const GUIDELINE_REFERENCES = [
  {
    short: GUIDELINES.BP_2017,
    full: '2017 ACC/AHA/AAPA/ABC/ACPM/AGS/APhA/ASH/ASPC/NMA/PCNA Guideline for the Prevention, Detection, Evaluation, and Management of High Blood Pressure in Adults',
    citation: 'Hypertension. 2018;71:e13-e115',
    url: 'https://professional.heart.org/-/media/PHD-Files-2/Science-News/h/Hypertension-Guideline-Highlights-ucm_505521.pdf',
  },
  {
    short: GUIDELINES.CHOLESTEROL_2018,
    full: '2018 AHA/ACC/AACVPR/AAPA/ABC/ACPM/ADA/AGS/APhA/ASPC/NLA/PCNA Guideline on the Management of Blood Cholesterol',
    citation: 'Circulation. 2019;139:e1082-e1143',
    url: 'https://www.ahajournals.org/doi/10.1161/CIR.0000000000000625',
  },
  {
    short: GUIDELINES.CHOLESTEROL_2022,
    full: '2022 ACC Expert Consensus Decision Pathway on the Role of Nonstatin Therapies for LDL-Cholesterol Lowering in the Management of Atherosclerotic Cardiovascular Disease Risk',
    citation: 'J Am Coll Cardiol. 2022;80(14):1366-1418',
    url: 'https://www.jacc.org/doi/10.1016/j.jacc.2022.07.006',
  },
  {
    short: GUIDELINES.PREVENT_2023,
    full: '2023 American Heart Association PREVENT Equations for Cardiovascular Disease Risk Assessment',
    citation: 'Khan SS, Matsushita K, Sang Y, et al. Circulation. 2023;149:430-449',
    url: 'https://www.ahajournals.org/doi/10.1161/CIRCULATIONAHA.123.067626',
  },
  {
    short: GUIDELINES.ADA_2024,
    full: 'American Diabetes Association Standards of Care in Diabetes - 2024',
    citation: 'Diabetes Care. 2024;47(Suppl 1)',
    url: 'https://diabetesjournals.org/care/issue/47/Supplement_1',
  },
  {
    short: GUIDELINES.KDIGO_2022,
    full: '2022 KDIGO Clinical Practice Guideline for Diabetes Management in Chronic Kidney Disease',
    citation: 'Kidney Int. 2022;102(5S):S1-S127',
    url: 'https://kdigo.org/guidelines/diabetes-ckd/',
  },
  {
    short: GUIDELINES.HF_2022,
    full: '2022 AHA/ACC/HFSA Guideline for the Management of Heart Failure',
    citation: 'Circulation. 2022;145:e895-e1032',
    url: 'https://www.ahajournals.org/doi/10.1161/CIR.0000000000001063',
  },
  {
    short: GUIDELINES.AFIB_2019,
    full: '2019 AHA/ACC/HRS Focused Update of the 2014 AHA/ACC/HRS Guideline for the Management of Patients With Atrial Fibrillation',
    citation: 'Circulation. 2019;140:e125-e151',
    url: 'https://www.ahajournals.org/doi/10.1161/CIR.0000000000000665',
  },
  {
    short: GUIDELINES.AFIB_2023,
    full: '2023 ACC/AHA/ACCP/HRS Guideline for the Management of Patients With Atrial Fibrillation',
    citation: 'Circulation. 2023;148:e000-e000',
    url: 'https://professional.heart.org/-/media/PHD-Files-2/Science-News/Clinical-Update-Slides/AHA-Clinical-Update-2023-Guideline-Diagnosis-Management-AFib-Slide-Set.pdf',
  },
  {
    short: GUIDELINES.AFIB_PCI_2020,
    full: '2020 ACC Expert Consensus Decision Pathway for Anticoagulant and Antiplatelet Therapy in Patients With Atrial Fibrillation or Venous Thromboembolism Undergoing Percutaneous Coronary Intervention or With Atherosclerotic Cardiovascular Disease',
    citation: 'J Am Coll Cardiol. 2021;77(5):629-658',
    url: 'https://www.jacc.org/doi/10.1016/j.jacc.2020.09.011',
  },
];

export const KEY_TRIALS = {
  EMPA_REG: {
    name: 'EMPA-REG OUTCOME: Empagliflozin cardiovascular outcomes in type 2 diabetes',
    citation: 'N Engl J Med. 2015;373:2117-2128',
    url: 'https://www.nejm.org/doi/full/10.1056/NEJMoa1504720',
  },
  SUSTAIN_6: {
    name: 'SUSTAIN-6: Semaglutide and cardiovascular outcomes in type 2 diabetes',
    citation: 'N Engl J Med. 2016;375:1834-1844',
    url: 'https://www.nejm.org/doi/full/10.1056/NEJMoa1607141',
  },
  DAPA_HF: {
    name: 'DAPA-HF: Dapagliflozin in patients with heart failure and reduced ejection fraction',
    citation: 'N Engl J Med. 2019;381:1995-2008',
    url: 'https://www.nejm.org/doi/full/10.1056/NEJMoa1911303',
  },
  PARADIGM_HF: {
    name: 'PARADIGM-HF: Angiotensin-neprilysin inhibition versus enalapril in heart failure',
    citation: 'N Engl J Med. 2014;371:993-1004',
    url: 'https://www.nejm.org/doi/full/10.1056/NEJMoa1409077',
  },
  RE_LY: {
    name: 'RE-LY: Dabigatran versus warfarin in atrial fibrillation',
    citation: 'N Engl J Med. 2009;361:1139-1151',
    url: 'https://www.nejm.org/doi/full/10.1056/NEJMoa0905561',
  },
  ROCKET_AF: {
    name: 'ROCKET-AF: Rivaroxaban versus warfarin in nonvalvular atrial fibrillation',
    citation: 'N Engl J Med. 2011;365:883-891',
    url: 'https://www.nejm.org/doi/full/10.1056/NEJMoa1009638',
  },
  ARISTOTLE: {
    name: 'ARISTOTLE: Apixaban versus warfarin in atrial fibrillation',
    citation: 'N Engl J Med. 2011;365:981-992',
    url: 'https://www.nejm.org/doi/full/10.1056/NEJMoa1107039',
  },
};
