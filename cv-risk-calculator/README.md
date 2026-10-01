# CardioTools

Evidence-based cardiovascular risk assessment and clinical decision support tools built on the latest ACC/AHA guidelines.

## Overview

CardioTools is a unified web application that provides two comprehensive cardiovascular assessment tools for healthcare providers:

### 1. CV Optimization
- **Based on:** 2024 AHA PREVENT Equations v1.0.0
- **Purpose:** Calculate cardiovascular disease risk and generate personalized treatment recommendations
- **Features:**
  - 10-year and 30-year risk predictions for Total CVD, ASCVD, and Heart Failure
  - Comprehensive risk factor assessment
  - Guideline-based treatment recommendations across all cardiovascular domains:
    - Blood pressure management
    - Lipid optimization
    - Diabetes and cardiorenal care
    - Heart failure treatment
    - Antiplatelet and anticoagulation therapy
    - Risk factor modification
  - EMR-ready clinical reports with copy/print functionality
  - Drug interaction checking and allergy management

### 2. PreCardia
- **Based on:** 2026 AHA/ACC multisociety perioperative guideline (2024 recommendations reaffirmed)
- **Purpose:** Pre-operative cardiac risk assessment for non-cardiac surgery
- **Features:**
  - Revised Cardiac Risk Index (RCRI) calculation
  - RCRI risk stratification with optional clinician-entered NSQIP/MICA cardiac event estimates
  - Surgical risk categorization (low/intermediate/high)
  - Functional capacity assessment (clinical or completed DASI questionnaire; DASI ≤34 criterion)
  - Duke Activity Status Index (DASI) with 12-item questionnaire
  - Active cardiac condition screening
  - Recent cardiac intervention timing guidance (PCI, CABG, TAVR, MI)
  - Perioperative testing recommendations (ECG, stress test, echo, biomarkers)
  - Medication management guidance (beta-blockers, statins, anticoagulants)
  - Comprehensive pre-operative reports

## Technology Stack

- **Frontend:** React 19 with TypeScript
- **Styling:** Tailwind CSS with unified cardio-* color system
- **Routing:** React Router v7
- **Build Tool:** Vite
- **Icons:** Lucide React

## Getting Started

### Prerequisites
- Node.js 22.12 or higher (Vite 7 and the test runner)
- npm

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

The application will be available at `http://localhost:5173/` (or another port if 5173 is in use).

### Guideline review and regression tests

See [the 2026 alignment audit](../docs/PERIOPERATIVE_2026_ALIGNMENT.md) for source sections, corrected discrepancies, interpretation choices, and scope limits. PreCardia is an adult preoperative decision aid, not a complete anesthesia or postoperative treatment protocol.

```bash
npm test
```

Tests use the existing TypeScript compiler and Node test runner; no additional test packages are required.

### Building for Production

```bash
npm run build
```

The production build will be created in the `dist/` directory.

### Preview Production Build

```bash
npm run preview
```

## Project Structure

```
src/
├── components/         # Reusable React components
├── data/              # Clinical data (medications, guidelines)
├── logic/
│   ├── calculations/  # Risk calculation engines
│   │   ├── prevent.ts           # PREVENT equation implementation
│   │   └── index.ts             # Main calculation orchestrator
│   ├── precardia/     # PreCardia specific logic
│   │   ├── constants.ts         # Surgical risk, RCRI data
│   │   ├── calculations.ts      # RCRI, DASI, eGFR calculations
│   │   ├── recommendations.ts   # Guideline-based recommendations
│   │   └── reportGenerator.ts   # Report formatting
│   ├── report/        # Report generation
│   └── recommendations/ # Treatment recommendation engines
├── pages/             # Main application pages
│   ├── Home.tsx                 # Landing page with tool selector
│   ├── PreCardia.tsx            # PreCardia assessment tool
│   └── CVRiskCalculator.tsx     # CV Optimization tool (renamed)
├── types/             # TypeScript type definitions
├── App.tsx            # Main routing component
└── main.tsx           # Application entry point
```

