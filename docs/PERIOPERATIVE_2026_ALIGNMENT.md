# PreCardia: 2026 perioperative guideline alignment

Review date: October 1, 2026. Baseline: `4d62e3ef07abd09b3d57848d372de1efb2b921a4`.

## Source and meaning of the update

Primary source: the user-supplied 101-page PDF, Thompson et al., *2026 AHA/ACC/ACS/ASNC/HRS/SCA/SCCT/SCMR/SVM Guideline for Perioperative Cardiovascular Management for Noncardiac Surgery*, JACC 2026;88:1543–1643, [doi:10.1016/j.jacc.2026.06.017](https://doi.org/10.1016/j.jacc.2026.06.017).

The notice on PDF page 1 states that evidence through March 2026 did not change the existing recommendations. The recommendations, supporting text, figures, tables and references are identical to the 2024 publication. This is a reaffirmation, not a new set of clinical thresholds. The [ACC announcement](https://www.acc.org/latest-in-cardiology/journal-scans/2026/09/29/12/22/joint-guideline) independently confirms this. Changes below repair discrepancies in the existing implementation and update its attribution; they should not be described as newly introduced 2026 recommendations.

The PDF was extracted for searching; the title notice, Figure 1, Table 4 and PCI recommendation table were also inspected as rendered pages. The review focused on the clinical recommendation tables, relevant supportive text, and how those recommendations map to this adult preoperative app. No independent systematic review of the cited primary studies was performed. PDF page numbers below are one-based; printed JACC page = PDF page + 1542.

## Comparison and implemented changes

| Area | Existing behavior | Revised behavior | Guideline location |
| --- | --- | --- | --- |
| Attribution | Incorrect perioperative author/society citation; 2024 labels | Thompson et al. 2026 multisociety citation, DOI and explicit reaffirmation note | PDF 1, printed 1543 |
| Urgency | Elective labeled `>3 months`; urgent included 24 h | Elective means sufficient time for evaluation; urgent ≥2 to <24 h; emergency <2 h; time-sensitive up to 3 months | §1.5, Table 2; PDF 8 |
| DASI | Converted score to estimated METs and ignored DASI ≤34 | Uses DASI ≤34 independently of the METs estimate; unreviewed questionnaire remains unknown; explicit completion control | §§3.2, 4.3, 4.5; Table 5; PDF 14, 19, 21 |
| RCRI | Fixed historical complication percentages called individualized 30-day MACE | Displays score and >1 threshold; removes the mislabeled percentages; supports separately identified clinician-entered NSQIP/MICA estimates | §3.1, Table 4, Figure 1; PDF 12–13, 24 |
| RCRI renal factor | >2 mg/dL or generic dialysis checkbox | ≥2.0 mg/dL, matching **Table 4**; manual factor wording and boundary tests agree | Table 4; PDF 13 |
| Unlisted procedures | Defaulted to intermediate risk in imaging engine | Explicit unknown/low/elevated risk; separately confirmed RCRI surgical factor; unknown information cannot establish low risk | Table 2, Figure 1 |
| Stress/CCTA | RCRI 1 could trigger testing; CCTA omitted unknown capacity; separate imaging engine could recommend stress in unstable CAD | One report pathway requires elevated procedure and calculated risk plus poor/unknown capacity, and tests must change care; no routine screening during active illness or urgent/emergency care; review PH/severe-AS modality contraindications | §§4.3, 4.3.1, 4.5; Table 7; Figure 1; PDF 19–24 |
| Independent imaging tables | Separate A/M/R scores and advice could conflict with the main recommendations | Removed from live report generation. Original modules remain marked legacy pending a separate AUC-source audit; their ratings are not displayed as 2026 recommendations | §4; Figure 1 |
| ECG | “Recommended” with arbitrary three-month expiration | Preserves Class 2a versus 2b population distinctions; no universal expiration; no routine asymptomatic low-risk ECG | §4.1; PDF 16–17 |
| Echo | Stable HF could trigger annual repeat echo | New/worsening dysfunction prompts evaluation; stable asymptomatic HF does not trigger routine repeat imaging; significant valve disease gets valve-specific review | §§4.2.1, 6.4; PDF 18, 34, 37–38 |
| Preoperative biomarkers | Overbroad age/risk eligibility; any available biomarker suppressed all further consideration | Known CVD, age ≥65, or age ≥45 with symptoms, with elevated-risk surgery; BNP/NT-proBNP Class 2a and troponin Class 2b assessed independently | §3.4; PDF 16 |
| Biomarker boundaries | BNP ≥92 and troponin ≥URL; zero treated as missing | Figure 1 uses BNP **>92**, NT-proBNP **≥300**, troponin **>99th-percentile URL**; zero remains a result; missing URL remains unclassified; results alone do not diagnose HF/MI | Figure 1; PDF 24 |
| DES timing | All later stents grouped `>12 weeks`; three-month advice for elective surgery | ACS versus chronic coronary disease and interruption plan captured; elective DES targets ≥12 months (ACS) and ≥6 months (CCD), versus conditional ≥3 months for time-sensitive surgery | §7.5; PDF 49–52 |
| Early PCI/balloon | Week bins did not resolve 30 days; no balloon rule | Calendar bins preserve ≤30 days; interruption harm warning, conditional early DAPT continuation and prior-PCI aspirin guidance; 14-day elective minimum after balloon-only angioplasty | §7.5; PDF 49–50 |
| Unknown PCI details | Missing later thresholds could look reassuring | Unknown/legacy timing or indication explicitly requires verification; no conversion of 12 weeks into 3 calendar months | §7.5 |
| MI/CABG | Blanket 60-day MI / six-week CABG delays attributed to guideline | Removes unsupported universal clearance rules; retains instability, recovery and revascularization/antiplatelet-specific review | §§6.1, 7.5; Figure 1 |
| TAVR/TEER | Mandatory 30-day/four-week delays | Conditional early surgery after successful intervention; verify function and stability; no fabricated minimum delay | §6.4.4; PDF 39 |
| Stroke/TIA | No timing input or delay advice | Explicit <3 months/≥3 months/unknown; ≥3-month delay is reasonable for elective surgery | §6.7; PDF 44 |
| Beta-blockers | RCRI/CAD could automatically suggest starting | Continue established therapy; new initiation requires a separately confirmed indication, optimally >7 days before elective surgery; no routine day-of-surgery initiation | §7.7; PDF 56–57 |
| Statins | Initiation tied to vascular surgery alone | Continue current statins; assess usual ASCVD/risk indication and long-term treatment intent | §7.1; PDF 46 |
| ACE inhibitor/ARB | Generic HF continuation versus universal morning-of hold | Explicit HFrEF versus controlled hypertension indication; selected controlled-HTN/elevated-risk patients may omit 24 h; unknown/other indications individualized | §7.2; PDF 47 |
| SGLT2 inhibitors | Correct hold intervals, overspecific restart instruction | Keeps ≥3 days (≥4 ertugliflozin); handles urgent cases without requiring washout delay; no universal restart timing asserted | §§6.3, 7.8; PDF 28, 57 |
| Oral anticoagulants | Generic DOAC 24–72-hour interval despite insufficient inputs | Drug/renal/bleeding/thrombotic-risk planning, including procedures needing no interruption; routine bridging discouraged; selected high-risk VKA exception; resume after hemostasis | §7.6, Tables 13–14; PDF 53–56 |
| Risk modifiers | Mostly generic consultation | Targeted PH, ACHD, CIED, new AF, frailty and stroke prompts; CIED reset/restoration and new AF follow-up included | §§3.3, 6.3.2–6.7; PDF 15, 30–44 |
| Postoperative troponin | Broad “recommended” monitoring for RCRI/poor capacity alone | Class 2b consideration at 24 **and** 48 h for specified patients having elevated-risk surgery; no routine asymptomatic low-risk surveillance; MINS follow-up prompt | §9.1; PDF 64 |
| Scope/report integrity | Pediatric ages accepted; zeros lost; old equation labeled CKD-EPI 2021 | Adult validation, zero-valued labs retained, shared 2021 eGFR function, no assumed male equation for “other,” eGFR distinguished from drug-dosing creatinine clearance | Adult scope; adjacent calculation defect (see below) |

### Source ambiguities and implementation choices

- Table 4 explicitly prints creatinine **≥2.0 mg/dL**. The hypertension footnote on printed p. 1568 uses **>2.0** while listing RCRI factors. This implementation follows Table 4 for the RCRI calculator, labels that choice, and tests equality. This is not described as a change from 2024.
- Table 2 defines elevated risk as **≥1%**, while its footnote/Table 4/Figure 1 describe the traditional calculator threshold as **>1%**. The external percentage input uses the inclusive Table 2 boundary and tests 0.99/1.00. RCRI uses **>1** throughout.
- Procedure dropdown categories remain broad examples, not a validated individualized probability. Unlisted procedures require explicit characterization. Risk modifiers and clinical symptoms remain important even with a low score.
- The eGFR fix addresses a discovered mismatch between the old formula and its “2021” label. It reuses the existing CV Optimization implementation, verified against the [NIDDK 2021 equation](https://www.niddk.nih.gov/research-funding/research-programs/kidney-clinical-research-epidemiology/laboratory/glomerular-filtration-rate-equations/adults). It is not a newly introduced perioperative recommendation.

## Scope reviewed but not converted into autonomous treatment rules

This is a preoperative clinician decision aid, not an implementation of every perioperative treatment in the document. The following remain specialist-managed because the app does not collect the necessary observations:

- §6: HCM hemodynamics, LVAD/transplant management, detailed valve intervention thresholds, PH hemodynamics and congenital anatomy. Existing PH/ACHD/valve inputs lead to review prompts, not assumed disease severity.
- §7: Agent-specific OAC interruption/bridging calendars, antiplatelet interruption schedules, CCB/clonidine initiation, metformin and GLP-1 management. The form lacks agent, dose, clearance, procedural bleeding and anesthesia inputs. No new automatic hold schedule is invented. The reaffirmed GLP-1 supportive text also explicitly describes an evidence gap.
- §8: Choice of anesthetic, analgesia, intraoperative echo, normothermia, mechanical support, pulmonary artery catheter decisions, tranexamic acid and anemia treatment. These require an anesthesia/surgical care plan and additional inputs.
- §9: Diagnosis and treatment of postoperative MI/MINS beyond surveillance and follow-up prompts. An isolated troponin value is not labeled acute MI.
- §10: Dedicated liver/kidney transplant evaluation and bariatric pathways. §§11–12 discuss value and evidence gaps; they do not justify inventing additional automated interventions.

The legacy AUC dataset is a different source and has not been validated by this guideline review. Any future reactivation should audit its exact scenario tables, ratings and contraindications independently. Its removal from the report prevents a second engine from bypassing the 2026 stepwise pathway.

## Validation

- `npm test`: **80 tests passed**. Regression cases exercise DASI, RCRI, testing eligibility, all four urgency levels with unstable conditions, biomarker thresholds, stent timing/indication/interruption, medication distinctions and report output.
- `npm run build`: **passed**. The production TypeScript/Vite build verifies the UI and calculation integration.
- Browser checks **passed** using synthetic cases: home-to-PreCardia navigation, new fields, report generation, DASI poor capacity despite estimated METs >4, DES for ACS with a 12-month elective target, and active ACS producing elective deferral without a routine ischemia-testing suggestion. No browser JavaScript errors were observed.
- Release 1.1.0 notes were verified on fresh direct visits, after dismissal/reload, with an older saved version, through manual reopening and Escape dismissal, and at mobile width. Modal focus stays within the dialog and returns to the opener. Blocked browser storage does not prevent dismissal. The dismissed version is stored per browser, and release maintenance is documented in the app README.
- ESLint **passed for changed TypeScript/TSX files**. Full repository lint still reports three pre-existing violations outside this update in `CVRiskCalculator.tsx` (unused `Sparkles`), `logic/calculations/index.ts` (`any`) and `logic/safety/utils.ts` (`any`). Two legacy imaging lint errors were cleaned up in the touched module.

These checks validate programmed behavior and software integration. They do not constitute external clinical validation of the decision aid. No deployment is included in this change.

## Version 1.2.0 usability follow-up

The assessment now follows six steps: patient/surgery, cardiac conditions, interventions/devices, functional capacity, medications/labs, and review/report. Desktop step navigation and a mobile step selector allow direct editing without losing entries. Stroke, PCI, medication and unlisted-procedure follow-up fields appear alongside their parent inputs. Clinical recommendation logic is unchanged.

Required-field errors appear in the page with links that focus the relevant control. Final validation returns to an earlier step when necessary. The review screen lists selected conditions, interventions, medications and lab values, with direct edit links. Any input change clears the old report; users must regenerate before copying or printing. Clipboard success/failure uses in-page feedback. Fields have associated labels, keyboard focus indicators and larger touch targets. Assessment data remains in component memory only.

Verification: the production build, changed-file ESLint check and all 80 clinical regression tests passed. A synthetic case was entered through all six steps and retained its DASI score/classification, PCI timing, stroke guidance, HFrEF medication advice and lab values in the generated report. Browser checks covered required-field focus, cross-step validation, direct editing, stale-report removal, regeneration with changed age, clipboard feedback and mobile step selection at 390 px without horizontal page overflow. Print-to-PDF contained the report and excluded the form/navigation. No browser JavaScript errors were observed. The three previously documented unrelated lint violations remain outside this change.
