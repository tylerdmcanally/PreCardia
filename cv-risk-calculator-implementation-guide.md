# CV Risk Optimization Calculator - Complete Implementation Guide

## Project Overview

Build a client-side web application for healthcare providers to assess cardiovascular risk and generate evidence-based medication recommendations. No backend/database required - pure client-side React application.

**Core Features:**
- Comprehensive CV risk assessment (ASCVD, BP, lipids, diabetes, renal)
- Evidence-based medication recommendations organized by clinical domain
- Safety checking (contraindications, drug interactions)
- Monitoring plan generation
- Professional copyable report for EMR documentation

**Design Principles:**
1. **Domain-Based Organization** - Group recommendations by clinical system (BP, Lipids, Diabetes, etc.)
2. **Priority Flags Within Domains** - [HIGH], [MODERATE], [LOW] markers for each recommendation
3. **1.5-2 Pages Acceptable** - Don't artificially constrain; let clinical comprehensiveness dictate length
4. **Explicit Continuation** - Mark current appropriate medications with "CONTINUE"
5. **Simplified Evidence** - Guideline name inline; full citations in references section

---

## Tech Stack

```json
{
  "framework": "React 18 + TypeScript",
  "build": "Vite",
  "styling": "Tailwind CSS",
  "forms": "React Hook Form",
  "ui": "Headless UI",
  "icons": "Lucide React",
  "utilities": "clsx, date-fns"
}
```

---

## Project Structure

```
cv-risk-calculator/
├── public/
│   └── favicon.ico
│
├── src/
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Header.tsx
│   │   │   ├── Layout.tsx
│   │   │   └── Disclaimer.tsx
│   │   │
│   │   ├── forms/
│   │   │   ├── PatientInfoForm.tsx
│   │   │   ├── MedicalHistoryForm.tsx
│   │   │   ├── MedicationsForm.tsx
│   │   │   ├── AllergiesForm.tsx
│   │   │   ├── LabsForm.tsx
│   │   │   └── BPReadingsForm.tsx
│   │   │
│   │   ├── ui/
│   │   │   ├── Button.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── Select.tsx
│   │   │   ├── Checkbox.tsx
│   │   │   ├── Combobox.tsx
│   │   │   └── Toast.tsx
│   │   │
│   │   └── report/
│   │       ├── ReportPreview.tsx
│   │       ├── ReportHeader.tsx
│   │       ├── RiskProfile.tsx
│   │       ├── MedicationReview.tsx
│   │       ├── DomainRecommendations.tsx
│   │       ├── MonitoringPlan.tsx
│   │       └── ReportActions.tsx
│   │
│   ├── logic/
│   │   ├── calculations/
│   │   │   ├── ascvd.ts
│   │   │   ├── bmi.ts
│   │   │   ├── egfr.ts
│   │   │   ├── bpClassification.ts
│   │   │   └── index.ts
│   │   │
│   │   ├── recommendations/
│   │   │   ├── bloodPressure.ts
│   │   │   ├── lipids.ts
│   │   │   ├── diabetes.ts
│   │   │   ├── heartFailure.ts
│   │   │   ├── antiplatelet.ts
│   │   │   ├── lifestyle.ts
│   │   │   └── index.ts
│   │   │
│   │   ├── safety/
│   │   │   ├── contraindications.ts
│   │   │   ├── interactions.ts
│   │   │   ├── doseAdjustments.ts
│   │   │   └── index.ts
│   │   │
│   │   └── report/
│   │       ├── generateReport.ts
│   │       ├── formatReport.ts
│   │       ├── monitoringPlan.ts
│   │       └── index.ts
│   │
│   ├── data/
│   │   ├── medications.ts
│   │   ├── conditions.ts
│   │   ├── guidelines.ts
│   │   └── index.ts
│   │
│   ├── types/
│   │   ├── patient.types.ts
│   │   ├── clinical.types.ts
│   │   ├── medication.types.ts
│   │   ├── recommendation.types.ts
│   │   └── index.ts
│   │
│   ├── hooks/
│   │   ├── usePatientData.ts
│   │   ├── useClinicalCalculations.ts
│   │   ├── useRecommendations.ts
│   │   └── useClipboard.ts
│   │
│   ├── utils/
│   │   ├── validation.ts
│   │   ├── formatting.ts
│   │   └── constants.ts
│   │
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
│
├── package.json
├── tsconfig.json
├── vite.config.ts
├── tailwind.config.js
├── postcss.config.js
└── README.md
```

---

## Implementation Phases

### Phase 1: Project Setup

```bash
# Create project
npm create vite@latest cv-risk-calculator -- --template react-ts
cd cv-risk-calculator

# Install dependencies
npm install react-hook-form @headlessui/react lucide-react clsx date-fns

# Install Tailwind
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p

# Install types
npm install -D @types/node
```

#### Configure Tailwind (`tailwind.config.js`)

```javascript
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
```

#### Update `src/index.css`

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@media print {
  @page {
    margin: 0.5in;
  }
  
  body * {
    visibility: hidden;
  }
  
  .print-content,
  .print-content * {
    visibility: visible;
  }
  
  .print-content {
    position: absolute;
    left: 0;
    top: 0;
    width: 100%;
  }
  
  .no-print {
    display: none !important;
  }
}
```

#### Configure TypeScript (`tsconfig.json`)

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

---

### Phase 2: Type Definitions

#### `src/types/patient.types.ts`

```typescript
export interface PatientDemographics {
  age: number;
  sex: 'male' | 'female';
  race: 'white' | 'black' | 'hispanic' | 'asian' | 'other';
  heightFeet: number;
  heightInches: number;
  weightLbs: number;
  smokingStatus: 'current' | 'former' | 'never';
}

export interface MedicalHistory {
  hypertension: boolean;
  hypertensionYears?: number;
  diabetes: boolean;
  diabetesYears?: number;
  ckd: boolean;
  ckdStage?: 1 | 2 | 3 | 4 | 5;
  cad: boolean;
  priorMI: boolean;
  stroke: boolean;
  tia: boolean;
  pad: boolean;
  heartFailure: boolean;
  ejectionFraction?: number;
  atrialFibrillation: boolean;
}

export type MedicationCategory =
  | 'ACE Inhibitor'
  | 'ARB'
  | 'Beta Blocker'
  | 'Calcium Channel Blocker'
  | 'Diuretic - Thiazide'
  | 'Diuretic - Loop'
  | 'MRA'
  | 'Statin'
  | 'Antiplatelet'
  | 'Anticoagulant'
  | 'Diabetes - Metformin'
  | 'Diabetes - SGLT2i'
  | 'Diabetes - GLP-1 RA'
  | 'Other';

export interface Medication {
  id: string;
  genericName: string;
  dose: string;
  frequency: string;
  category: MedicationCategory;
}

export interface Allergy {
  id: string;
  medication: string;
  reaction: string;
}

export interface LabValues {
  creatinine?: number;
  creatinineDate?: string;
  potassium?: number;
  sodium?: number;
  totalCholesterol?: number;
  ldl?: number;
  hdl?: number;
  triglycerides?: number;
  lipidDate?: string;
  a1c?: number;
  a1cDate?: string;
  uacr?: number;
  uacrDate?: string;
}

export interface BPReading {
  systolic: number;
  diastolic: number;
  date?: string;
}

export interface PatientData {
  demographics: PatientDemographics;
  history: MedicalHistory;
  medications: Medication[];
  allergies: Allergy[];
  labs: LabValues;
  bpReadings: BPReading[];
}
```

#### `src/types/clinical.types.ts`

```typescript
export interface ClinicalCalculations {
  bmi: number;
  egfr: number;
  averageBP: { systolic: number; diastolic: number };
  bpClassification: BPClassification;
  bpTarget: { systolic: number; diastolic: number; rationale: string };
  ascvdRisk: number;
  ascvdCategory: 'low' | 'borderline' | 'intermediate' | 'high';
  ckdStage: number;
  ldlGoal: number;
  a1cGoal: number;
}

export type BPClassification =
  | 'Normal'
  | 'Elevated'
  | 'Stage 1 Hypertension'
  | 'Stage 2 Hypertension'
  | 'Hypertensive Crisis';
```

#### `src/types/recommendation.types.ts`

```typescript
export type Priority = 'HIGH' | 'MODERATE' | 'LOW';
export type Action = 'ADD' | 'INCREASE' | 'DECREASE' | 'DISCONTINUE' | 'CONTINUE' | 'CONSIDER';

export interface DomainRecommendation {
  priority: Priority;
  action: Action;
  medication: string;
  currentDose?: string;
  recommendedDose?: string;
  rationale: string;
  evidence: string;
  monitoring?: string;
  additionalNotes?: string;
}

export type DomainName =
  | 'BLOOD_PRESSURE'
  | 'LIPID_MANAGEMENT'
  | 'DIABETES_CARDIORENAL'
  | 'HEART_FAILURE'
  | 'ANTIPLATELET_ANTICOAGULATION'
  | 'RISK_FACTOR_MODIFICATION';

export interface ClinicalDomain {
  name: DomainName;
  displayName: string;
  currentStatus: string;
  recommendations: DomainRecommendation[];
  order: number;
}

export interface MedicationReviewItem {
  medication: string;
  status: string;
}

export interface MedicationReview {
  continue: MedicationReviewItem[];
  optimize: MedicationReviewItem[];
  discontinue: MedicationReviewItem[];
}

