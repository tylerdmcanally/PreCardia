import { Allergy, Medication, MedicationCategory } from '../../types';

const CATEGORY_KEYWORDS: Partial<Record<MedicationCategory, string[]>> = {
  'ACE Inhibitor': [
    'ace inhibitor',
    'ace-i',
    'lisinopril',
    'enalapril',
    'ramipril',
    'benazepril',
    'captopril',
    'fosinopril',
    'quinapril',
    'perindopril',
  ],
  ARB: [
    'arb',
    'losartan',
    'valsartan',
    'olmesartan',
    'irbesartan',
    'telmisartan',
    'candesartan',
    'azilsartan',
  ],
  ARNI: [
    'arni',
    'entresto',
    'sacubitril',
    'sacubitril/valsartan',
    'sacubitril-valsartan',
    'sacubitril valsartan',
  ],
  MRA: ['mra', 'spironolactone', 'eplerenone', 'finerenone'],
  Statin: [
    'statin',
    'atorvastatin',
    'rosuvastatin',
    'simvastatin',
    'pravastatin',
    'lovastatin',
    'fluvastatin',
    'pitavastatin',
  ],
  'Diabetes - Metformin': ['metformin', 'glucophage', 'metformin xr', 'metformin er'],
  'Diabetes - SGLT2i': [
    'sglt2',
    'empagliflozin',
    'dapagliflozin',
    'canagliflozin',
    'ertugliflozin',
    'synjardy',
    'xigduo',
    'invokamet',
    'glyxambi',
    'qtern',
  ],
  'Diabetes - GLP-1 RA': [
    'glp-1',
    'semaglutide',
    'liraglutide',
    'dulaglutide',
    'tirzepatide',
    'exenatide',
    'lixisenatide',
    'xultophy',
    'soliqua',
  ],
  Anticoagulant: [
    'anticoagulant',
    'apixaban',
    'eliquis',
    'rivaroxaban',
    'xarelto',
    'edoxaban',
    'savaysa',
    'dabigatran',
    'pradaxa',
    'warfarin',
    'coumadin',
    'jantoven',
    'enoxaparin',
    'lovenox',
  ],
  Antiplatelet: ['aspirin', 'asa', 'clopidogrel', 'prasugrel', 'ticagrelor', 'dipyridamole', 'cilostazol', 'aggrenox'],
  'Diuretic - Thiazide': ['hydrochlorothiazide', 'chlorthalidone', 'indapamide', 'metolazone'],
  'Diuretic - Loop': ['furosemide', 'bumetanide', 'torsemide'],
};

const DOAC_KEYWORDS = ['apixaban', 'rivaroxaban', 'edoxaban', 'dabigatran'];

export const RAAS_CATEGORIES: MedicationCategory[] = ['ACE Inhibitor', 'ARB', 'ARNI'];

function normalize(value: string | undefined): string {
  return (value || '').toLowerCase();
}

function medicationMatchesCategory(medication: Medication, category: MedicationCategory): boolean {
  if (medication.category === category) return true;
  const keywords = CATEGORY_KEYWORDS[category];
  if (!keywords) return false;

  const generic = normalize(medication.genericName);
  const name = normalize((medication as any).name || '');
  return keywords.some((keyword) => generic.includes(keyword) || name.includes(keyword));
}
export function hasMedicationInCategory(medications: Medication[], category: MedicationCategory): boolean {
  return medications.some((med) => medicationMatchesCategory(med, category));
}

export function hasAllergyToCategory(allergies: Allergy[], category: MedicationCategory): boolean {
  const keywords = CATEGORY_KEYWORDS[category];
  if (!keywords || allergies.length === 0) {
    return false;
  }
  return allergies.some((allergy) => {
    const allergyText = normalize(allergy.medication);
    return keywords.some((keyword) => allergyText.includes(keyword));
  });
}

export function hasAllergyToAnyCategory(allergies: Allergy[], categories: MedicationCategory[]): boolean {
  return categories.some((category) => hasAllergyToCategory(allergies, category));
}

