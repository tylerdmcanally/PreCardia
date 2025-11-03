# QT Prolongation Drug Interaction System

## Overview
Added comprehensive QT prolongation interaction checks to the CV Risk Calculator to identify dangerous combinations of diuretics with QT-prolonging medications in the setting of hypokalemia.

---

## Implementation Date
December 2024

---

## Clinical Rationale

### Why QT Prolongation Matters
- QT prolongation can lead to **torsades de pointes**, a life-threatening ventricular arrhythmia
- Risk is **additive** when multiple factors combine:
  1. QT-prolonging medication
  2. Hypokalemia (from diuretics)
  3. Patient comorbidities (CKD, HFrEF)

### Our CV Formulary's QT-Prolonging Medications
Based on CredibleMeds and clinical evidence:

| Medication | QT Prolongation Risk | Clinical Setting |
|------------|---------------------|------------------|
| **Diltiazem** | Moderate | Rate control for AF |
| **Verapamil** | Moderate | Rate control for AF |
| **Digoxin** | Yes (arrhythmia risk) | HFrEF with AF |
| **Ranolazine** | Yes | Angina management |

Note: Most CV drugs (ACE-I, ARB, beta blockers, statins, SGLT2i) do NOT prolong QT.

---

## Interactions Detected

### 1. Diuretic + QT-Prolonging Medication + Hypokalemia

#### High Priority Alert (K+ < 3.5 mEq/L)
**Triggers:**
- Patient on QT-prolonging medication (diltiazem, verapamil, digoxin, ranolazine)
- Patient on diuretic (loop or thiazide)
- Potassium < 3.5 mEq/L

**Alert Details:**
```
Priority: HIGH
Action: ADJUST
Medication: [Diuretic] + [QT-prolonging medication]
Recommended Dose: Replete potassium to ≥4.0mEq/L

Rationale: QT PROLONGATION RISK: Hypokalemia (K+ <3.5mEq/L) combined with 
QT-prolonging medication increases risk of torsades de pointes.

Monitoring: ECG for QT interval. Replete K+ and Mg++ to high normal 
(K+ ≥4.5, Mg++ ≥2.5) before continuing QT-prolonging agents.

Additional Notes: Severe hypokalemia (<3.0) is an emergent contraindication 
to QT-prolonging drugs.
```

#### Moderate Priority Alert (K+ 3.5-4.0 mEq/L)
**Triggers:**
- Same medications as above
- Potassium 3.5-4.0 mEq/L

**Alert Details:**
```
Priority: MODERATE
Action: ADJUST
Medication: [Diuretic] + [QT-prolonging medication]
Recommended Dose: Optimize K+ to ≥4.0mEq/L

Rationale: QT PROLONGATION RISK: Borderline hypokalemia (K+ 3.5-4.0) with 
QT-prolonging medication increases torsades risk.

Monitoring: Consider ECG for baseline QT. Optimize K+ and Mg++ to high normal.

Additional Notes: Aim for K+ ≥4.5 and Mg++ ≥2.5 when on QT-prolonging 
medications with diuretics.
```

### 2. Diuretic + Digoxin + Hypokalemia (Special Case)

#### High Priority Alert (K+ < 4.0 mEq/L)
**Triggers:**
- Patient on digoxin
- Patient on diuretic
- Potassium < 4.0 mEq/L

**Alert Details:**
```
Priority: HIGH
Action: MONITOR
Medication: [Diuretic] + Digoxin

Rationale: DIGOXIN TOXICITY RISK: Hypokalemia potentiates digoxin toxicity, 
increasing arrhythmia risk including ventricular tachycardia.

Monitoring: Check digoxin level if symptomatic. Replete K+ immediately to 
≥4.5mEq/L. Consider holding digoxin if K+ <3.0.

Additional Notes: Symptoms: nausea, fatigue, vision changes, new arrhythmias. 
Target K+ 4.5-5.0 for patients on digoxin.
```

---

## Technical Implementation

### Files Modified
1. **`src/logic/safety/interactions.ts`**
   - Added QT prolongation interaction detection logic
   - Checks for QT-prolonging medications + diuretics + hypokalemia
   - Special handling for digoxin interactions

2. **`src/logic/safety/utils.ts`**
   - Added `QT_PROLONGING_KEYWORDS` constant array
   - Added `getQTMedications()` function
   - Added `DIURETIC_KEYWORDS` constant array  
   - Added `getDiureticMedications()` function

### Key Functions

```typescript
// Get all QT-prolonging medications
const qtProlongingMedsList = getQTMedications(medications);

// Get all diuretic medications
const diureticsList = getDiureticMedications(medications);

// Check potassium level
const potassium = patientData.labs.potassium;

// Generate alerts based on combinations
if (qtProlongingMedsList.length > 0 && diureticsList.length > 0 && potassium !== undefined) {
  // Evaluate risk and generate alerts
}
```

---

## Clinical Scenarios

### Scenario 1: Moderate Risk
**Patient Profile:**
- 68-year-old male with AF and HFrEF
- **Medications:** Furosemide 40mg daily, Diltiazem ER 240mg daily
- **Labs:** K+ 3.6 mEq/L