export interface MonitoringItem {
  timing: string;
  tests: string[];
  purpose: string;
  action?: string;
}

export interface MonitoringPlan {
  shortTerm: MonitoringItem[];
  mediumTerm: MonitoringItem[];
  longTerm: MonitoringItem[];
}

export interface ClinicalReport {
  header: string;
  riskProfile: string;
  medicationReview: MedicationReview;
  domains: ClinicalDomain[];
  monitoringPlan: MonitoringPlan;
  followUpPlan: string;
  references: string;
}
```

#### `src/types/index.ts`

```typescript
export * from './patient.types';
export * from './clinical.types';
export * from './recommendation.types';
```

---

### Phase 3: Data Files

#### `src/data/medications.ts`

```typescript
import { MedicationCategory } from '../types';

export interface MedicationOption {
  name: string;
  genericName: string;
  doses: string[];
  category: MedicationCategory;
}

export const MEDICATIONS: MedicationOption[] = [
  // ACE Inhibitors
  { name: 'Lisinopril', genericName: 'lisinopril', doses: ['5mg daily', '10mg daily', '20mg daily', '40mg daily'], category: 'ACE Inhibitor' },
  { name: 'Enalapril', genericName: 'enalapril', doses: ['5mg daily', '5mg BID', '10mg daily', '10mg BID', '20mg daily', '20mg BID'], category: 'ACE Inhibitor' },
  { name: 'Ramipril', genericName: 'ramipril', doses: ['2.5mg daily', '5mg daily', '10mg daily'], category: 'ACE Inhibitor' },
  
  // ARBs
  { name: 'Losartan', genericName: 'losartan', doses: ['25mg daily', '50mg daily', '100mg daily'], category: 'ARB' },
  { name: 'Valsartan', genericName: 'valsartan', doses: ['80mg daily', '160mg daily', '320mg daily'], category: 'ARB' },
  { name: 'Olmesartan', genericName: 'olmesartan', doses: ['20mg daily', '40mg daily'], category: 'ARB' },
  
  // Beta Blockers
  { name: 'Metoprolol succinate', genericName: 'metoprolol succinate', doses: ['25mg daily', '50mg daily', '100mg daily', '200mg daily'], category: 'Beta Blocker' },
  { name: 'Metoprolol tartrate', genericName: 'metoprolol tartrate', doses: ['25mg BID', '50mg BID', '100mg BID'], category: 'Beta Blocker' },
  { name: 'Carvedilol', genericName: 'carvedilol', doses: ['3.125mg BID', '6.25mg BID', '12.5mg BID', '25mg BID'], category: 'Beta Blocker' },
  { name: 'Atenolol', genericName: 'atenolol', doses: ['25mg daily', '50mg daily', '100mg daily'], category: 'Beta Blocker' },
  
  // Calcium Channel Blockers
  { name: 'Amlodipine', genericName: 'amlodipine', doses: ['2.5mg daily', '5mg daily', '10mg daily'], category: 'Calcium Channel Blocker' },
  { name: 'Nifedipine XL', genericName: 'nifedipine', doses: ['30mg daily', '60mg daily', '90mg daily'], category: 'Calcium Channel Blocker' },
  { name: 'Diltiazem ER', genericName: 'diltiazem', doses: ['120mg daily', '180mg daily', '240mg daily', '300mg daily'], category: 'Calcium Channel Blocker' },
  
  // Diuretics - Thiazide
  { name: 'Hydrochlorothiazide', genericName: 'hydrochlorothiazide', doses: ['12.5mg daily', '25mg daily', '50mg daily'], category: 'Diuretic - Thiazide' },
  { name: 'Chlorthalidone', genericName: 'chlorthalidone', doses: ['12.5mg daily', '25mg daily'], category: 'Diuretic - Thiazide' },
  
  // Diuretics - Loop
  { name: 'Furosemide', genericName: 'furosemide', doses: ['20mg daily', '40mg daily', '80mg daily', '40mg BID'], category: 'Diuretic - Loop' },
  { name: 'Bumetanide', genericName: 'bumetanide', doses: ['0.5mg daily', '1mg daily', '2mg daily'], category: 'Diuretic - Loop' },
  { name: 'Torsemide', genericName: 'torsemide', doses: ['10mg daily', '20mg daily', '40mg daily'], category: 'Diuretic - Loop' },
  
  // MRA
  { name: 'Spironolactone', genericName: 'spironolactone', doses: ['12.5mg daily', '25mg daily', '50mg daily'], category: 'MRA' },
  { name: 'Eplerenone', genericName: 'eplerenone', doses: ['25mg daily', '50mg daily'], category: 'MRA' },
  
  // Statins
  { name: 'Atorvastatin', genericName: 'atorvastatin', doses: ['10mg daily', '20mg daily', '40mg daily', '80mg daily'], category: 'Statin' },
  { name: 'Rosuvastatin', genericName: 'rosuvastatin', doses: ['5mg daily', '10mg daily', '20mg daily', '40mg daily'], category: 'Statin' },
  { name: 'Simvastatin', genericName: 'simvastatin', doses: ['10mg daily', '20mg daily', '40mg daily'], category: 'Statin' },
  { name: 'Pravastatin', genericName: 'pravastatin', doses: ['20mg daily', '40mg daily', '80mg daily'], category: 'Statin' },
  
  // SGLT2 Inhibitors
  { name: 'Empagliflozin', genericName: 'empagliflozin', doses: ['10mg daily', '25mg daily'], category: 'Diabetes - SGLT2i' },
  { name: 'Dapagliflozin', genericName: 'dapagliflozin', doses: ['5mg daily', '10mg daily'], category: 'Diabetes - SGLT2i' },
  { name: 'Canagliflozin', genericName: 'canagliflozin', doses: ['100mg daily', '300mg daily'], category: 'Diabetes - SGLT2i' },
  
  // GLP-1 Agonists
  { name: 'Semaglutide', genericName: 'semaglutide', doses: ['0.25mg weekly', '0.5mg weekly', '1mg weekly', '2mg weekly'], category: 'Diabetes - GLP-1 RA' },
  { name: 'Dulaglutide', genericName: 'dulaglutide', doses: ['0.75mg weekly', '1.5mg weekly', '3mg weekly', '4.5mg weekly'], category: 'Diabetes - GLP-1 RA' },
  { name: 'Liraglutide', genericName: 'liraglutide', doses: ['0.6mg daily', '1.2mg daily', '1.8mg daily'], category: 'Diabetes - GLP-1 RA' },
  
  // Metformin
  { name: 'Metformin', genericName: 'metformin', doses: ['500mg daily', '500mg BID', '850mg BID', '1000mg BID'], category: 'Diabetes - Metformin' },
  { name: 'Metformin ER', genericName: 'metformin', doses: ['500mg daily', '1000mg daily', '1500mg daily', '2000mg daily'], category: 'Diabetes - Metformin' },
  
  // Antiplatelet
  { name: 'Aspirin', genericName: 'aspirin', doses: ['81mg daily'], category: 'Antiplatelet' },
  { name: 'Clopidogrel', genericName: 'clopidogrel', doses: ['75mg daily'], category: 'Antiplatelet' },
  { name: 'Ticagrelor', genericName: 'ticagrelor', doses: ['90mg BID'], category: 'Antiplatelet' },
  
  // Anticoagulants
  { name: 'Apixaban', genericName: 'apixaban', doses: ['2.5mg BID', '5mg BID'], category: 'Anticoagulant' },
  { name: 'Rivaroxaban', genericName: 'rivaroxaban', doses: ['15mg daily', '20mg daily'], category: 'Anticoagulant' },
  { name: 'Warfarin', genericName: 'warfarin', doses: ['dose varies'], category: 'Anticoagulant' },
];

// Create searchable flat list
export const MEDICATION_SEARCH_LIST = MEDICATIONS.flatMap(med =>
  med.doses.map(dose => ({
    label: `${med.name} ${dose}`,
    value: `${med.genericName}|${dose}|${med.category}`,
    genericName: med.genericName,
    dose: dose,
    category: med.category,
  }))
);
```

#### `src/data/conditions.ts`

```typescript
export interface Condition {
  id: string;
  label: string;
  hasYears?: boolean;
  hasStage?: boolean;
  hasEF?: boolean;
}

export const CONDITIONS: Condition[] = [
  { id: 'hypertension', label: 'Hypertension', hasYears: true },
  { id: 'diabetes', label: 'Type 2 Diabetes', hasYears: true },
  { id: 'ckd', label: 'Chronic Kidney Disease', hasStage: true },
  { id: 'cad', label: 'Coronary Artery Disease' },
  { id: 'priorMI', label: 'Prior Myocardial Infarction' },
  { id: 'stroke', label: 'Prior Stroke' },
  { id: 'tia', label: 'Prior TIA' },
  { id: 'pad', label: 'Peripheral Artery Disease' },
  { id: 'heartFailure', label: 'Heart Failure', hasEF: true },
  { id: 'atrialFibrillation', label: 'Atrial Fibrillation' },
];

