import { version } from '../../package.json';

// Bump package.json and update these notes together for each user-facing release.
export const CURRENT_RELEASE = {
  version,
  date: 'October 1, 2026',
  title: 'CV Optimization clinical corrections',
  summary: 'The existing assessment workflow is retained. This release corrects risk interpretation, medication safety checks and report validation in CV Optimization.',
  reference: {
    label: 'Read the 2026 dyslipidemia guideline summary',
    url: 'https://professional.heart.org/en/science-news/2026-guideline-on-the-management-of-dyslipidemia/top-things-to-know',
  },
  changes: [
    { title: 'Risk and lipid treatment', description: 'Lipid decisions use PREVENT-ASCVD and the 2026 risk thresholds. Total CVD risk remains separate for BP decisions. Statin recommendations are consolidated, with appropriate high-intensity choices.' },
    { title: 'Missing information stays unknown', description: 'Blank or invalid entries no longer become normal BP, zero risk or kidney disease. PREVENT is withheld outside its supported population, including established cardiovascular disease and dialysis.' },
    { title: 'Medication safety', description: 'Updated potassium and kidney-function checks for MRAs, metformin and SGLT2 inhibitors. AF recommendations require valve history and use indication-specific renal/dosing review. CAD antiplatelet guidance is available without AF.' },
    { title: 'Reports that match the assessment', description: 'Urgent BP or potassium findings take precedence over routine optimization. Editing patient inputs requires a new report, and domain filters now keep monitoring and follow-up consistent.' },
  ],
};
