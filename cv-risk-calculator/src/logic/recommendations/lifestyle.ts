import { PatientData, ClinicalCalculations, DomainRecommendation } from '../../types';
import { GUIDELINES } from '../../data/guidelines';

export function generateLifestyleRecommendations(
  patientData: PatientData,
  calculations: ClinicalCalculations
): DomainRecommendation[] {
  const recommendations: DomainRecommendation[] = [];
  const { demographics, history } = patientData;
  const { bmi, bpClassification } = calculations;
  const isHFpEF = history.heartFailure && history.ejectionFraction !== undefined && history.ejectionFraction >= 50;

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

  recommendations.push({
    priority: 'MODERATE',
    action: 'ADD',
    medication: 'Structured exercise prescription',
    recommendedDose: '',
    rationale: '',
    evidence: '2019 ACC/AHA Primary Prevention Guideline',
    additionalNotes:
      'Advise ≥150 minutes/week moderate intensity OR 75 minutes vigorous activity plus strength training 2 days/week; incorporate flexibility/balance for older adults.',
  });

  if (history.heartFailure || bmi >= 30) {
    recommendations.push({
      priority: 'MODERATE',
      action: 'ADD',
      medication: 'Sleep apnea evaluation',
      recommendedDose: '',
      rationale: '',
      evidence: GUIDELINES.HF_2022,
      additionalNotes: 'Recommend screening for obstructive sleep apnea (STOP-BANG, sleep study) to improve BP control, fatigue, and HF outcomes.',
    });
  }

  if (history.heartFailure) {
    recommendations.push({
      priority: 'MODERATE',
      action: 'ADD',
      medication: 'Sodium restriction reinforcement',
      recommendedDose: '',
      rationale: '',
      evidence: GUIDELINES.HF_2022,
      additionalNotes: 'Target <2 grams/day sodium; coordinate dietitian counseling, especially for HFpEF where volume management is critical.',
    });
  }

  recommendations.push({
    priority: 'LOW',
    action: 'ADD',
    medication: 'Alcohol intake review',
    recommendedDose: '',
    rationale: '',
    evidence: '2019 ACC/AHA Primary Prevention Guideline',
    additionalNotes:
      'Counsel to limit alcohol to ≤2 drinks/day (men) or ≤1 drink/day (women); consider abstinence if hypertension or triglycerides remain uncontrolled.',
  });

  return recommendations;
}