export function getMedicationsByCategory(
  medications: Medication[],
  categories: MedicationCategory[]
): Medication[] {
  return medications.filter((medication) => categories.some((category) => medicationMatchesCategory(medication, category)));
}

export function findFirstMedicationByCategory(
  medications: Medication[],
  categories: MedicationCategory[]
): Medication | undefined {
  return medications.find((medication) => categories.some((category) => medicationMatchesCategory(medication, category)));
}

export function formatMedicationLabel(medication: Medication | undefined, fallback: string): string {
  if (!medication) {
    return fallback;
  }
  const doseSuffix = medication.dose ? ` ${medication.dose}` : '';
  return `${medication.genericName}${doseSuffix}`;
}

export function getRAASMedications(medications: Medication[]): Medication[] {
  return getMedicationsByCategory(medications, RAAS_CATEGORIES);
}

export function getMRAMedications(medications: Medication[]): Medication[] {
  return getMedicationsByCategory(medications, ['MRA']);
}

export function getMetformin(medications: Medication[]): Medication | undefined {
  return medications.find((medication) => normalize(medication.genericName).includes('metformin'));
}

export function getDOACMedications(medications: Medication[]): Medication[] {
  return medications.filter((medication) => {
    const generic = normalize(medication.genericName);
    return (
      (medication.category === 'Anticoagulant' && DOAC_KEYWORDS.some((keyword) => generic.includes(keyword))) ||
      DOAC_KEYWORDS.some((keyword) => generic.includes(keyword))
    );
  });
}

export function getWarfarinMedication(medications: Medication[]): Medication | undefined {
  return medications.find((medication) => normalize(medication.genericName).includes('warfarin'));
}

export function describeMedicationList(medications: Medication[], fallback: string): string {
  if (medications.length === 0) {
    return fallback;
  }
  return medications.map((med) => formatMedicationLabel(med, med.genericName)).join(', ');
}

export function findMedicationByKeywords(
  medications: Medication[],
  keywords: string[]
): Medication | undefined {
  const loweredKeywords = keywords.map((keyword) => keyword.toLowerCase());
  return medications.find((medication) => {
    const generic = normalize(medication.genericName);
    return loweredKeywords.some((keyword) => generic.includes(keyword));
  });
}

export function hasMedicationWithKeywords(medications: Medication[], keywords: string[]): boolean {
  return Boolean(findMedicationByKeywords(medications, keywords));
}

export function poundsToKilograms(pounds: number | undefined): number {
  if (!pounds || pounds <= 0) {
    return 0;
  }
  return pounds / 2.20462;
}
export const NSAID_KEYWORDS = [
  'ibuprofen',
  'naproxen',
  'meloxicam',
  'diclofenac',
  'indomethacin',
  'celecoxib',
  'ketorolac',
  'etodolac',
  'piroxicam',
  'sulindac',
  'nabumetone',
  'oxaprozin',
  'ketoprofen',
  'diflunisal',
  'fenoprofen',
  'mefenamic acid',
  'tolmetin'
];

export function getNSAIDMedications(medications: Medication[]): Medication[] {
  return medications.filter((medication) => {
    const generic = normalize(medication.genericName);
    return NSAID_KEYWORDS.some((keyword) => generic.includes(keyword));
  });
}

export const QT_PROLONGING_KEYWORDS = [
  'diltiazem',
  'verapamil',
  'digoxin',
  'ranolazine'
];

export function getQTMedications(medications: Medication[]): Medication[] {
  return medications.filter((medication) => {
    const generic = normalize(medication.genericName);
    return QT_PROLONGING_KEYWORDS.some((keyword) => generic.includes(keyword));
  });
}

export const DIURETIC_KEYWORDS = [
  'furosemide',
  'bumetanide',
  'torsemide',
  'hydrochlorothiazide',
  'chlorthalidone',
  'indapamide',
  'metolazone'
];

export function getDiureticMedications(medications: Medication[]): Medication[] {
  return medications.filter((medication) => {
    const generic = normalize(medication.genericName);
    return DIURETIC_KEYWORDS.some((keyword) => generic.includes(keyword));
  });
}