export const CKD_STAGES = [
  { value: 1, label: 'Stage 1 (eGFR ≥90)' },
  { value: 2, label: 'Stage 2 (eGFR 60-89)' },
  { value: 3, label: 'Stage 3 (eGFR 30-59)' },
  { value: 4, label: 'Stage 4 (eGFR 15-29)' },
  { value: 5, label: 'Stage 5 (eGFR <15)' },
];
```

#### `src/data/guidelines.ts`

```typescript
export const GUIDELINES = {
  BP_2017: '2017 ACC/AHA HTN Guideline',
  CHOLESTEROL_2018: '2018 ACC/AHA Cholesterol Guideline',
  ADA_2024: '2024 ADA Standards of Care',
  KDIGO_2022: '2022 KDIGO Guidelines',
  HF_2022: '2022 ACC/AHA/HFSA Heart Failure Guideline',
  STEMI_2013: '2013 ACCF/AHA STEMI Guideline',
};

export const GUIDELINE_REFERENCES = [
  {
    short: GUIDELINES.BP_2017,
    full: '2017 ACC/AHA/AAPA/ABC/ACPM/AGS/APhA/ASH/ASPC/NMA/PCNA Guideline for the Prevention, Detection, Evaluation, and Management of High Blood Pressure in Adults',
    citation: 'Hypertension. 2018;71:e13-e115',
  },
  {
    short: GUIDELINES.CHOLESTEROL_2018,
    full: '2018 AHA/ACC/AACVPR/AAPA/ABC/ACPM/ADA/AGS/APhA/ASPC/NLA/PCNA Guideline on the Management of Blood Cholesterol',
    citation: 'Circulation. 2019;139:e1082-e1143',
  },
  {
    short: GUIDELINES.ADA_2024,
    full: 'American Diabetes Association Standards of Care in Diabetes - 2024',
    citation: 'Diabetes Care. 2024;47(Suppl 1)',
  },
  {
    short: GUIDELINES.KDIGO_2022,
    full: '2022 KDIGO Clinical Practice Guideline for Diabetes Management in Chronic Kidney Disease',
    citation: 'Kidney Int. 2022;102(5S):S1-S127',
  },
  {
    short: GUIDELINES.HF_2022,
    full: '2022 AHA/ACC/HFSA Guideline for the Management of Heart Failure',
    citation: 'Circulation. 2022;145:e895-e1032',
  },
];

export const KEY_TRIALS = {
  EMPA_REG: 'EMPA-REG OUTCOME: Empagliflozin cardiovascular outcomes in type 2 diabetes (N Engl J Med. 2015;373:2117-2128)',
  SUSTAIN_6: 'SUSTAIN-6: Semaglutide and cardiovascular outcomes in type 2 diabetes (N Engl J Med. 2016;375:1834-1844)',
  DAPA_HF: 'DAPA-HF: Dapagliflozin in patients with heart failure and reduced ejection fraction (N Engl J Med. 2019;381:1995-2008)',
  PARADIGM_HF: 'PARADIGM-HF: Angiotensin-neprilysin inhibition versus enalapril in heart failure (N Engl J Med. 2014;371:993-1004)',
};
```

#### `src/data/index.ts`

```typescript
export * from './medications';
export * from './conditions';
export * from './guidelines';
```

---

### Phase 4: Clinical Calculations

#### `src/logic/calculations/bmi.ts`

```typescript
export function calculateBMI(heightFeet: number, heightInches: number, weightLbs: number): number {
  const totalInches = heightFeet * 12 + heightInches;
  const heightMeters = totalInches * 0.0254;
  const weightKg = weightLbs * 0.453592;
  return weightKg / (heightMeters * heightMeters);
}

export function categorizeBMI(bmi: number): string {
  if (bmi < 18.5) return 'Underweight';
  if (bmi < 25) return 'Normal';
  if (bmi < 30) return 'Overweight';
  if (bmi < 35) return 'Obese Class I';
  if (bmi < 40) return 'Obese Class II';
  return 'Obese Class III';
}
```

#### `src/logic/calculations/egfr.ts`

```typescript
/**
 * eGFR Calculator using CKD-EPI Equation (2021)
 * Reference: NEJM 2021;385:1737-1749
 */

export function calculateEGFR(creatinine: number, age: number, sex: 'male' | 'female'): number {
  const isFemale = sex === 'female';
  const kappa = isFemale ? 0.7 : 0.9;
  const alpha = isFemale ? -0.241 : -0.302;
  const sexFactor = isFemale ? 1.012 : 1;

  const creatinineRatio = creatinine / kappa;
  const minValue = Math.min(creatinineRatio, 1);
  const maxValue = Math.max(creatinineRatio, 1);

  const egfr =
    142 *
    Math.pow(minValue, alpha) *
    Math.pow(maxValue, -1.2) *
    Math.pow(0.9938, age) *
    sexFactor;

  return Math.round(egfr);
}

export function stageCKD(egfr: number): number {
  if (egfr >= 90) return 1;
  if (egfr >= 60) return 2;
  if (egfr >= 30) return 3;
  if (egfr >= 15) return 4;
  return 5;
}
```

#### `src/logic/calculations/bpClassification.ts`

```typescript
import { BPClassification } from '../../types';

export function classifyBloodPressure(systolic: number, diastolic: number): BPClassification {
  if (systolic >= 180 || diastolic >= 120) {
    return 'Hypertensive Crisis';
  }
  if (systolic >= 140 || diastolic >= 90) {
    return 'Stage 2 Hypertension';
  }
  if (systolic >= 130 || diastolic >= 80) {
    return 'Stage 1 Hypertension';
  }
  if (systolic >= 120 && diastolic < 80) {
    return 'Elevated';
  }
  return 'Normal';
}

export function calculateAverageBP(readings: { systolic: number; diastolic: number }[]): {
  systolic: number;
  diastolic: number;
} {
  if (readings.length === 0) {
    return { systolic: 0, diastolic: 0 };
  }

  const sum = readings.reduce(
    (acc, reading) => ({
      systolic: acc.systolic + reading.systolic,
      diastolic: acc.diastolic + reading.diastolic,
    }),
    { systolic: 0, diastolic: 0 }
  );

  return {
    systolic: Math.round(sum.systolic / readings.length),
    diastolic: Math.round(sum.diastolic / readings.length),
  };
}

export function determineBPTarget(params: {
  hasASCVD: boolean;
  hasDiabetes: boolean;
  hasCKD: boolean;
  ascvdRisk?: number;
}): { systolic: number; diastolic: number; rationale: string } {
  const { hasASCVD, hasDiabetes, hasCKD, ascvdRisk } = params;

  if (hasASCVD || hasDiabetes || hasCKD || (ascvdRisk && ascvdRisk >= 10)) {
    return {
      systolic: 130,
      diastolic: 80,
      rationale: 'Target <130/80 per 2017 ACC/AHA (high CV risk or clinical ASCVD)',
    };
  }

  return {
    systolic: 130,
    diastolic: 80,
    rationale: 'Target <130/80 per 2017 ACC/AHA guideline',
  };
}
```

#### `src/logic/calculations/ascvd.ts`

```typescript
/**
 * ASCVD Risk Calculator
 * Based on 2013 ACC/AHA Pooled Cohort Equations
 * Reference: Circulation. 2014;129:S49-S73
 */

interface ASCVDInputs {
  age: number;
  sex: 'male' | 'female';
  race: 'white' | 'black' | 'hispanic' | 'asian' | 'other';
  totalCholesterol: number;
  hdl: number;
  systolicBP: number;
  onBPMeds: boolean;
  diabetic: boolean;
  smoker: boolean;
}