**System Alert:**
```
MODERATE PRIORITY
QT PROLONGATION RISK: Borderline hypokalemia (K+ 3.5-4.0) with 
QT-prolonging medication increases torsades risk.

Action: Optimize K+ to ≥4.0mEq/L
```

### Scenario 2: High Risk
**Patient Profile:**
- 75-year-old female with AF and CKD Stage 3
- **Medications:** Hydrochlorothiazide 25mg daily, Verapamil ER 120mg daily
- **Labs:** K+ 3.2 mEq/L

**System Alert:**
```
HIGH PRIORITY
QT PROLONGATION RISK: Hypokalemia (K+ <3.5mEq/L) combined with 
QT-prolonging medication increases risk of torsades de pointes.

Action: Replete potassium to ≥4.0mEq/L
Monitoring: ECG for QT interval. Replete K+ and Mg++ to high normal.
```

### Scenario 3: Digoxin Toxicity Risk
**Patient Profile:**
- 72-year-old male with AF and HFrEF (EF 30%)
- **Medications:** Lasix 80mg BID, Digoxin 0.125mg daily
- **Labs:** K+ 3.8 mEq/L

**System Alert:**
```
HIGH PRIORITY
DIGOXIN TOXICITY RISK: Hypokalemia potentiates digoxin toxicity, 
increasing arrhythmia risk including ventricular tachycardia.

Monitoring: Check digoxin level if symptomatic. Replete K+ immediately 
to ≥4.5mEq/L. Consider holding digoxin if K+ <3.0.

Additional Notes: Target K+ 4.5-5.0 for patients on digoxin.
```

---

## Comparison to Industry Standards

### Epic MyChart / Epic BestPractice
- Flags QT interactions but with **high alert fatigue**
- Many false-positive interactions
- General warnings without specific management steps

### Our System
- ✅ **Targeted, high-signal alerts**
- ✅ **Specific management recommendations** (replete K+, ECG monitoring)
- ✅ **Digoxin-specific warnings**
- ✅ **Actionable guidance** for clinicians
- ✅ **No alert fatigue** - only checks combinations when relevant

### CredibleMeds Database
- CredibleMeds is the gold-standard QT database
- Requires **paid license** for API access
- We implemented **hardcoded logic** for our CV formulary
- More practical than full CredibleMeds integration for our use case

---

## Future Enhancements (Optional)

### Low Priority
1. **Add magnesium monitoring** when available in labs
2. **Detect multiple QT-prolonging medications** (additive risk)
3. **Consider amiodarone** if added to formulary (requires extensive QT checks)
4. **CYP3A4 interactions** with diltiazem/verapamil + amiodarone

### Would NOT Implement
- **CredibleMeds API integration** (expensive, overkill for CV formulary)
- **Psychiatric medication checks** (outside our scope)
- **Antibiotic QT checks** (acute use, usually handled by inpatient teams)

---

## Testing Recommendations

### Test Cases

#### Test 1: Diuretic + Diltiazem + Hypokalemia
```
Patient Data:
- Medications: Furosemide 40mg daily, Diltiazem ER 240mg daily
- Labs: K+ 3.3 mEq/L

Expected Alert: HIGH priority, replete K+
```

#### Test 2: Diuretic + Verapamil + Borderline Hypokalemia
```
Patient Data:
- Medications: Hydrochlorothiazide 25mg daily, Verapamil ER 180mg daily
- Labs: K+ 3.6 mEq/L

Expected Alert: MODERATE priority, optimize K+
```

#### Test 3: Digoxin + Diuretic + Hypokalemia
```
Patient Data:
- Medications: Lasix 80mg BID, Digoxin 0.125mg daily
- Labs: K+ 3.7 mEq/L

Expected Alert: HIGH priority (digoxin-specific toxicity warning)
```

#### Test 4: No Alert When K+ Normal
```
Patient Data:
- Medications: Furosemide 40mg daily, Diltiazem ER 240mg daily
- Labs: K+ 4.2 mEq/L

Expected Alert: NONE
```

---

## Evidence Base

### Clinical Guidelines
- **2022 AHA/ACC/HFSA Heart Failure Guidelines** - QT prolongation risk assessment
- **CredibleMeds** - Drug-specific QT risk categorization
- **2017 ACC/AHA/HRS AF Guidelines** - Rate control monitoring

### Key Studies
- **FDA Warning:** QT prolongation risk with certain medications
- **Clinical trials:** Digoxin toxicity increased with hypokalemia
- **Pharmacovigilance data:** Diuretics as risk multipliers for torsades

---

## Summary

✅ **Successfully implemented** QT prolongation checks  
✅ **Clinically relevant** for CV patients  
✅ **Low alert fatigue** - only high-risk scenarios  
✅ **Actionable guidance** for clinicians  
✅ **Production-ready** and deployed to Vercel  

---

**Status:** ✅ COMPLETE AND DEPLOYED  
**Last Updated:** December 2024  
**Next Review:** When adding new QT-prolonging medications to formulary

