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