export function calculateASCVDRisk(inputs: ASCVDInputs): number {
  const { age, sex, race, totalCholesterol, hdl, systolicBP, onBPMeds, diabetic, smoker } = inputs;

  if (age < 40 || age > 79) {
    return 0;
  }

  const isBlack = race === 'black';
  const isFemale = sex === 'female';

  const lnAge = Math.log(age);
  const lnTotalChol = Math.log(totalCholesterol);
  const lnHDL = Math.log(hdl);
  const lnSBP = onBPMeds ? 0 : Math.log(systolicBP);
  const lnSBPTreated = onBPMeds ? Math.log(systolicBP) : 0;
  const lnAge2 = lnAge * lnAge;
  const lnAgeTotalChol = lnAge * lnTotalChol;
  const lnAgeHDL = lnAge * lnHDL;
  const lnAgeSBP = lnAge * lnSBP;
  const lnAgeSBPTreated = lnAge * lnSBPTreated;
  const lnAgeSmoker = smoker ? lnAge : 0;
  const lnAgeDiabetic = diabetic ? lnAge : 0;

  let coefficients: { [key: string]: number };
  let meanCoefficient: number;
  let baselineSurvival: number;

  if (isFemale && isBlack) {
    coefficients = {
      lnAge: 17.1141,
      lnAge2: 0,
      lnTotalChol: 0.9396,
      lnAgeTotalChol: 0,
      lnHDL: -18.9196,
      lnAgeHDL: 4.4748,
      lnSBPTreated: 29.2907,
      lnAgeSBPTreated: -6.4321,
      lnSBP: 27.8197,
      lnAgeSBP: -6.0873,
      smoker: 0.6908,
      lnAgeSmoker: 0,
      diabetic: 0.8738,
      lnAgeDiabetic: 0,
    };
    meanCoefficient = 86.6081;
    baselineSurvival = 0.9533;
  } else if (isFemale && !isBlack) {
    coefficients = {
      lnAge: -29.799,
      lnAge2: 4.884,
      lnTotalChol: 13.54,
      lnAgeTotalChol: -3.114,
      lnHDL: -13.578,
      lnAgeHDL: 3.149,
      lnSBPTreated: 2.019,
      lnAgeSBPTreated: 0,
      lnSBP: 1.957,
      lnAgeSBP: 0,
      smoker: 7.574,
      lnAgeSmoker: -1.665,
      diabetic: 0.661,
      lnAgeDiabetic: 0,
    };
    meanCoefficient = -29.18;
    baselineSurvival = 0.9665;
  } else if (!isFemale && isBlack) {
    coefficients = {
      lnAge: 2.469,
      lnAge2: 0,
      lnTotalChol: 0.302,
      lnAgeTotalChol: 0,
      lnHDL: -0.307,
      lnAgeHDL: 0,
      lnSBPTreated: 1.916,
      lnAgeSBPTreated: 0,
      lnSBP: 1.809,
      lnAgeSBP: 0,
      smoker: 0.549,
      lnAgeSmoker: 0,
      diabetic: 0.645,
      lnAgeDiabetic: 0,
    };
    meanCoefficient = 19.5425;
    baselineSurvival = 0.8954;
  } else {
    coefficients = {
      lnAge: 12.344,
      lnAge2: 0,
      lnTotalChol: 11.853,
      lnAgeTotalChol: -2.664,
      lnHDL: -7.99,
      lnAgeHDL: 1.769,
      lnSBPTreated: 1.797,
      lnAgeSBPTreated: 0,
      lnSBP: 1.764,
      lnAgeSBP: 0,
      smoker: 7.837,
      lnAgeSmoker: -1.795,
      diabetic: 0.658,
      lnAgeDiabetic: 0,
    };
    meanCoefficient = 61.18;
    baselineSurvival = 0.9144;
  }

  let individualSum =
    coefficients.lnAge * lnAge +
    coefficients.lnAge2 * lnAge2 +
    coefficients.lnTotalChol * lnTotalChol +
    coefficients.lnAgeTotalChol * lnAgeTotalChol +
    coefficients.lnHDL * lnHDL +
    coefficients.lnAgeHDL * lnAgeHDL +
    coefficients.lnSBPTreated * lnSBPTreated +
    coefficients.lnAgeSBPTreated * lnAgeSBPTreated +
    coefficients.lnSBP * lnSBP +
    coefficients.lnAgeSBP * lnAgeSBP +
    (smoker ? coefficients.smoker : 0) +
    coefficients.lnAgeSmoker * lnAgeSmoker +
    (diabetic ? coefficients.diabetic : 0) +
    coefficients.lnAgeDiabetic * lnAgeDiabetic;

  const risk = 1 - Math.pow(baselineSurvival, Math.exp(individualSum - meanCoefficient));

  return Math.round(risk * 1000) / 10;
}

export function categorizeASCVDRisk(risk: number): 'low' | 'borderline' | 'intermediate' | 'high' {
  if (risk < 5) return 'low';
  if (risk < 7.5) return 'borderline';
  if (risk < 20) return 'intermediate';
  return 'high';
}
```

#### `src/logic/calculations/index.ts`

```typescript
import { PatientData, ClinicalCalculations } from '../../types';
import { calculateBMI } from './bmi';
import { calculateEGFR, stageCKD } from './egfr';
import { calculateAverageBP, classifyBloodPressure, determineBPTarget } from './bpClassification';
import { calculateASCVDRisk, categorizeASCVDRisk } from './ascvd';

export function performClinicalCalculations(patientData: PatientData): ClinicalCalculations {
  const { demographics, history, labs, bpReadings } = patientData;

  // BMI
  const bmi = calculateBMI(demographics.heightFeet, demographics.heightInches, demographics.weightLbs);

  // eGFR
  const egfr = labs.creatinine ? calculateEGFR(labs.creatinine, demographics.age, demographics.sex) : 0;
  const ckdStage = egfr > 0 ? stageCKD(egfr) : history.ckdStage || 0;

  // BP
  const averageBP = calculateAverageBP(bpReadings);
  const bpClassification = classifyBloodPressure(averageBP.systolic, averageBP.diastolic);

  // ASCVD
  const hasMinimalLabsForASCVD = labs.totalCholesterol && labs.hdl && averageBP.systolic > 0;
  const ascvdRisk = hasMinimalLabsForASCVD
    ? calculateASCVDRisk({
        age: demographics.age,
        sex: demographics.sex,
        race: demographics.race,
        totalCholesterol: labs.totalCholesterol!,
        hdl: labs.hdl!,
        systolicBP: averageBP.systolic,
        onBPMeds: patientData.medications.some((m) =>
          ['ACE Inhibitor', 'ARB', 'Beta Blocker', 'Calcium Channel Blocker', 'Diuretic - Thiazide'].includes(
            m.category
          )
        ),
        diabetic: history.diabetes,
        smoker: demographics.smokingStatus === 'current',
      })
    : 0;

  const ascvdCategory = categorizeASCVDRisk(ascvdRisk);

  // Determine targets
  const hasASCVD = history.cad || history.priorMI || history.stroke || history.pad;
  const bpTarget = determineBPTarget({
    hasASCVD,
    hasDiabetes: history.diabetes,
    hasCKD: history.ckd || egfr < 60,
    ascvdRisk,
  });

  // LDL goal
  let ldlGoal = 100;
  if (hasASCVD) ldlGoal = 70;
  if (hasASCVD && ascvdRisk >= 20) ldlGoal = 55;

  // A1c goal
  const a1cGoal = 7;

  return {
    bmi,
    egfr,
    averageBP,
    bpClassification,
    bpTarget,
    ascvdRisk,
    ascvdCategory,
    ckdStage,
    ldlGoal,
    a1cGoal,
  };
}

export * from './bmi';
export * from './egfr';
export * from './bpClassification';
export * from './ascvd';
```

---

### Phase 5: Recommendation Engines

#### `src/logic/recommendations/bloodPressure.ts`

```typescript
import { PatientData, ClinicalCalculations, DomainRecommendation, Medication } from '../../types';
import { GUIDELINES } from '../../data/guidelines';

export function generateBPRecommendations(
  patientData: PatientData,
  calculations: ClinicalCalculations
): DomainRecommendation[] {
  const recommendations: DomainRecommendation[] = [];
  const { medications, history, labs, allergies } = patientData;
  const { averageBP, bpClassification, egfr, bpTarget } = calculations;

  const currentBPMeds = medications.filter((m) =>
    ['ACE Inhibitor', 'ARB', 'Beta Blocker', 'Calcium Channel Blocker', 'Diuretic - Thiazide', 'Diuretic - Loop'].includes(m.category)
  );

  const hasACEI = medications.some((m) => m.category === 'ACE Inhibitor');
  const hasARB = medications.some((m) => m.category === 'ARB');
  const hasCCB = medications.some((m) => m.category === 'Calcium Channel Blocker');
  const hasBetaBlocker = medications.some((m) => m.category === 'Beta Blocker');

  const bpAboveTarget = averageBP.systolic > bpTarget.systolic || averageBP.diastolic > bpTarget.diastolic;

  // HIGH PRIORITY: CKD or Diabetes needs ACE-I/ARB
  if ((history.ckd || history.diabetes || egfr < 60) && !hasACEI && !hasARB) {
    const hasACEAllergy = allergies.some(
      (a) => a.medication.toLowerCase().includes('ace') || a.medication.toLowerCase().includes('lisinopril')
    );

    recommendations.push({
      priority: 'HIGH',
      action: 'ADD',
      medication: hasACEAllergy ? 'Losartan' : 'Lisinopril',
      recommendedDose: hasACEAllergy ? '50mg daily' : '10mg daily',
      rationale: `${history.ckd ? 'CKD' : 'Diabetes'} requires ACE-I/ARB for renoprotection and BP control${
        hasACEAllergy ? '; ARB chosen due to ACE-I allergy' : ''
      }`,
      evidence: GUIDELINES.BP_2017,
      monitoring: 'BMP at 2 weeks (check Cr, K+ after initiation)',
    });
  }

  // HIGH PRIORITY: Stage 2 HTN requires 2-drug therapy
  if (bpClassification === 'Stage 2 Hypertension' && currentBPMeds.length < 2 && bpAboveTarget) {
    if (!hasCCB) {
      recommendations.push({
        priority: 'HIGH',
        action: 'ADD',
        medication: 'Amlodipine',
        recommendedDose: '5mg daily',
        rationale:
          'Stage 2 HTN requires 2-drug combination therapy; CCB is complementary to ACE-I and safe in CKD (no dose adjustment needed)',
        evidence: GUIDELINES.BP_2017,
      });
    }
  }

  // HIGH PRIORITY: Post-MI requires beta-blocker
  if (history.priorMI && !hasBetaBlocker) {
    recommendations.push({
      priority: 'HIGH',
      action: 'ADD',
      medication: 'Metoprolol succinate',
      recommendedDose: '25mg daily, titrate to 100-200mg',
      rationale: 'Post-MI patients require beta-blocker for secondary prevention; reduces mortality by 20-30%',
      evidence: GUIDELINES.STEMI_2013,
      monitoring: 'Monitor heart rate (goal 50-60 bpm) and BP',
    });
  }

  // MODERATE PRIORITY: Uptitrate existing BP meds
  if (bpAboveTarget) {
    currentBPMeds.forEach((med) => {
      const titration = canTitrateBPMed(med, labs, egfr);
      if (titration.possible) {
        recommendations.push({
          priority: 'MODERATE',
          action: 'INCREASE',
          medication: med.genericName,
          currentDose: med.dose,
          recommendedDose: titration.newDose,
          rationale: `BP ${averageBP.systolic}/${averageBP.diastolic} mmHg, well above target <${bpTarget.systolic}/${bpTarget.diastolic}; currently tolerating ${med.dose} without adverse effects`,
          evidence: GUIDELINES.BP_2017,
          monitoring: titration.monitoring,
        });
      }
    });
  }

  return sortByPriority(recommendations);
}