## Deployment

### GitHub Pages

The primary site is [CardioTools on GitHub Pages](https://tylerdmcanally.github.io/PreCardia/). Pushes to `main` run the regression tests, build the app and deploy through [the Pages workflow](../.github/workflows/pages.yml). Pull requests build and test without deploying.

For a local Pages preview:

```bash
npm run build:pages
npm run preview:pages
```

Open `http://localhost:4173/PreCardia/`. Pages links use `#/precardia` and `#/prevent-calculator` so refreshes and direct links work on static hosting. See [the deployment guide](../DEPLOYMENT.md) for setup and verification.

### Other hosts

`npm run build` retains root-based browser routing for hosts with SPA rewrites. The prior Vercel configuration remains available in `vercel.json`.

## Clinical Disclaimer

**IMPORTANT:** These tools are for clinical decision support only and should not replace clinical judgment. Healthcare providers should use these tools in conjunction with their professional expertise and in accordance with local clinical guidelines.

### References
1. **PREVENT Equations:** Khan SS, et al. Novel Prediction Equations for Absolute Risk Assessment of Total Cardiovascular Disease Incorporating Cardiovascular-Kidney-Metabolic Health. Circulation. 2023.
2. **Perioperative Guideline:** Thompson A, Fleischmann KE, Smilowitz NR, et al. 2026 AHA/ACC/ACS/ASNC/HRS/SCA/SCCT/SCMR/SVM Guideline for Perioperative Cardiovascular Management for Noncardiac Surgery. JACC. 2026;88:1543–1643. [doi:10.1016/j.jacc.2026.06.017](https://doi.org/10.1016/j.jacc.2026.06.017). Reaffirms the 2024 recommendations without changes.
3. **CKD & Dialysis Care:** KDIGO 2024 CKD Guideline; KDIGO 2021 Blood Pressure in CKD; KDIGO 2022 Diabetes Management in CKD. Dialysis-specific safety and medication logic are incorporated for ACE/ARB/ARNI holds, SGLT2i discontinuation, and anticoagulation adjustments.

## License

This project is for medical education and clinical decision support purposes.

## Version History

### Version 1.2.0 — October 1, 2026
- Replace the long PreCardia accordion page with six navigable steps: patient/surgery, conditions, interventions/devices, function, medications/labs, and review/report.
- Keep related follow-up fields beside their parent inputs; add a review summary with direct edit links.
- Replace popup validation and clipboard alerts with accessible in-page feedback. Validation links focus the affected field, and changing any answer invalidates the previous report.
- Improve field labels, keyboard focus, mobile layouts and touch targets. Assessment data stays in component memory only; refreshing or leaving the page clears it.

### Version 1.1.0 — October 1, 2026
- Align PreCardia decision logic and reports with the reaffirmed 2026 perioperative guideline; see the [source-to-code audit](../docs/PERIOPERATIVE_2026_ALIGNMENT.md).
- Correct DASI/testing eligibility, PCI timing, biomarkers, medication guidance, RCRI reporting and eGFR calculation.
- Show version notes on the first visit to each release, including direct calculator links. Dismissal is saved per browser; notes can be reopened from **What’s new** at the bottom of any page.

For each release, bump `package.json` and the root metadata in `package-lock.json`, then update `src/data/releaseNotes.ts`. The dialog reads its version directly from `package.json`; no separate version number needs to be maintained. It stores only the dismissed version in `localStorage` (`cardiotools:last-seen-version`). Clearing site data makes notes appear again. When storage is blocked, notes remain dismissible for the current visit but may reappear after reload.

### Version 1.0.0
- Unified CardioTools application launch
- CV Optimization tool with official AHA PREVENT equations
- Complete PreCardia pre-operative assessment tool
- Unified styling and navigation system
- EMR-ready report generation for both tools
