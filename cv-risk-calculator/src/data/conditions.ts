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