function canTitrateBPMed(
  med: Medication,
  labs: any,
  egfr: number
): { possible: boolean; newDose: string; monitoring?: string } {
  const genericLower = med.genericName.toLowerCase();

  if (genericLower.includes('lisinopril')) {
    const currentDose = parseInt(med.dose);
    if (currentDose < 40 && (!labs.potassium || labs.potassium < 5.5) && egfr > 30) {
      return {
        possible: true,
        newDose: `${Math.min(currentDose * 2, 40)}mg daily`,
        monitoring: 'BMP at 2 weeks (check Cr, K+ after dose increase)',
      };
    }
  }

  if (genericLower.includes('amlodipine')) {
    const currentDose = parseFloat(med.dose);
    if (currentDose < 10) {
      return {
        possible: true,
        newDose: `${Math.min(currentDose + 2.5, 10)}mg daily`,
      };
    }
  }

  if (genericLower.includes('losartan')) {
    const currentDose = parseInt(med.dose);
    if (currentDose < 100 && (!labs.potassium || labs.potassium < 5.5) && egfr > 30) {
      return {
        possible: true,
        newDose: `${Math.min(currentDose * 2, 100)}mg daily`,
        monitoring: 'BMP at 2 weeks (check Cr, K+ after dose increase)',
      };
    }
  }

  return { possible: false, newDose: med.dose };
}

function sortByPriority(recommendations: DomainRecommendation[]): DomainRecommendation[] {
  const priorityOrder = { HIGH: 1, MODERATE: 2, LOW: 3 };
  return recommendations.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
}
```

#### `src/logic/recommendations/lipids.ts`

```typescript
import { PatientData, ClinicalCalculations, DomainRecommendation } from '../../types';
import { GUIDELINES } from '../../data/guidelines';

export function generateLipidRecommendations(
  patientData: PatientData,
  calculations: ClinicalCalculations
): DomainRecommendation[] {
  const recommendations: DomainRecommendation[] = [];
  const { history, demographics, labs, medications } = patientData;
  const { ascvdRisk, ldlGoal } = calculations;

  const hasASCVD = history.cad || history.priorMI || history.stroke || history.pad;
  const hasDiabetes = history.diabetes;
  const ldl = labs.ldl || 0;

  const currentStatin = medications.find((m) => m.category === 'Statin');

  const highIntensityStatins = ['atorvastatin 40', 'atorvastatin 80', 'rosuvastatin 20', 'rosuvastatin 40'];

  const isHighIntensity =
    currentStatin &&
    highIntensityStatins.some((s) => `${currentStatin.genericName.toLowerCase()} ${currentStatin.dose}`.includes(s));

  // HIGH PRIORITY: Clinical ASCVD needs high-intensity statin
  if (hasASCVD && !currentStatin) {
    recommendations.push({
      priority: 'HIGH',
      action: 'ADD',
      medication: 'Atorvastatin',
      recommendedDose: '40mg daily',
      rationale: 'Clinical ASCVD (secondary prevention) requires high-intensity statin therapy with LDL goal <70 mg/dL',
      evidence: GUIDELINES.CHOLESTEROL_2018,
      monitoring: 'Lipid panel at 3 months to assess LDL response',
    });
  }

  // HIGH PRIORITY: Upgrade to high-intensity if on moderate
  if (hasASCVD && currentStatin && !isHighIntensity) {
    const isAtorvastatin = currentStatin.genericName.toLowerCase().includes('atorvastatin');
    const isRosuvastatin = currentStatin.genericName.toLowerCase().includes('rosuvastatin');

    let newDose = '40mg daily';
    if (isRosuvastatin) newDose = '20mg daily';

    recommendations.push({
      priority: 'HIGH',
      action: 'INCREASE',
      medication: currentStatin.genericName,
      currentDose: currentStatin.dose,
      recommendedDose: newDose,
      rationale: `Clinical ASCVD requires high-intensity statin therapy with LDL goal <${ldlGoal} mg/dL for secondary prevention`,
      evidence: GUIDELINES.CHOLESTEROL_2018,
      monitoring: 'Lipid panel at 3 months to assess LDL response',
    });
  }

  // MODERATE PRIORITY: Add ezetimibe if LDL not at goal
  if (hasASCVD && isHighIntensity && ldl >= ldlGoal) {
    const hasEzetimibe = medications.some((m) => m.genericName.toLowerCase().includes('ezetimibe'));

    if (!hasEzetimibe) {
      recommendations.push({
        priority: 'MODERATE',
        action: 'CONSIDER',
        medication: 'Ezetimibe',
        recommendedDose: '10mg daily',
        rationale: `LDL ${ldl} mg/dL on high-intensity statin, goal <${ldlGoal} mg/dL; ezetimibe provides additional 15-20% LDL reduction`,
        evidence: GUIDELINES.CHOLESTEROL_2018,
        additionalNotes: 'IMPROVE-IT trial showed CV benefit when added to statin post-ACS',
      });
    }
  }

  // MODERATE PRIORITY: Diabetes 40-75 needs statin
  if (hasDiabetes && demographics.age >= 40 && demographics.age <= 75 && !currentStatin) {
    const needsHighIntensity = ascvdRisk >= 20;

    recommendations.push({
      priority: 'MODERATE',
      action: 'ADD',
      medication: 'Atorvastatin',
      recommendedDose: needsHighIntensity ? '40mg daily' : '10mg daily',
      rationale: `Diabetes age 40-75 with ASCVD risk ${ascvdRisk.toFixed(1)}% requires ${
        needsHighIntensity ? 'high' : 'moderate'
      }-intensity statin for primary prevention`,
      evidence: GUIDELINES.CHOLESTEROL_2018,
      monitoring: 'Lipid panel at 3 months',
    });
  }

  // HIGH PRIORITY: LDL ≥190 needs high-intensity statin
  if (ldl >= 190 && !isHighIntensity) {
    recommendations.push({
      priority: 'HIGH',
      action: currentStatin ? 'INCREASE' : 'ADD',
      medication: 'Atorvastatin',
      currentDose: currentStatin?.dose,
      recommendedDose: '40mg daily',
      rationale:
        'LDL ≥190 mg/dL (severe hypercholesterolemia) requires high-intensity statin regardless of ASCVD risk',
      evidence: GUIDELINES.CHOLESTEROL_2018,
      monitoring: 'Lipid panel at 3 months; consider adding ezetimibe if LDL remains >190',
    });
  }

  return sortByPriority(recommendations);
}

function sortByPriority(recommendations: DomainRecommendation[]): DomainRecommendation[] {
  const priorityOrder = { HIGH: 1, MODERATE: 2, LOW: 3 };
  return recommendations.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
}
```

#### `src/logic/recommendations/diabetes.ts`

```typescript
import { PatientData, ClinicalCalculations, DomainRecommendation } from '../../types';
import { GUIDELINES } from '../../data/guidelines';

export function generateDiabetesRecommendations(
  patientData: PatientData,
  calculations: ClinicalCalculations
): DomainRecommendation[] {
  const recommendations: DomainRecommendation[] = [];
  const { history, labs, medications } = patientData;
  const { egfr, ascvdRisk } = calculations;

  if (!history.diabetes) {
    return recommendations;
  }

  const a1c = labs.a1c || 0;
  const hasMetformin = medications.some((m) => m.genericName.toLowerCase().includes('metformin'));
  const hasSGLT2i = medications.some((m) => m.category === 'Diabetes - SGLT2i');
  const hasGLP1 = medications.some((m) => m.category === 'Diabetes - GLP-1 RA');

  const hasASCVD = history.cad || history.priorMI || history.stroke || history.pad;
  const hasHF = history.heartFailure;
  const hasCKD = history.ckd || egfr < 60;

  const highCVRisk = hasASCVD || hasHF || hasCKD || ascvdRisk >= 15;

  // HIGH PRIORITY: Metformin if not on it
  if (!hasMetformin && egfr >= 30) {
    recommendations.push({
      priority: 'HIGH',
      action: 'ADD',
      medication: 'Metformin',
      recommendedDose: '500mg daily, titrate to 1000mg twice daily',
      rationale: 'First-line agent for type 2 diabetes; improves insulin sensitivity, no hypoglycemia risk, weight neutral',
      evidence: GUIDELINES.ADA_2024,
      monitoring: 'A1c at 3 months; titrate dose as tolerated for GI side effects',
      additionalNotes: egfr >= 30 && egfr < 45 ? 'eGFR 30-45: Use caution, max dose 1000mg BID' : undefined,
    });
  }

  // HIGH PRIORITY: SGLT2i for diabetes + high CV risk
  if (highCVRisk && !hasSGLT2i && egfr >= 20) {
    const indication = hasASCVD
      ? 'established CAD'
      : hasHF
      ? 'heart failure'
      : hasCKD
      ? 'CKD'
      : 'high cardiovascular risk';

    recommendations.push({
      priority: 'HIGH',
      action: 'ADD',
      medication: 'Empagliflozin',
      recommendedDose: '10mg daily',
      rationale: `Type 2 diabetes with ${indication}; SGLT2 inhibitors provide proven cardiovascular mortality reduction (25%) and renal protection`,
      evidence: GUIDELINES.ADA_2024,
      additionalNotes: 'EMPA-REG OUTCOME trial demonstrated CV benefit',
      monitoring:
        'eGFR may transiently dip 3-5 mL/min (expected hemodynamic effect, beneficial long-term); genital mycotic infections (10-15% incidence)',
    });
  }

  // MODERATE PRIORITY: GLP-1 RA for additional benefit
  if (highCVRisk && !hasGLP1 && a1c > 7) {
    recommendations.push({
      priority: 'MODERATE',
      action: 'CONSIDER',
      medication: 'Semaglutide',
      recommendedDose: '0.25mg weekly, titrate to 0.5-1mg weekly',
      rationale:
        'Dual therapy with SGLT2i + GLP-1 RA shows additive CV benefit in high-risk patients; additional A1c reduction 1-1.5% and weight loss 10-15 lbs',
      evidence: GUIDELINES.ADA_2024,
      additionalNotes:
        'SUSTAIN-6 trial demonstrated CV benefit; discuss cost, injection burden, and GI tolerability with patient',
      monitoring: 'Start low dose to minimize nausea; titrate every 4 weeks',
    });
  }

  return sortByPriority(recommendations);
}

