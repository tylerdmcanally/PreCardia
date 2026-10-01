export const ASSESSMENT_STEPS = [
  { title: 'Patient & surgery', description: 'Patient details, procedure and urgency.' },
  { title: 'Cardiac conditions', description: 'Current symptoms and medical history.' },
  { title: 'Interventions & devices', description: 'Prior procedures, stents and implanted devices.' },
  { title: 'Functional capacity', description: 'Daily activities and frailty assessment.' },
  { title: 'Medications & labs', description: 'Current treatment and available laboratory results.' },
  { title: 'Review & report', description: 'Check the entered information and generate your report.' },
] as const;

export interface AssessmentError {
  step: number;
  field: string;
  message: string;
}
