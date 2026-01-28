import { MedicationCategory } from '../types';

export interface MedicationOption {
  name: string;
  genericName: string;
  brandNames: string[]; // Add brand names for better recognition
  doses: string[];
  category: MedicationCategory;
  aliases?: string[]; // Alternative names/abbreviations
}

export const MEDICATIONS: MedicationOption[] = [
  // ==================== ACE INHIBITORS ====================
  {
    name: 'Lisinopril',
    genericName: 'lisinopril',
    brandNames: ['Prinivil', 'Zestril'],
    doses: ['2.5mg daily', '5mg daily', '10mg daily', '20mg daily', '40mg daily'],
    category: 'ACE Inhibitor'
  },
  {
    name: 'Enalapril',
    genericName: 'enalapril',
    brandNames: ['Vasotec'],
    doses: ['2.5mg daily', '2.5mg BID', '5mg daily', '5mg BID', '10mg daily', '10mg BID', '20mg daily', '20mg BID'],
    category: 'ACE Inhibitor'
  },
  {
    name: 'Ramipril',
    genericName: 'ramipril',
    brandNames: ['Altace'],
    doses: ['1.25mg daily', '2.5mg daily', '5mg daily', '10mg daily'],
    category: 'ACE Inhibitor'
  },
  {
    name: 'Benazepril',
    genericName: 'benazepril',
    brandNames: ['Lotensin'],
    doses: ['5mg daily', '10mg daily', '20mg daily', '40mg daily'],
    category: 'ACE Inhibitor'
  },
  {
    name: 'Captopril',
    genericName: 'captopril',
    brandNames: ['Capoten'],
    doses: ['12.5mg BID', '12.5mg TID', '25mg BID', '25mg TID', '50mg BID', '50mg TID'],
    category: 'ACE Inhibitor'
  },
  {
    name: 'Fosinopril',
    genericName: 'fosinopril',
    brandNames: ['Monopril'],
    doses: ['10mg daily', '20mg daily', '40mg daily'],
    category: 'ACE Inhibitor'
  },
  {
    name: 'Quinapril',
    genericName: 'quinapril',
    brandNames: ['Accupril'],
    doses: ['5mg daily', '10mg daily', '20mg daily', '40mg daily'],
    category: 'ACE Inhibitor'
  },
  {
    name: 'Perindopril',
    genericName: 'perindopril',
    brandNames: ['Aceon'],
    doses: ['2mg daily', '4mg daily', '8mg daily'],
    category: 'ACE Inhibitor'
  },

  // ==================== ANGIOTENSIN RECEPTOR BLOCKERS (ARBs) ====================
  {
    name: 'Losartan',
    genericName: 'losartan',
    brandNames: ['Cozaar'],
    doses: ['25mg daily', '50mg daily', '100mg daily'],
    category: 'ARB'
  },
  {
    name: 'Valsartan',
    genericName: 'valsartan',
    brandNames: ['Diovan'],
    doses: ['40mg daily', '80mg daily', '160mg daily', '320mg daily'],
    category: 'ARB'
  },
  {
    name: 'Olmesartan',
    genericName: 'olmesartan',
    brandNames: ['Benicar'],
    doses: ['20mg daily', '40mg daily'],
    category: 'ARB'
  },
  {
    name: 'Irbesartan',
    genericName: 'irbesartan',
    brandNames: ['Avapro'],
    doses: ['75mg daily', '150mg daily', '300mg daily'],
    category: 'ARB'
  },
  {
    name: 'Telmisartan',
    genericName: 'telmisartan',
    brandNames: ['Micardis'],
    doses: ['20mg daily', '40mg daily', '80mg daily'],
    category: 'ARB'
  },
  {
    name: 'Candesartan',
    genericName: 'candesartan',
    brandNames: ['Atacand'],
    doses: ['4mg daily', '8mg daily', '16mg daily', '32mg daily'],
    category: 'ARB'
  },
  {
    name: 'Azilsartan',
    genericName: 'azilsartan',
    brandNames: ['Edarbi'],
    doses: ['40mg daily', '80mg daily'],
    category: 'ARB'
  },

  // ==================== ARNI (Angiotensin Receptor-Neprilysin Inhibitor) ====================
  {
    name: 'Sacubitril/Valsartan',
    genericName: 'sacubitril/valsartan',
    brandNames: ['Entresto'],
    doses: ['24/26mg BID', '49/51mg BID', '97/103mg BID'],
    category: 'ARNI',
    aliases: ['sacubitril-valsartan', 'entresto']
  },

  // ==================== BETA BLOCKERS ====================
  {
    name: 'Metoprolol succinate',
    genericName: 'metoprolol succinate',
    brandNames: ['Toprol-XL'],
    doses: ['12.5mg daily', '25mg daily', '50mg daily', '100mg daily', '200mg daily'],
    category: 'Beta Blocker',
    aliases: ['metoprolol XL', 'metoprolol ER']
  },
  {
    name: 'Metoprolol tartrate',
    genericName: 'metoprolol tartrate',
    brandNames: ['Lopressor'],
    doses: ['25mg BID', '50mg BID', '100mg BID'],
    category: 'Beta Blocker',
    aliases: ['metoprolol IR']
  },
  {
    name: 'Carvedilol',
    genericName: 'carvedilol',
    brandNames: ['Coreg'],
    doses: ['3.125mg BID', '6.25mg BID', '12.5mg BID', '25mg BID', '50mg BID'],
    category: 'Beta Blocker'
  },
  {
    name: 'Carvedilol phosphate ER',
    genericName: 'carvedilol phosphate',
    brandNames: ['Coreg CR'],
    doses: ['10mg daily', '20mg daily', '40mg daily', '80mg daily'],
    category: 'Beta Blocker',
    aliases: ['carvedilol ER', 'carvedilol CR']
  },
  {
    name: 'Atenolol',
    genericName: 'atenolol',
    brandNames: ['Tenormin'],
    doses: ['25mg daily', '50mg daily', '100mg daily'],
    category: 'Beta Blocker'
  },
  {
    name: 'Bisoprolol',
    genericName: 'bisoprolol',
    brandNames: ['Zebeta'],
    doses: ['2.5mg daily', '5mg daily', '10mg daily'],
    category: 'Beta Blocker'
  },
  {
    name: 'Labetalol',
    genericName: 'labetalol',
    brandNames: ['Trandate', 'Normodyne'],
    doses: ['100mg BID', '200mg BID', '300mg BID', '400mg BID'],
    category: 'Beta Blocker'
  },
  {
    name: 'Nebivolol',
    genericName: 'nebivolol',
    brandNames: ['Bystolic'],
    doses: ['2.5mg daily', '5mg daily', '10mg daily', '20mg daily'],
    category: 'Beta Blocker'
  },
  {
    name: 'Propranolol',
    genericName: 'propranolol',
    brandNames: ['Inderal'],
    doses: ['10mg BID', '20mg BID', '40mg BID', '60mg BID', '80mg BID'],
    category: 'Beta Blocker'
  },
  {
    name: 'Propranolol ER',
    genericName: 'propranolol',
    brandNames: ['Inderal LA', 'InnoPran XL'],
    doses: ['60mg daily', '80mg daily', '120mg daily', '160mg daily'],
    category: 'Beta Blocker',
    aliases: ['propranolol LA', 'propranolol XL']
  },

  // ==================== CALCIUM CHANNEL BLOCKERS ====================
  {
    name: 'Amlodipine',
    genericName: 'amlodipine',
    brandNames: ['Norvasc'],
    doses: ['2.5mg daily', '5mg daily', '10mg daily'],
    category: 'Calcium Channel Blocker'
  },
  {
    name: 'Nifedipine XL',
    genericName: 'nifedipine',
    brandNames: ['Procardia XL', 'Adalat CC'],
    doses: ['30mg daily', '60mg daily', '90mg daily'],
    category: 'Calcium Channel Blocker',
    aliases: ['nifedipine ER', 'nifedipine extended-release']
  },
  {
    name: 'Diltiazem ER',
    genericName: 'diltiazem',
    brandNames: ['Cardizem CD', 'Dilacor XR', 'Tiazac'],
    doses: ['120mg daily', '180mg daily', '240mg daily', '300mg daily', '360mg daily'],
    category: 'Calcium Channel Blocker',
    aliases: ['diltiazem CD', 'diltiazem XR']
  },
  {
    name: 'Verapamil ER',
    genericName: 'verapamil',
    brandNames: ['Calan SR', 'Verelan'],
    doses: ['120mg daily', '180mg daily', '240mg daily', '360mg daily'],
    category: 'Calcium Channel Blocker',
    aliases: ['verapamil SR']
  },
  {
    name: 'Felodipine',
    genericName: 'felodipine',
    brandNames: ['Plendil'],
    doses: ['2.5mg daily', '5mg daily', '10mg daily'],
    category: 'Calcium Channel Blocker'
  },

  // ==================== DIURETICS - THIAZIDE/THIAZIDE-LIKE ====================
  {
    name: 'Hydrochlorothiazide',
    genericName: 'hydrochlorothiazide',
    brandNames: ['Microzide'],
    doses: ['12.5mg daily', '25mg daily', '50mg daily'],
    category: 'Diuretic - Thiazide',
    aliases: ['HCTZ']
  },
  {
    name: 'Chlorthalidone',
    genericName: 'chlorthalidone',
    brandNames: ['Thalitone'],
    doses: ['12.5mg daily', '25mg daily', '50mg daily'],
    category: 'Diuretic - Thiazide'
  },
  {
    name: 'Indapamide',
    genericName: 'indapamide',
    brandNames: ['Lozol'],
    doses: ['1.25mg daily', '2.5mg daily'],
    category: 'Diuretic - Thiazide'
  },
  {
    name: 'Metolazone',
    genericName: 'metolazone',
    brandNames: ['Zaroxolyn'],
    doses: ['2.5mg daily', '5mg daily', '10mg daily'],
    category: 'Diuretic - Thiazide'
  },

  // ==================== DIURETICS - LOOP ====================
  {
    name: 'Furosemide',
    genericName: 'furosemide',
    brandNames: ['Lasix'],
    doses: ['20mg daily', '40mg daily', '80mg daily', '20mg BID', '40mg BID', '80mg BID'],
    category: 'Diuretic - Loop'
  },
  {
    name: 'Bumetanide',
    genericName: 'bumetanide',
    brandNames: ['Bumex'],
    doses: ['0.5mg daily', '1mg daily', '2mg daily', '1mg BID', '2mg BID'],
    category: 'Diuretic - Loop'
  },
  {
    name: 'Torsemide',
    genericName: 'torsemide',
    brandNames: ['Demadex'],
    doses: ['5mg daily', '10mg daily', '20mg daily', '40mg daily', '100mg daily'],
    category: 'Diuretic - Loop'
  },

  // ==================== MINERALOCORTICOID RECEPTOR ANTAGONISTS (MRA) ====================
  {
    name: 'Spironolactone',
    genericName: 'spironolactone',
    brandNames: ['Aldactone'],
    doses: ['12.5mg daily', '25mg daily', '50mg daily', '100mg daily'],
    category: 'MRA'
  },
  {
    name: 'Eplerenone',
    genericName: 'eplerenone',
    brandNames: ['Inspra'],
    doses: ['25mg daily', '50mg daily'],
    category: 'MRA'
  },

  // ==================== STATINS ====================
  {
    name: 'Atorvastatin',
    genericName: 'atorvastatin',
    brandNames: ['Lipitor'],
    doses: ['10mg daily', '20mg daily', '40mg daily', '80mg daily'],
    category: 'Statin'
  },
  {
    name: 'Rosuvastatin',
    genericName: 'rosuvastatin',
    brandNames: ['Crestor'],
    doses: ['5mg daily', '10mg daily', '20mg daily', '40mg daily'],
    category: 'Statin'
  },
  {
    name: 'Simvastatin',
    genericName: 'simvastatin',
    brandNames: ['Zocor'],
    doses: ['5mg daily', '10mg daily', '20mg daily', '40mg daily'],
    category: 'Statin'
  },
  {
    name: 'Pravastatin',
    genericName: 'pravastatin',
    brandNames: ['Pravachol'],
    doses: ['10mg daily', '20mg daily', '40mg daily', '80mg daily'],
    category: 'Statin'
  },
  {
    name: 'Lovastatin',
    genericName: 'lovastatin',
    brandNames: ['Mevacor'],
    doses: ['10mg daily', '20mg daily', '40mg daily'],
    category: 'Statin'
  },
  {
    name: 'Fluvastatin',
    genericName: 'fluvastatin',
    brandNames: ['Lescol'],
    doses: ['20mg daily', '40mg daily', '80mg daily'],
    category: 'Statin'
  },
  {
    name: 'Pitavastatin',
    genericName: 'pitavastatin',
    brandNames: ['Livalo', 'Zypitamag'],
    doses: ['1mg daily', '2mg daily', '4mg daily'],
    category: 'Statin'
  },

  // ==================== OTHER LIPID-LOWERING AGENTS ====================
  {
    name: 'Ezetimibe',
    genericName: 'ezetimibe',
    brandNames: ['Zetia'],
    doses: ['10mg daily'],
    category: 'Other'
  },
  {
    name: 'Fenofibrate',
    genericName: 'fenofibrate',
    brandNames: ['Tricor', 'Fenoglide'],
    doses: ['48mg daily', '54mg daily', '120mg daily', '145mg daily', '160mg daily'],
    category: 'Other'
  },
  {
    name: 'Gemfibrozil',
    genericName: 'gemfibrozil',
    brandNames: ['Lopid'],
    doses: ['600mg BID'],
    category: 'Other'
  },
  {
    name: 'Omega-3 fatty acids',
    genericName: 'icosapent ethyl',
    brandNames: ['Vascepa'],
    doses: ['2g BID', '4g daily'],
    category: 'Other',
    aliases: ['EPA', 'fish oil']
  },
  {
    name: 'Evolocumab',
    genericName: 'evolocumab',
    brandNames: ['Repatha'],
    doses: ['140mg SC every 2 weeks', '420mg SC monthly'],
    category: 'Other',
    aliases: ['PCSK9 inhibitor']
  },
  {
    name: 'Alirocumab',
    genericName: 'alirocumab',
    brandNames: ['Praluent'],
    doses: ['75mg SC every 2 weeks', '150mg SC every 2 weeks'],
    category: 'Other',
    aliases: ['PCSK9 inhibitor']
  },
  {
    name: 'Inclisiran',
    genericName: 'inclisiran',
    brandNames: ['Leqvio'],
    doses: ['284mg SC day 0, 3 months, then every 6 months'],
    category: 'Other',
    aliases: ['PCSK9 siRNA']
  },
  {
    name: 'Bempedoic acid',
    genericName: 'bempedoic acid',
    brandNames: ['Nexletol'],
    doses: ['180mg daily'],
    category: 'Other'
  },
  {
    name: 'Bempedoic acid + Ezetimibe',
    genericName: 'bempedoic acid/ezetimibe',
    brandNames: ['Nexlizet'],
    doses: ['180mg/10mg daily'],
    category: 'Other'
  },
  {
    name: 'Colesevelam',
    genericName: 'colesevelam',
    brandNames: ['Welchol'],
    doses: ['1875mg BID with meals'],
    category: 'Other',
    aliases: ['bile acid sequestrant']
  },
  {
    name: 'Cholestyramine',
    genericName: 'cholestyramine',
    brandNames: ['Questran'],
    doses: ['4g daily', '4g BID'],
    category: 'Other',
    aliases: ['bile acid sequestrant']
  },
  {
    name: 'Niacin',
    genericName: 'niacin',
    brandNames: ['Niaspan'],
    doses: ['500mg nightly', '1000mg nightly', '1500mg nightly', '2000mg nightly'],
    category: 'Other'
  },
  {
    name: 'Lomitapide',
    genericName: 'lomitapide',
    brandNames: ['Juxtapid'],
    doses: ['5mg daily', '10mg daily', '20mg daily', '40mg daily', '60mg daily'],
    category: 'Other',
    aliases: ['MTP inhibitor']
  },
  {
    name: 'Evinacumab',
    genericName: 'evinacumab',
    brandNames: ['Evkeeza'],
    doses: ['15mg/kg IV every 4 weeks'],
    category: 'Other',
    aliases: ['ANGPTL3 inhibitor']
  },
  {
    name: 'Ezetimibe/Simvastatin',
    genericName: 'ezetimibe/simvastatin',
    brandNames: ['Vytorin'],
    doses: ['10mg/20mg daily', '10mg/40mg daily', '10mg/80mg daily'],
    category: 'Other',
    aliases: ['ezetimibe + statin']
  },

  // ==================== SGLT2 INHIBITORS ====================
  {
    name: 'Empagliflozin',
    genericName: 'empagliflozin',
    brandNames: ['Jardiance'],
    doses: ['10mg daily', '25mg daily'],
    category: 'Diabetes - SGLT2i'
  },
  {
    name: 'Dapagliflozin',
    genericName: 'dapagliflozin',
    brandNames: ['Farxiga'],
    doses: ['5mg daily', '10mg daily'],
    category: 'Diabetes - SGLT2i'
  },
  {
    name: 'Canagliflozin',
    genericName: 'canagliflozin',
    brandNames: ['Invokana'],
    doses: ['100mg daily', '300mg daily'],
    category: 'Diabetes - SGLT2i'
  },
  {
    name: 'Ertugliflozin',
    genericName: 'ertugliflozin',
    brandNames: ['Steglatro'],
    doses: ['5mg daily', '15mg daily'],
    category: 'Diabetes - SGLT2i'
  },
  {
    name: 'Empagliflozin/Metformin',
    genericName: 'empagliflozin/metformin',
    brandNames: ['Synjardy', 'Synjardy XR'],
    doses: ['5mg/500mg BID', '5mg/1000mg BID', '12.5mg/1000mg BID', '25mg/1000mg daily (XR)'],
    category: 'Diabetes - SGLT2i',
    aliases: ['SGLT2 + metformin']
  },
  {
    name: 'Dapagliflozin/Metformin',
    genericName: 'dapagliflozin/metformin',
    brandNames: ['Xigduo XR'],
    doses: ['5mg/500mg daily', '5mg/1000mg daily', '10mg/500mg daily', '10mg/1000mg daily'],
    category: 'Diabetes - SGLT2i',
    aliases: ['SGLT2 + metformin']
  },
  {
    name: 'Canagliflozin/Metformin',
    genericName: 'canagliflozin/metformin',
    brandNames: ['Invokamet', 'Invokamet XR'],
    doses: ['50mg/500mg BID', '50mg/1000mg BID', '150mg/500mg BID', '150mg/1000mg daily (XR)'],
    category: 'Diabetes - SGLT2i',
    aliases: ['SGLT2 + metformin']
  },
  {
    name: 'Empagliflozin/Linagliptin',
    genericName: 'empagliflozin/linagliptin',
    brandNames: ['Glyxambi'],
    doses: ['10mg/5mg daily', '25mg/5mg daily'],
    category: 'Diabetes - SGLT2i',
    aliases: ['SGLT2 + DPP-4']
  },
  {
    name: 'Dapagliflozin/Saxagliptin',
    genericName: 'dapagliflozin/saxagliptin',
    brandNames: ['Qtern'],
    doses: ['10mg/5mg daily'],
    category: 'Diabetes - SGLT2i',
    aliases: ['SGLT2 + DPP-4']
  },

  // ==================== GLP-1 RECEPTOR AGONISTS ====================
  {
    name: 'Semaglutide',
    genericName: 'semaglutide',
    brandNames: ['Ozempic', 'Wegovy', 'Rybelsus'],
    doses: ['0.25mg weekly', '0.5mg weekly', '1mg weekly', '2mg weekly', '2.4mg weekly'],
    category: 'Diabetes - GLP-1 RA'
  },
  {
    name: 'Dulaglutide',
    genericName: 'dulaglutide',
    brandNames: ['Trulicity'],
    doses: ['0.75mg weekly', '1.5mg weekly', '3mg weekly', '4.5mg weekly'],
    category: 'Diabetes - GLP-1 RA'
  },
  {
    name: 'Liraglutide',
    genericName: 'liraglutide',
    brandNames: ['Victoza', 'Saxenda'],
    doses: ['0.6mg daily', '1.2mg daily', '1.8mg daily', '3mg daily'],
    category: 'Diabetes - GLP-1 RA'
  },
  {
    name: 'Exenatide',
    genericName: 'exenatide',
    brandNames: ['Byetta'],
    doses: ['5mcg BID', '10mcg BID'],
    category: 'Diabetes - GLP-1 RA'
  },
  {
    name: 'Exenatide ER',
    genericName: 'exenatide extended-release',
    brandNames: ['Bydureon'],
    doses: ['2mg weekly'],
    category: 'Diabetes - GLP-1 RA',
    aliases: ['exenatide once weekly']
  },
  {
    name: 'Tirzepatide',
    genericName: 'tirzepatide',
    brandNames: ['Mounjaro', 'Zepbound'],
    doses: ['2.5mg weekly', '5mg weekly', '7.5mg weekly', '10mg weekly', '12.5mg weekly', '15mg weekly'],
    category: 'Diabetes - GLP-1 RA',
    aliases: ['twincretin']
  },
  {
    name: 'Semaglutide (oral)',
    genericName: 'semaglutide',
    brandNames: ['Rybelsus'],
    doses: ['7mg daily', '14mg daily'],
    category: 'Diabetes - GLP-1 RA'
  },

  // ==================== METFORMIN ====================
  {
    name: 'Metformin',
    genericName: 'metformin',
    brandNames: ['Glucophage'],
    doses: ['500mg daily', '500mg BID', '850mg daily', '850mg BID', '1000mg daily', '1000mg BID'],
    category: 'Diabetes - Metformin',
    aliases: ['metformin IR']
  },
  {
    name: 'Metformin ER',
    genericName: 'metformin extended-release',
    brandNames: ['Glucophage XR', 'Fortamet', 'Glumetza'],
    doses: ['500mg daily', '750mg daily', '1000mg daily', '1500mg daily', '2000mg daily'],
    category: 'Diabetes - Metformin',
    aliases: ['metformin XR']
  },

  // ==================== OTHER DIABETES MEDICATIONS ====================
  {
    name: 'Glipizide',
    genericName: 'glipizide',
    brandNames: ['Glucotrol'],
    doses: ['2.5mg daily', '5mg daily', '10mg daily', '5mg BID', '10mg BID'],
    category: 'Other',
    aliases: ['sulfonylurea']
  },
  {
    name: 'Glipizide ER',
    genericName: 'glipizide extended-release',
    brandNames: ['Glucotrol XL'],
    doses: ['2.5mg daily', '5mg daily', '10mg daily'],
    category: 'Other'
  },
  {
    name: 'Glyburide',
    genericName: 'glyburide',
    brandNames: ['DiaBeta', 'Micronase'],
    doses: ['1.25mg daily', '2.5mg daily', '5mg daily'],
    category: 'Other',
    aliases: ['sulfonylurea']
  },
  {
    name: 'Glimepiride',
    genericName: 'glimepiride',
    brandNames: ['Amaryl'],
    doses: ['1mg daily', '2mg daily', '4mg daily'],
    category: 'Other',
    aliases: ['sulfonylurea']
  },
  {
    name: 'Pioglitazone',
    genericName: 'pioglitazone',
    brandNames: ['Actos'],
    doses: ['15mg daily', '30mg daily', '45mg daily'],
    category: 'Other',
    aliases: ['TZD', 'thiazolidinedione']
  },
  {
    name: 'Sitagliptin',
    genericName: 'sitagliptin',
    brandNames: ['Januvia'],
    doses: ['25mg daily', '50mg daily', '100mg daily'],
    category: 'Other',
    aliases: ['DPP-4 inhibitor']
  },
  {
    name: 'Linagliptin',
    genericName: 'linagliptin',
    brandNames: ['Tradjenta'],
    doses: ['5mg daily'],
    category: 'Other',
    aliases: ['DPP-4 inhibitor']
  },
  {
    name: 'Saxagliptin',
    genericName: 'saxagliptin',
    brandNames: ['Onglyza'],
    doses: ['2.5mg daily', '5mg daily'],
    category: 'Other',
    aliases: ['DPP-4 inhibitor']
  },
  {
    name: 'Rosiglitazone',
    genericName: 'rosiglitazone',
    brandNames: ['Avandia'],
    doses: ['2mg daily', '4mg daily', '8mg daily'],
    category: 'Other',
    aliases: ['TZD', 'thiazolidinedione']
  },
  {
    name: 'Repaglinide',
    genericName: 'repaglinide',
    brandNames: ['Prandin'],
    doses: ['0.5mg TID with meals', '1mg TID with meals', '2mg TID with meals'],
    category: 'Other',
    aliases: ['meglitinide']
  },
  {
    name: 'Nateglinide',
    genericName: 'nateglinide',
    brandNames: ['Starlix'],
    doses: ['60mg TID with meals', '120mg TID with meals'],
    category: 'Other',
    aliases: ['meglitinide']
  },
  {
    name: 'Pioglitazone/Metformin',
    genericName: 'pioglitazone/metformin',
    brandNames: ['Actoplus Met'],
    doses: ['15mg/500mg BID', '15mg/850mg BID'],
    category: 'Other',
    aliases: ['TZD + metformin']
  },
  {
    name: 'Sitagliptin/Metformin',
    genericName: 'sitagliptin/metformin',
    brandNames: ['Janumet', 'Janumet XR'],
    doses: ['50mg/500mg BID', '50mg/1000mg BID', '100mg/1000mg daily'],
    category: 'Other',
    aliases: ['DPP-4 + metformin']
  },
  {
    name: 'Saxagliptin/Metformin',
    genericName: 'saxagliptin/metformin',
    brandNames: ['Kombiglyze XR'],
    doses: ['5mg/500mg daily', '5mg/1000mg daily', '2.5mg/1000mg BID'],
    category: 'Other',
    aliases: ['DPP-4 + metformin']
  },
  {
    name: 'Insulin glargine',
    genericName: 'insulin glargine',
    brandNames: ['Lantus', 'Basaglar', 'Toujeo'],
    doses: ['dose varies'],
    category: 'Other',
    aliases: ['long-acting insulin', 'basal insulin']
  },
  {
    name: 'Insulin degludec',
    genericName: 'insulin degludec',
    brandNames: ['Tresiba'],
    doses: ['dose varies'],
    category: 'Other',
    aliases: ['ultra-long-acting insulin', 'basal insulin']
  },
  {
    name: 'Insulin detemir',
    genericName: 'insulin detemir',
    brandNames: ['Levemir'],
    doses: ['dose varies'],
    category: 'Other',
    aliases: ['long-acting insulin', 'basal insulin']
  },
  {
    name: 'Insulin NPH',
    genericName: 'insulin NPH',
    brandNames: ['Humulin N', 'Novolin N'],
    doses: ['dose varies'],
    category: 'Other',
    aliases: ['intermediate-acting insulin']
  },
  {
    name: 'Insulin regular',
    genericName: 'insulin regular',
    brandNames: ['Humulin R', 'Novolin R'],
    doses: ['dose varies'],
    category: 'Other',
    aliases: ['short-acting insulin']
  },
  {
    name: 'Insulin lispro',
    genericName: 'insulin lispro',
    brandNames: ['Humalog'],
    doses: ['dose varies'],
    category: 'Other',
    aliases: ['rapid-acting insulin']
  },
  {
    name: 'Insulin aspart',
    genericName: 'insulin aspart',
    brandNames: ['Novolog'],
    doses: ['dose varies'],
    category: 'Other',
    aliases: ['rapid-acting insulin']
  },
  {
    name: 'Insulin glulisine',
    genericName: 'insulin glulisine',
    brandNames: ['Apidra'],
    doses: ['dose varies'],
    category: 'Other',
    aliases: ['rapid-acting insulin']
  },
  {
    name: 'Insulin lispro protamine/insulin lispro',
    genericName: 'insulin lispro protamine/insulin lispro',
    brandNames: ['Humalog 75/25', 'Humalog 50/50'],
    doses: ['dose varies'],
    category: 'Other',
    aliases: ['premixed insulin']
  },
  {
    name: 'Insulin aspart protamine/insulin aspart',
    genericName: 'insulin aspart protamine/insulin aspart',
    brandNames: ['Novolog 70/30'],
    doses: ['dose varies'],
    category: 'Other',
    aliases: ['premixed insulin']
  },
  {
    name: 'Insulin degludec/insulin aspart',
    genericName: 'insulin degludec/insulin aspart',
    brandNames: ['Ryzodeg 70/30'],
    doses: ['dose varies'],
    category: 'Other',
    aliases: ['premixed insulin']
  },
  {
    name: 'Insulin degludec/Liraglutide',
    genericName: 'insulin degludec/liraglutide',
    brandNames: ['Xultophy'],
    doses: ['dose varies'],
    category: 'Other',
    aliases: ['basal insulin/GLP-1 combo']
  },
  {
    name: 'Insulin glargine/Lixisenatide',
    genericName: 'insulin glargine/lixisenatide',
    brandNames: ['Soliqua 100/33'],
    doses: ['dose varies'],
    category: 'Other',
    aliases: ['basal insulin/GLP-1 combo']
  },

  // ==================== ANTIPLATELET AGENTS ====================
  {
    name: 'Aspirin',
    genericName: 'aspirin',
    brandNames: ['Bayer', 'Ecotrin'],
    doses: ['81mg daily', '325mg daily'],
    category: 'Antiplatelet',
    aliases: ['ASA']
  },
  {
    name: 'Clopidogrel',
    genericName: 'clopidogrel',
    brandNames: ['Plavix'],
    doses: ['75mg daily'],
    category: 'Antiplatelet'
  },
  {
    name: 'Ticagrelor',
    genericName: 'ticagrelor',
    brandNames: ['Brilinta'],
    doses: ['60mg BID', '90mg BID'],
    category: 'Antiplatelet'
  },
  {
    name: 'Prasugrel',
    genericName: 'prasugrel',
    brandNames: ['Effient'],
    doses: ['5mg daily', '10mg daily'],
    category: 'Antiplatelet'
  },
  {
    name: 'Aspirin/Dipyridamole ER',
    genericName: 'aspirin/dipyridamole extended-release',
    brandNames: ['Aggrenox'],
    doses: ['25mg/200mg BID'],
    category: 'Antiplatelet'
  },
  {
    name: 'Cilostazol',
    genericName: 'cilostazol',
    brandNames: ['Pletal'],
    doses: ['50mg BID', '100mg BID'],
    category: 'Antiplatelet',
    aliases: ['PDE3 inhibitor']
  },

  // ==================== ANTICOAGULANTS - DOACs ====================
  {
    name: 'Apixaban',
    genericName: 'apixaban',
    brandNames: ['Eliquis'],
    doses: ['2.5mg BID', '5mg BID'],
    category: 'Anticoagulant',
    aliases: ['DOAC']
  },
  {
    name: 'Rivaroxaban',
    genericName: 'rivaroxaban',
    brandNames: ['Xarelto'],
    doses: ['10mg daily', '15mg daily', '20mg daily'],
    category: 'Anticoagulant',
    aliases: ['DOAC']
  },
  {
    name: 'Edoxaban',
    genericName: 'edoxaban',
    brandNames: ['Savaysa'],
    doses: ['30mg daily', '60mg daily'],
    category: 'Anticoagulant',
    aliases: ['DOAC']
  },
  {
    name: 'Dabigatran',
    genericName: 'dabigatran',
    brandNames: ['Pradaxa'],
    doses: ['75mg BID', '110mg BID', '150mg BID'],
    category: 'Anticoagulant',
    aliases: ['DOAC']
  },

  // ==================== ANTICOAGULANTS - WARFARIN ====================
  {
    name: 'Warfarin',
    genericName: 'warfarin',
    brandNames: ['Coumadin', 'Jantoven'],
    doses: ['1mg daily', '2mg daily', '2.5mg daily', '3mg daily', '4mg daily', '5mg daily', '6mg daily', '7.5mg daily', '10mg daily', 'dose varies'],
    category: 'Anticoagulant'
  },
  {
    name: 'Enoxaparin',
    genericName: 'enoxaparin',
    brandNames: ['Lovenox'],
    doses: ['40mg daily', '30mg BID', '1mg/kg BID', '1.5mg/kg daily'],
    category: 'Anticoagulant',
    aliases: ['LMWH', 'low molecular weight heparin']
  },

  // ==================== NITRATES ====================
  {
    name: 'Isosorbide mononitrate',
    genericName: 'isosorbide mononitrate',
    brandNames: ['Imdur', 'Monoket'],
    doses: ['30mg daily', '60mg daily', '120mg daily'],
    category: 'Other',
    aliases: ['ISMN']
  },
  {
    name: 'Isosorbide dinitrate',
    genericName: 'isosorbide dinitrate',
    brandNames: ['Isordil'],
    doses: ['5mg TID', '10mg TID', '20mg TID', '30mg TID', '40mg TID'],
    category: 'Other',
    aliases: ['ISDN']
  },
  {
    name: 'Nitroglycerin SL',
    genericName: 'nitroglycerin sublingual',
    brandNames: ['Nitrostat'],
    doses: ['0.3mg PRN', '0.4mg PRN', '0.6mg PRN'],
    category: 'Other',
    aliases: ['NTG', 'nitro']
  },

  // ==================== OTHER CARDIOVASCULAR MEDICATIONS ====================
  {
    name: 'Hydralazine',
    genericName: 'hydralazine',
    brandNames: ['Apresoline'],
    doses: ['10mg TID', '25mg TID', '50mg TID', '100mg TID'],
    category: 'Other'
  },
  {
    name: 'Minoxidil',
    genericName: 'minoxidil',
    brandNames: ['Loniten'],
    doses: ['2.5mg daily', '5mg daily', '10mg daily', '20mg daily', '40mg daily'],
    category: 'Other',
    aliases: ['direct vasodilator']
  },
  {
    name: 'Clonidine',
    genericName: 'clonidine',
    brandNames: ['Catapres'],
    doses: ['0.1mg BID', '0.2mg BID', '0.3mg BID'],
    category: 'Other',
    aliases: ['central alpha-agonist']
  },
  {
    name: 'Clonidine patch',
    genericName: 'clonidine transdermal',
    brandNames: ['Catapres-TTS'],
    doses: ['0.1mg/24h weekly', '0.2mg/24h weekly', '0.3mg/24h weekly'],
    category: 'Other',
    aliases: ['central alpha-agonist']
  },
  {
    name: 'Amiloride',
    genericName: 'amiloride',
    brandNames: ['Midamor'],
    doses: ['5mg daily', '10mg daily', '5mg BID'],
    category: 'Other',
    aliases: ['potassium-sparing diuretic']
  },
  {
    name: 'Triamterene',
    genericName: 'triamterene',
    brandNames: ['Dyrenium'],
    doses: ['50mg BID', '100mg BID'],
    category: 'Other',
    aliases: ['potassium-sparing diuretic']
  },
  {
    name: 'Aliskiren',
    genericName: 'aliskiren',
    brandNames: ['Tekturna'],
    doses: ['150mg daily', '300mg daily'],
    category: 'Other',
    aliases: ['direct renin inhibitor']
  },
  {
    name: 'Vericiguat',
    genericName: 'vericiguat',
    brandNames: ['Verquvo'],
    doses: ['2.5mg daily', '5mg daily', '10mg daily'],
    category: 'Other',
    aliases: ['sGC stimulator']
  },
  {
    name: 'Doxazosin',
    genericName: 'doxazosin',
    brandNames: ['Cardura'],
    doses: ['1mg daily', '2mg daily', '4mg daily', '8mg daily'],
    category: 'Other',
    aliases: ['alpha blocker']
  },
  {
    name: 'Terazosin',
    genericName: 'terazosin',
    brandNames: ['Hytrin'],
    doses: ['1mg daily', '2mg daily', '5mg daily', '10mg daily'],
    category: 'Other',
    aliases: ['alpha blocker']
  },
  {
    name: 'Digoxin',
    genericName: 'digoxin',
    brandNames: ['Lanoxin'],
    doses: ['0.0625mg daily', '0.125mg daily', '0.25mg daily'],
    category: 'Other'
  },
  {
    name: 'Ranolazine',
    genericName: 'ranolazine',
    brandNames: ['Ranexa'],
    doses: ['500mg BID', '1000mg BID'],
    category: 'Other'
  },
  {
    name: 'Ivabradine',
    genericName: 'ivabradine',
    brandNames: ['Corlanor'],
    doses: ['2.5mg BID', '5mg BID', '7.5mg BID'],
    category: 'Other'
  },
  {
    name: 'Finerenone',
    genericName: 'finerenone',
    brandNames: ['Kerendia'],
    doses: ['10mg daily', '20mg daily'],
    category: 'Other',
    aliases: ['non-steroidal MRA']
  },

  // ==================== RENAL / DIALYSIS SUPPORTIVE MEDICATIONS ====================
  {
    name: 'Sevelamer carbonate',
    genericName: 'sevelamer carbonate',
    brandNames: ['Renvela'],
    doses: ['800mg TID with meals', '1600mg TID with meals'],
    category: 'Other',
    aliases: ['phosphate binder']
  },
  {
    name: 'Calcium acetate',
    genericName: 'calcium acetate',
    brandNames: ['PhosLo'],
    doses: ['1334mg TID with meals'],
    category: 'Other',
    aliases: ['phosphate binder']
  },
  {
    name: 'Sucroferric oxyhydroxide',
    genericName: 'sucroferric oxyhydroxide',
    brandNames: ['Velphoro'],
    doses: ['500mg TID with meals', '1000mg TID with meals'],
    category: 'Other',
    aliases: ['phosphate binder']
  },
  {
    name: 'Ferric citrate',
    genericName: 'ferric citrate',
    brandNames: ['Auryxia'],
    doses: ['2 tablets TID with meals', '3 tablets TID with meals'],
    category: 'Other',
    aliases: ['phosphate binder']
  },
  {
    name: 'Lanthanum carbonate',
    genericName: 'lanthanum carbonate',
    brandNames: ['Fosrenol'],
    doses: ['500mg TID with meals', '750mg TID with meals', '1000mg TID with meals'],
    category: 'Other',
    aliases: ['phosphate binder']
  },
  {
    name: 'Cinacalcet',
    genericName: 'cinacalcet',
    brandNames: ['Sensipar'],
    doses: ['30mg daily', '60mg daily', '90mg daily'],
    category: 'Other',
    aliases: ['calcimimetic']
  },
  {
    name: 'Calcitriol',
    genericName: 'calcitriol',
    brandNames: ['Rocaltrol'],
    doses: ['0.25mcg daily', '0.5mcg daily'],
    category: 'Other',
    aliases: ['active vitamin D']
  },
  {
    name: 'Paricalcitol',
    genericName: 'paricalcitol',
    brandNames: ['Zemplar'],
    doses: ['1mcg daily', '2mcg daily', '4mcg three times weekly'],
    category: 'Other',
    aliases: ['vitamin D analog']
  },
  {
    name: 'Patiromer',
    genericName: 'patiromer',
    brandNames: ['Veltassa'],
    doses: ['8.4g daily', '16.8g daily'],
    category: 'Other',
    aliases: ['potassium binder']
  },
  {
    name: 'Sodium zirconium cyclosilicate',
    genericName: 'sodium zirconium cyclosilicate',
    brandNames: ['Lokelma'],
    doses: ['10g TID for 48 hours', '10g daily maintenance'],
    category: 'Other',
    aliases: ['potassium binder']
  },
  {
    name: 'Midodrine',
    genericName: 'midodrine',
    brandNames: ['ProAmatine'],
    doses: ['2.5mg TID', '5mg TID', '10mg TID'],
    category: 'Other',
    aliases: ['orthostatic hypotension']
  },
  {
    name: 'Epoetin alfa',
    genericName: 'epoetin alfa',
    brandNames: ['Epogen', 'Procrit', 'Retacrit'],
    doses: ['4000 units TIW', '10000 units weekly'],
    category: 'Other',
    aliases: ['ESA', 'erythropoietin']
  },
  {
    name: 'Darbepoetin alfa',
    genericName: 'darbepoetin alfa',
    brandNames: ['Aranesp'],
    doses: ['25mcg weekly', '60mcg every 2 weeks'],
    category: 'Other',
    aliases: ['ESA']
  },

  // ==================== WEIGHT MANAGEMENT / OBESITY ====================
  {
    name: 'Phentermine',
    genericName: 'phentermine',
    brandNames: ['Adipex-P', 'Lomaira'],
    doses: ['8mg TID', '15mg daily', '30mg daily', '37.5mg daily'],
    category: 'Other',
    aliases: ['sympathomimetic']
  },
  {
    name: 'Phentermine/Topiramate ER',
    genericName: 'phentermine/topiramate',
    brandNames: ['Qsymia'],
    doses: ['3.75mg/23mg daily', '7.5mg/46mg daily', '11.25mg/69mg daily', '15mg/92mg daily'],
    category: 'Other',
    aliases: ['weight loss']
  },
  {
    name: 'Naltrexone/Bupropion',
    genericName: 'naltrexone/bupropion',
    brandNames: ['Contrave'],
    doses: ['8mg/90mg daily', '16mg/180mg daily', '32mg/360mg daily (divided)'],
    category: 'Other',
    aliases: ['weight loss']
  },
  {
    name: 'Orlistat',
    genericName: 'orlistat',
    brandNames: ['Xenical', 'Alli'],
    doses: ['120mg TID with meals', '60mg TID with meals'],
    category: 'Other',
    aliases: ['lipase inhibitor']
  },

  // ==================== GI PROTECTION - PROTON PUMP INHIBITORS ====================
  {
    name: 'Omeprazole',
    genericName: 'omeprazole',
    brandNames: ['Prilosec'],
    doses: ['20mg daily', '40mg daily'],
    category: 'GI Protection - PPI'
  },
  {
    name: 'Pantoprazole',
    genericName: 'pantoprazole',
    brandNames: ['Protonix'],
    doses: ['20mg daily', '40mg daily'],
    category: 'GI Protection - PPI'
  },
  {
    name: 'Esomeprazole',
    genericName: 'esomeprazole',
    brandNames: ['Nexium'],
    doses: ['20mg daily', '40mg daily'],
    category: 'GI Protection - PPI'
  },
  {
    name: 'Lansoprazole',
    genericName: 'lansoprazole',
    brandNames: ['Prevacid'],
    doses: ['15mg daily', '30mg daily'],
    category: 'GI Protection - PPI'
  },
  {
    name: 'Rabeprazole',
    genericName: 'rabeprazole',
    brandNames: ['Aciphex'],
    doses: ['20mg daily'],
    category: 'GI Protection - PPI'
  },

  // ==================== GI PROTECTION - H2 BLOCKERS ====================
  {
    name: 'Famotidine',
    genericName: 'famotidine',
    brandNames: ['Pepcid'],
    doses: ['20mg daily', '20mg BID', '40mg daily'],
    category: 'Other',
    aliases: ['H2 blocker']
  },
  {
    name: 'Ranitidine',
    genericName: 'ranitidine',
    brandNames: ['Zantac'],
    doses: ['150mg BID', '300mg daily'],
    category: 'Other',
    aliases: ['H2 blocker']
  },
];