function sortByPriority(recommendations: DomainRecommendation[]): DomainRecommendation[] {
  const priorityOrder = { HIGH: 1, MODERATE: 2, LOW: 3 };
  return recommendations.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
}
```

#### `src/logic/recommendations/lifestyle.ts`

```typescript
import { PatientData, ClinicalCalculations, DomainRecommendation } from '../../types';
import { GUIDELINES } from '../../data/guidelines';

export function generateLifestyleRecommendations(
  patientData: PatientData,
  calculations: ClinicalCalculations
): DomainRecommendation[] {
  const recommendations: DomainRecommendation[] = [];
  const { demographics, history } = patientData;
  const { bmi, bpClassification } = calculations;

  // Smoking cessation - HIGHEST PRIORITY
  if (demographics.smokingStatus === 'current') {
    recommendations.push({
      priority: 'HIGH',
      action: 'ADD',
      medication: 'Smoking Cessation',
      recommendedDose: '',
      rationale:
        'Current smoking is the single greatest modifiable CV risk factor; cessation reduces MI risk by 50% within 1 year',
      evidence: 'Multiple guidelines; overwhelming benefit',
      additionalNotes:
        'Resources: Nicotine replacement (patch + gum/lozenge combination), varenicline, or bupropion; behavioral counseling via 1-800-QUIT-NOW',
    });
  }

  // Dietary modifications
  if (bpClassification !== 'Normal' || history.diabetes || bmi >= 25) {
    recommendations.push({
      priority: 'HIGH',
      action: 'ADD',
      medication: 'Dietary Modification',
      recommendedDose: '',
      rationale: '',
      evidence: GUIDELINES.BP_2017,
      additionalNotes: `DASH diet: High in fruits, vegetables, whole grains; low in saturated fat
Sodium restriction: <2000mg daily (ideally <1500mg)
Expected impact: 5-8 mmHg systolic BP reduction`,
    });
  }

  // Weight loss and exercise
  if (bmi >= 25) {
    const targetWeightLoss = Math.round((bmi - 25) * (demographics.weightLbs / bmi));

    recommendations.push({
      priority: 'HIGH',
      action: 'ADD',
      medication: 'Weight Loss and Physical Activity',
      recommendedDose: '',
      rationale: '',
      evidence: 'Multiple guidelines',
      additionalNotes: `Target: ${targetWeightLoss} lb weight loss (current BMI ${bmi.toFixed(
        1
      )}, goal <30)
Exercise: 150 minutes/week moderate aerobic activity (brisk walking, cycling)
Expected impact: 5 mmHg BP reduction per 10 kg lost; improved glucose control`,
    });
  }

  return recommendations;
}
```

#### `src/logic/recommendations/index.ts`

```typescript
import { PatientData, ClinicalCalculations, ClinicalDomain, DomainName } from '../../types';
import { generateBPRecommendations } from './bloodPressure';
import { generateLipidRecommendations } from './lipids';
import { generateDiabetesRecommendations } from './diabetes';
import { generateLifestyleRecommendations } from './lifestyle';

const DOMAIN_DISPLAY_NAMES: Record<DomainName, string> = {
  BLOOD_PRESSURE: 'BLOOD PRESSURE MANAGEMENT',
  LIPID_MANAGEMENT: 'LIPID MANAGEMENT',
  DIABETES_CARDIORENAL: 'DIABETES & CARDIORENAL PROTECTION',
  HEART_FAILURE: 'HEART FAILURE MANAGEMENT',
  ANTIPLATELET_ANTICOAGULATION: 'ANTIPLATELET & ANTICOAGULATION',
  RISK_FACTOR_MODIFICATION: 'RISK FACTOR MODIFICATION',
};

export function generateAllDomainRecommendations(
  patientData: PatientData,
  calculations: ClinicalCalculations
): ClinicalDomain[] {
  const domains: ClinicalDomain[] = [];

  // Blood Pressure Domain
  const bpRecs = generateBPRecommendations(patientData, calculations);
  if (bpRecs.length > 0) {
    domains.push({
      name: 'BLOOD_PRESSURE',
      displayName: DOMAIN_DISPLAY_NAMES.BLOOD_PRESSURE,
      currentStatus: `Current: ${calculations.averageBP.systolic}/${calculations.averageBP.diastolic} | Target: <${calculations.bpTarget.systolic}/${calculations.bpTarget.diastolic}`,
      recommendations: bpRecs,
      order: 1,
    });
  }

  // Lipid Domain
  const lipidRecs = generateLipidRecommendations(patientData, calculations);
  if (lipidRecs.length > 0) {
    domains.push({
      name: 'LIPID_MANAGEMENT',
      displayName: DOMAIN_DISPLAY_NAMES.LIPID_MANAGEMENT,
      currentStatus: `Current LDL: ${patientData.labs.ldl || 'N/A'} mg/dL | Goal: <${calculations.ldlGoal} mg/dL`,
      recommendations: lipidRecs,
      order: 2,
    });
  }

  // Diabetes Domain
  const diabetesRecs = generateDiabetesRecommendations(patientData, calculations);
  if (diabetesRecs.length > 0) {
    domains.push({
      name: 'DIABETES_CARDIORENAL',
      displayName: DOMAIN_DISPLAY_NAMES.DIABETES_CARDIORENAL,
      currentStatus: `A1c: ${patientData.labs.a1c || 'N/A'}% (goal <${calculations.a1cGoal}%) | eGFR: ${
        calculations.egfr
      } mL/min/1.73m2`,
      recommendations: diabetesRecs,
      order: 3,
    });
  }

  // Lifestyle Domain
  const lifestyleRecs = generateLifestyleRecommendations(patientData, calculations);
  if (lifestyleRecs.length > 0) {
    domains.push({
      name: 'RISK_FACTOR_MODIFICATION',
      displayName: DOMAIN_DISPLAY_NAMES.RISK_FACTOR_MODIFICATION,
      currentStatus: '',
      recommendations: lifestyleRecs,
      order: 6,
    });
  }

  return domains.sort((a, b) => a.order - b.order);
}

export * from './bloodPressure';
export * from './lipids';
export * from './diabetes';
export * from './lifestyle';
```

---

### Phase 6: Report Generation

#### `src/logic/report/generateReport.ts`

```typescript
import { PatientData, ClinicalCalculations, ClinicalReport, MedicationReview, Medication } from '../../types';
import { generateAllDomainRecommendations } from '../recommendations';
import { buildMonitoringPlan } from './monitoringPlan';

export function generateClinicalReport(
  patientData: PatientData,
  calculations: ClinicalCalculations
): ClinicalReport {
  // Review current medications
  const medicationReview = reviewCurrentMedications(patientData, calculations);

  // Generate all domain recommendations
  const domains = generateAllDomainRecommendations(patientData, calculations);

  // Build monitoring plan
  const monitoringPlan = buildMonitoringPlan(domains, patientData, calculations);

  // Build header
  const header = buildHeader(patientData, calculations);

  // Build risk profile
  const riskProfile = buildRiskProfile(patientData, calculations);

  // Build follow-up plan
  const followUpPlan = buildFollowUpPlan(calculations, domains);

  // Compile references
  const references = compileReferences(domains);

  return {
    header,
    riskProfile,
    medicationReview,
    domains,
    monitoringPlan,
    followUpPlan,
    references,
  };
}

function buildHeader(patientData: PatientData, calculations: ClinicalCalculations): string {
  const { demographics } = patientData;
  const smokingText =
    demographics.smokingStatus === 'current'
      ? 'Current Smoker'
      : demographics.smokingStatus === 'former'
      ? 'Former Smoker'
      : 'Never Smoked';

  return `Patient: ${demographics.age}yo ${capitalize(demographics.race)} ${capitalize(
    demographics.sex
  )} | BMI: ${calculations.bmi.toFixed(1)} | Smoking: ${smokingText}
Generated: ${new Date().toLocaleDateString()}`;
}

