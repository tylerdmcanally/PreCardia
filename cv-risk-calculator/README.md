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
- **Based on:** 2024 ACC/AHA/ACCP/HRS Perioperative Guidelines
- **Purpose:** Pre-operative cardiac risk assessment for non-cardiac surgery
- **Features:**
  - Revised Cardiac Risk Index (RCRI) calculation
  - 30-day MACE risk stratification
  - Surgical risk categorization (low/intermediate/high)
  - Functional capacity assessment (clinical or DASI questionnaire)
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
- Node.js (v18 or higher)
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

### Vercel
This project is configured for deployment on Vercel with the included `vercel.json` configuration.

```bash
vercel deploy
```

### Other Platforms
The production build in the `dist/` directory is a static site that can be deployed to any static hosting service (Netlify, AWS S3, GitHub Pages, etc.).

## Clinical Disclaimer

**IMPORTANT:** These tools are for clinical decision support only and should not replace clinical judgment. Healthcare providers should use these tools in conjunction with their professional expertise and in accordance with local clinical guidelines.

### References
1. **PREVENT Equations:** Khan SS, et al. Novel Prediction Equations for Absolute Risk Assessment of Total Cardiovascular Disease Incorporating Cardiovascular-Kidney-Metabolic Health. Circulation. 2023.
2. **Perioperative Guidelines:** Fleisher LA, et al. 2024 ACC/AHA/ACCP/HRS Guideline for Perioperative Cardiovascular Evaluation and Management for Noncardiac Surgery.

## License

This project is for medical education and clinical decision support purposes.

## Version History

### Version 1.0.0
- Unified CardioTools application launch
- CV Optimization tool with official AHA PREVENT equations
- Complete PreCardia pre-operative assessment tool
- Unified styling and navigation system
- EMR-ready report generation for both tools