// Search list item type
export interface MedicationSearchItem {
  label: string;
  value: string;
  genericName: string;
  dose: string;
  category: MedicationCategory;
  searchTerms: string[];
}

// Create searchable flat list with brand name recognition
export const MEDICATION_SEARCH_LIST = MEDICATIONS.flatMap(med => {
  const entries: MedicationSearchItem[] = [];

  // Add generic name + dose combinations
  med.doses.forEach(dose => {
    entries.push({
      label: `${med.name} ${dose}`,
      value: `${med.genericName}|${dose}|${med.category}`,
      genericName: med.genericName,
      dose: dose,
      category: med.category,
      searchTerms: [med.genericName.toLowerCase(), ...med.brandNames.map(b => b.toLowerCase()), ...(med.aliases || []).map(a => a.toLowerCase())]
    });
  });

  // Add brand name + dose combinations
  med.brandNames.forEach(brandName => {
    med.doses.forEach(dose => {
      entries.push({
        label: `${brandName} ${dose}`,
        value: `${med.genericName}|${dose}|${med.category}`,
        genericName: med.genericName,
        dose: dose,
        category: med.category,
        searchTerms: [med.genericName.toLowerCase(), ...med.brandNames.map(b => b.toLowerCase()), ...(med.aliases || []).map(a => a.toLowerCase())]
      });
    });
  });

  return entries;
});

// Brand name to generic name mapping for quick lookup
export const BRAND_TO_GENERIC: Record<string, string> = {};
MEDICATIONS.forEach(med => {
  med.brandNames.forEach(brandName => {
    BRAND_TO_GENERIC[brandName.toLowerCase()] = med.genericName;
  });
  if (med.aliases) {
    med.aliases.forEach(alias => {
      BRAND_TO_GENERIC[alias.toLowerCase()] = med.genericName;
    });
  }
});

// Helper function to search medications by text
export function searchMedications(searchText: string): MedicationSearchItem[] {
  const lowerSearch = searchText.toLowerCase().trim();

  if (!lowerSearch) {
    return MEDICATION_SEARCH_LIST;
  }

  return MEDICATION_SEARCH_LIST.filter(med => {
    const labelMatch = med.label.toLowerCase().includes(lowerSearch);
    const termMatch = med.searchTerms.some((term: string) => term.includes(lowerSearch));
    return labelMatch || termMatch;
  });
}