function buildRiskProfile(patientData: PatientData, calculations: ClinicalCalculations): string {
  const { history, labs } = patientData;
  const { averageBP, bpClassification, ascvdRisk, ascvdCategory, egfr, ckdStage } = calculations;

  let profile = `BP: ${averageBP.systolic}/${averageBP.diastolic} mmHg (${bpClassification}) | Target: <${calculations.bpTarget.systolic}/${calculations.bpTarget.diastolic}\n`;

  if (ascvdRisk > 0) {
    profile += `ASCVD 10-Year Risk: ${ascvdRisk.toFixed(1)}% (${capitalize(ascvdCategory)} Risk)\n`;
  }

  if (egfr > 0) {
    profile += `Kidney Function: eGFR ${egfr} mL/min/1.73m2 (CKD Stage ${ckdStage})\n`;
  }

  if (history.diabetes && labs.a1c) {
    profile += `Diabetes Control: A1c ${labs.a1c}% (goal <${calculations.a1cGoal}%)\n`;
  }

  if (labs.ldl) {
    profile += `Lipid Status: LDL ${labs.ldl} mg/dL (goal <${calculations.ldlGoal} mg/dL)\n`;
  }

  // Active diagnoses
  const diagnoses: string[] = [];
  if (history.hypertension) diagnoses.push('Hypertension');
  if (history.diabetes) diagnoses.push('Type 2 Diabetes');
  if (history.ckd || ckdStage >= 3) diagnoses.push(`CKD Stage ${ckdStage}`);
  if (history.cad) diagnoses.push('CAD');
  if (history.priorMI) diagnoses.push('Prior MI');
  if (history.stroke) diagnoses.push('Prior Stroke');
  if (history.heartFailure) diagnoses.push('Heart Failure');

  if (diagnoses.length > 0) {
    profile += `\nActive Diagnoses: ${diagnoses.join(', ')}`;
  }

  return profile;
}

function reviewCurrentMedications(patientData: PatientData, calculations: ClinicalCalculations): MedicationReview {
  const review: MedicationReview = {
    continue: [],
    optimize: [],
    discontinue: [],
  };

  patientData.medications.forEach((med) => {
    const needsOptimization = checkIfNeedsOptimization(med, patientData, calculations);

    if (needsOptimization) {
      review.optimize.push({
        medication: `${med.genericName} ${med.dose}`,
        status: 'CONTINUE, optimize below',
      });
    } else {
      review.continue.push({
        medication: `${med.genericName} ${med.dose}`,
        status: 'CONTINUE',
      });
    }
  });

  return review;
}

function checkIfNeedsOptimization(
  med: Medication,
  patientData: PatientData,
  calculations: ClinicalCalculations
): boolean {
  // BP med optimization
  if (['ACE Inhibitor', 'ARB', 'Calcium Channel Blocker'].includes(med.category)) {
    const bpAboveTarget =
      calculations.averageBP.systolic > calculations.bpTarget.systolic ||
      calculations.averageBP.diastolic > calculations.bpTarget.diastolic;
    if (bpAboveTarget) return true;
  }

  // Statin optimization
  if (med.category === 'Statin') {
    const hasASCVD = patientData.history.cad || patientData.history.priorMI || patientData.history.stroke;
    const highIntensityStatins = ['atorvastatin 40', 'atorvastatin 80', 'rosuvastatin 20', 'rosuvastatin 40'];
    const isHighIntensity = highIntensityStatins.some((s) =>
      `${med.genericName} ${med.dose}`.toLowerCase().includes(s)
    );

    if (hasASCVD && !isHighIntensity) return true;
  }

  return false;
}

function buildFollowUpPlan(calculations: ClinicalCalculations, domains: any[]): string {
  let plan = 'Next Appointment: 2-4 weeks\n';
  plan += 'Focus: BP check, review labs (BMP), assess medication tolerability\n\n';
  plan += '3-Month Follow-Up:\n';
  plan += 'Focus: Reassess BP control, review lipid panel and A1c, smoking status\n\n';
  plan += 'Target Goals for Next Visit:\n';
  plan += `• BP <${calculations.bpTarget.systolic}/${calculations.bpTarget.diastolic} mmHg (home readings)\n`;
  plan += '• Medication adherence and tolerability\n';

  const hasSmokingRec = domains.some((d) =>
    d.recommendations.some(
      (r: any) => r.medication.toLowerCase().includes('smoking') || r.rationale.toLowerCase().includes('smoking')
    )
  );
  if (hasSmokingRec) {
    plan += '• Smoking cessation progress\n';
  }

  plan += '• Home BP log review\n\n';
  plan += 'Long-Term Goals:\n';
  plan += `• BP <${calculations.bpTarget.systolic}/${calculations.bpTarget.diastolic} mmHg sustained\n`;
  plan += `• LDL <${calculations.ldlGoal} mg/dL\n`;

  if (calculations.a1cGoal) {
    plan += `• A1c <${calculations.a1cGoal}%\n`;
  }

  if (hasSmokingRec) {
    plan += '• Complete smoking cessation\n';
  }

  return plan;
}

function compileReferences(domains: any[]): string {
  const guidelinesUsed = new Set<string>();
  const trialsUsed = new Set<string>();

  domains.forEach((domain) => {
    domain.recommendations.forEach((rec: any) => {
      guidelinesUsed.add(rec.evidence);
      if (rec.additionalNotes) {
        if (rec.additionalNotes.includes('EMPA-REG')) trialsUsed.add('EMPA-REG OUTCOME');
        if (rec.additionalNotes.includes('SUSTAIN-6')) trialsUsed.add('SUSTAIN-6');
        if (rec.additionalNotes.includes('DAPA-HF')) trialsUsed.add('DAPA-HF');
        if (rec.additionalNotes.includes('PARADIGM-HF')) trialsUsed.add('PARADIGM-HF');
      }
    });
  });

  let refs = 'Guidelines:\n';
  Array.from(guidelinesUsed)
    .filter((g) => g)
    .forEach((guideline, index) => {
      refs += `${index + 1}. ${guideline}\n`;
    });

  if (trialsUsed.size > 0) {
    refs += '\nKey Clinical Trials:\n';
    Array.from(trialsUsed).forEach((trial) => {
      refs += `• ${trial}\n`;
    });
  }

  return refs;
}

function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}
```

#### `src/logic/report/monitoringPlan.ts`

```typescript
import { ClinicalDomain, MonitoringPlan, PatientData, ClinicalCalculations } from '../../types';

export function buildMonitoringPlan(
  domains: ClinicalDomain[],
  patientData: PatientData,
  calculations: ClinicalCalculations
): MonitoringPlan {
  const plan: MonitoringPlan = {
    shortTerm: [],
    mediumTerm: [],
    longTerm: [],
  };

  const allRecs = domains.flatMap((d) => d.recommendations);

  // Short-term monitoring (1-4 weeks)
  const hasACEARB = allRecs.some(
    (r) =>
      (r.action === 'ADD' || r.action === 'INCREASE') &&
      (r.medication.toLowerCase().includes('lisinopril') || r.medication.toLowerCase().includes('losartan'))
  );

  const hasSGLT2i = allRecs.some(
    (r) =>
      r.medication.toLowerCase().includes('empagliflozin') || r.medication.toLowerCase().includes('dapagliflozin')
  );

  if (hasACEARB || hasSGLT2i) {
    plan.shortTerm.push({
      timing: '2 Weeks',
      tests: ['Basic metabolic panel (Cr, eGFR, K+, Na+)'],
      purpose: hasACEARB
        ? 'Safety check after ACE-I/ARB initiation/increase; baseline for SGLT2i'
        : 'Baseline renal function for SGLT2i',
      action: hasACEARB ? 'Hold ACE-I/ARB if K+ >5.5 or Cr increase >30%' : undefined,
    });
  }

  // Home BP monitoring
  const hasBPRecs = domains.some((d) => d.name === 'BLOOD_PRESSURE' && d.recommendations.length > 0);
  if (hasBPRecs) {
    plan.shortTerm.push({
      timing: 'Ongoing',
      tests: ['Home BP monitoring: 2 readings twice daily x 1 week, then weekly'],
      purpose: 'Assess response to BP medication changes',
    });
  }

  // Medium-term monitoring (3 months)
  const hasStatinChange = allRecs.some((r) => r.medication.toLowerCase().includes('statin'));
  if (hasStatinChange) {
    plan.mediumTerm.push({
      timing: '3 Months',
      tests: ['Lipid panel'],
      purpose: 'Assess LDL response to statin therapy',
      action: 'Consider adding ezetimibe if LDL not at goal',
    });
  }

  if (patientData.history.diabetes) {
    plan.mediumTerm.push({
      timing: '3 Months',
      tests: ['Hemoglobin A1c'],
      purpose: 'Assess glucose control (goal <7%)',
    });
  }

  if (hasACEARB || hasSGLT2i) {
    plan.mediumTerm.push({
      timing: '3 Months',
      tests: ['Basic metabolic panel'],
      purpose: 'Monitor renal function',
    });
  }

  // Long-term monitoring
  if (patientData.history.diabetes || patientData.history.ckd || calculations.egfr < 60) {
    plan.longTerm.push({
      timing: '6 Months',
      tests: ['Comprehensive metabolic panel', 'Urine albumin-to-creatinine ratio (UACR)'],
      purpose: 'Monitor proteinuria in CKD/diabetes; guides ACE-I effectiveness',
    });
  }

  plan.longTerm.push({
    timing: 'Annually',
    tests: ['Reassess ASCVD risk, review all risk factors', 'Comprehensive labs (CMP, lipids, A1c, UACR)'],
    purpose: 'Comprehensive cardiovascular risk reassessment',
  });

  return plan;
}
```

#### `src/logic/report/formatReport.ts`

```typescript
import { ClinicalReport } from '../../types';

