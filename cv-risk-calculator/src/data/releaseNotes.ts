import { version } from '../../package.json';

// Bump package.json and update these notes together for each user-facing release.
export const CURRENT_RELEASE = {
  version,
  date: 'October 1, 2026',
  title: 'A clearer PreCardia assessment',
  summary: 'Work through the assessment in six steps, with related questions together and a review before generating your report. This release also includes the guideline corrections introduced in v1.1.0; the 2026 publication reaffirms the 2024 recommendations.',
  changes: [
    {
      title: 'Guided steps and easier editing',
      description: 'Start with the patient and planned surgery, then review conditions, interventions, function, medications and labs. Move freely between steps, follow field-specific validation links, and edit entries from the review screen. Reports must be regenerated after answers change.',
    },
    {
      title: 'Functional capacity and testing',
      description: 'DASI scores of 34 or less indicate poor capacity, even when estimated METs exceed 4. Stress testing and CCTA now follow one consistent pathway based on risk, capacity, clinical stability and surgical urgency.',
    },
    {
      title: 'Timing after coronary intervention',
      description: 'Stent guidance now accounts for ACS versus chronic coronary disease, calendar-month intervals and planned antiplatelet interruption. Balloon angioplasty and recent stroke/TIA have dedicated timing guidance.',
    },
    {
      title: 'Medication and biomarker guidance',
      description: 'Updated beta-blocker, ACE inhibitor/ARB, SGLT2 inhibitor and anticoagulant guidance. Preoperative biomarkers and postoperative troponin surveillance now use the guideline’s eligibility criteria.',
    },
    {
      title: 'Clearer risk reports',
      description: 'RCRI reports no longer assign a fixed individualized MACE percentage. Reports distinguish unknown information, use the correct 2021 eGFR equation and remove unsupported blanket waiting periods after TAVR, TEER, MI and CABG.',
    },
  ],
};