export function formatReportAsText(report: ClinicalReport): string {
  let output = '';

  // Header
  output += '═'.repeat(60) + '\n';
  output += 'CARDIOVASCULAR RISK OPTIMIZATION SUMMARY\n';
  output += '═'.repeat(60) + '\n';
  output += report.header + '\n\n';

  // Clinical Summary
  output += 'CLINICAL SUMMARY\n';
  output += report.riskProfile + '\n\n';

  // Current Medications
  output += 'CURRENT MEDICATIONS - REVIEWED\n';
  report.medicationReview.continue.forEach((med) => {
    output += `✓ ${med.medication} - ${med.status}\n`;
  });
  report.medicationReview.optimize.forEach((med) => {
    output += `✓ ${med.medication} - ${med.status}\n`;
  });
  output += '\n';

  // Recommendations by Domain
  output += '─'.repeat(60) + '\n';
  output += 'RECOMMENDATIONS BY CLINICAL DOMAIN\n';
  output += '─'.repeat(60) + '\n\n';

  report.domains.forEach((domain) => {
    if (domain.recommendations.length === 0) return;

    output += `${domain.displayName}`;
    if (domain.currentStatus) {
      output += ` [${domain.currentStatus}]`;
    }
    output += '\n\n';

    domain.recommendations.forEach((rec) => {
      output += `[${rec.priority} PRIORITY]\n`;
      output += `• ${rec.action} ${rec.medication}`;

      if (rec.currentDose) {
        output += ` ${rec.currentDose} to ${rec.recommendedDose}`;
      } else if (rec.recommendedDose) {
        output += ` ${rec.recommendedDose}`;
      }

      output += '\n';
      
      if (rec.rationale) {
        output += `  Rationale: ${rec.rationale}\n`;
      }
      
      if (rec.evidence) {
        output += `  Evidence: ${rec.evidence}\n`;
      }

      if (rec.monitoring) {
        output += `  Monitor: ${rec.monitoring}\n`;
      }

      if (rec.additionalNotes) {
        output += `  Note: ${rec.additionalNotes}\n`;
      }

      output += '\n';
    });
  });

  // Monitoring Plan
  output += '─'.repeat(60) + '\n';
  output += 'MONITORING PLAN\n';
  output += '─'.repeat(60) + '\n\n';

  if (report.monitoringPlan.shortTerm.length > 0) {
    report.monitoringPlan.shortTerm.forEach((item) => {
      output += `${item.timing}:\n`;
      item.tests.forEach((test) => {
        output += `• ${test}\n`;
      });
      if (item.purpose) {
        output += `  Purpose: ${item.purpose}\n`;
      }
      if (item.action) {
        output += `  Action: ${item.action}\n`;
      }
      output += '\n';
    });
  }

  if (report.monitoringPlan.mediumTerm.length > 0) {
    report.monitoringPlan.mediumTerm.forEach((item) => {
      output += `${item.timing}:\n`;
      item.tests.forEach((test) => {
        output += `• ${test}\n`;
      });
      if (item.purpose) {
        output += `  Purpose: ${item.purpose}\n`;
      }
      if (item.action) {
        output += `  Action: ${item.action}\n`;
      }
      output += '\n';
    });
  }

  if (report.monitoringPlan.longTerm.length > 0) {
    report.monitoringPlan.longTerm.forEach((item) => {
      output += `${item.timing}:\n`;
      item.tests.forEach((test) => {
        output += `• ${test}\n`;
      });
      if (item.purpose) {
        output += `  Purpose: ${item.purpose}\n`;
      }
      output += '\n';
    });
  }

  // Follow-up Plan
  output += '─'.repeat(60) + '\n';
  output += 'FOLLOW-UP PLAN\n';
  output += '─'.repeat(60) + '\n';
  output += report.followUpPlan + '\n\n';

  // References
  output += '─'.repeat(60) + '\n';
  output += 'EVIDENCE REFERENCES\n';
  output += '─'.repeat(60) + '\n\n';
  output += report.references + '\n\n';

  // Disclaimer
  output += '─'.repeat(60) + '\n';
  output += 'DISCLAIMER\n';
  output += '─'.repeat(60) + '\n';
  output += `This report represents clinical decision support based on current evidence-based guidelines. All recommendations should be verified and individualized based on clinical judgment, patient preferences, complete medication history, and contraindications not captured in this assessment. This tool does not replace comprehensive clinical evaluation.\n`;

  return output;
}
```

---

### Phase 7: Main Application

#### `src/App.tsx`

```typescript
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { PatientData, ClinicalCalculations, ClinicalReport } from './types';
import { performClinicalCalculations } from './logic/calculations';
import { generateClinicalReport } from './logic/report/generateReport';
import { formatReportAsText } from './logic/report/formatReport';

function App() {
  const [report, setReport] = useState<string | null>(null);
  const { register, watch, handleSubmit } = useForm<PatientData>({
    defaultValues: {
      demographics: {
        age: 0,
        sex: 'male',
        race: 'white',
        heightFeet: 5,
        heightInches: 10,
        weightLbs: 200,
        smokingStatus: 'never',
      },
      history: {
        hypertension: false,
        diabetes: false,
        ckd: false,
        cad: false,
        priorMI: false,
        stroke: false,
        tia: false,
        pad: false,
        heartFailure: false,
        atrialFibrillation: false,
      },
      medications: [],
      allergies: [],
      labs: {},
      bpReadings: [],
    },
  });

  const formData = watch();

  const onGenerateReport = () => {
    if (!formData.demographics.age || formData.bpReadings.length === 0) {
      alert('Please fill in at least age and blood pressure readings');
      return;
    }

    const calculations = performClinicalCalculations(formData);
    const clinicalReport = generateClinicalReport(formData, calculations);
    const formattedReport = formatReportAsText(clinicalReport);
    setReport(formattedReport);
  };

  const copyToClipboard = () => {
    if (report) {
      navigator.clipboard.writeText(report);
      alert('Report copied to clipboard!');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold text-gray-900">CV Risk Optimization Calculator</h1>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-5 gap-6 h-[calc(100vh-12rem)]">
          {/* Left Panel - Input Forms */}
          <div className="col-span-2 overflow-auto space-y-6 bg-white p-6 rounded-lg shadow">
            <div>
              <h2 className="text-lg font-semibold mb-4">Patient Demographics</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Age</label>
                  <input
                    type="number"
                    {...register('demographics.age')}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Sex</label>
                  <select {...register('demographics.sex')} className="mt-1 block w-full rounded-md border-gray-300">
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                  </select>
                </div>

                {/* Add more form fields here following the same pattern */}
              </div>
            </div>

            <button
              onClick={onGenerateReport}
              className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
            >
              Generate Report
            </button>
          </div>

          {/* Right Panel - Report Preview */}
          <div className="col-span-3 overflow-hidden bg-white p-6 rounded-lg shadow">
            {report ? (
              <div className="h-full flex flex-col">
                <div className="flex gap-2 mb-4">
                  <button
                    onClick={copyToClipboard}
                    className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                  >
                    Copy to Clipboard
                  </button>
                  <button
                    onClick={() => window.print()}
                    className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700"
                  >
                    Print
                  </button>
                </div>
                <div className="flex-1 overflow-auto bg-gray-50 p-4 rounded border">
                  <pre className="whitespace-pre-wrap font-mono text-sm">{report}</pre>
                </div>
              </div>
            ) : (
              <div className="h-full flex items-center justify-center text-gray-400">
                <p>Fill in patient information and click Generate Report</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;
```

---

## Testing Checklist

### Clinical Logic
- [ ] ASCVD calculator matches reference (test with known values)
- [ ] eGFR calculation correct (CKD-EPI 2021)
- [ ] BP classification accurate
- [ ] BMI calculation correct

### Recommendations
- [ ] Stage 2 HTN triggers 2-drug therapy
- [ ] Clinical ASCVD triggers high-intensity statin
- [ ] Diabetes + ASCVD triggers SGLT2i
- [ ] Post-MI triggers beta-blocker
- [ ] CKD with proteinuria triggers ACE-I/ARB

### Safety
- [ ] ACE-I allergy switches to ARB
- [ ] K+ >5.5 contraindicates ACE-I/ARB/MRA
- [ ] eGFR <30 contraindicates metformin
- [ ] HFrEF contraindicates non-DHP CCB

### UI/UX
- [ ] Forms validate properly
- [ ] Med autocomplete works
- [ ] Report updates live
- [ ] Copy to clipboard works
- [ ] Print stylesheet formats properly
- [ ] Mobile responsive

### Report Quality
- [ ] All recommendations have evidence
- [ ] Priority flags accurate
- [ ] Domain organization clear
- [ ] Monitoring plan appropriate
- [ ] References complete
- [ ] Fits on 1.5-2 pages when printed

---

## Quick Start Commands

```bash
# Install dependencies
npm install

# Development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

---

## Implementation Priority

1. **Phase 1-2**: Setup + Types (1 day)
2. **Phase 3**: Data files (1 day)
3. **Phase 4**: Calculations (2 days)
4. **Phase 5**: Recommendations (3 days)
5. **Phase 6**: Report generation (2 days)
6. **Phase 7**: UI Components (3 days)

**Total estimated time: 12 days**

Start with the clinical logic and gradually build out the UI. Test each calculation thoroughly before moving to the next phase.
