/**
 * PREVENT Risk Calculator - Official AHA Implementation
 * Based on 2023 AHA PREVENT Equations
 * Reference: Khan SS, et al. Circulation. 2024;149(6):430-449
 *
 * This implementation is based on the official AHAprevent R package v1.0.0
 * Source: https://github.com/AHA-DS-Analytics/PREVENT
 *
 * Calculates 10-year and 30-year risk for:
 * - Total CVD (cardiovascular disease)
 * - ASCVD (atherosclerotic cardiovascular disease)
 * - Heart Failure (HF)
 */

interface PREVENTInputs {
  age: number;
  sex: 'male' | 'female';
  totalCholesterol: number; // mg/dL
  hdl: number; // mg/dL
  systolicBP: number;
  onBPMeds: boolean;
  diabetic: boolean;
  smoker: boolean;
  bmi: number;
  egfr: number;
  onStatin: boolean;
}

export interface PREVENTRisks {
  // 10-year risks
  totalCVD_10yr: number | null;
  ascvd_10yr: number | null;
  heartFailure_10yr: number | null;

  // 30-year risks (only for ages 30-59)
  totalCVD_30yr: number | null;
  ascvd_30yr: number | null;
  heartFailure_30yr: number | null;
}

/**
 * Convert cholesterol from mg/dL to mmol/L using official AHA conversion
 */
function mmolConversion(mgdl: number): number {
  return 0.02586 * mgdl;
}

/**
 * Calculate PREVENT risk for a specific outcome using official AHA equations
 */
function calculateRisk(
  inputs: PREVENTInputs,
  outcome: 'CVD' | 'ASCVD' | 'HF',
  timeframe: '10yr' | '30yr'
): number | null {
  const { age, sex, totalCholesterol, hdl, systolicBP, onBPMeds, diabetic, smoker, bmi, egfr, onStatin } = inputs;

  // Age validation based on timeframe
  if (timeframe === '10yr') {
    if (age < 30 || age > 79) return null;
  } else { // 30yr
    if (age < 30 || age > 59) return null;
  }

  // Validate inputs according to official AHA ranges
  if (outcome !== 'HF') {
    // CVD and ASCVD require cholesterol
    if (!totalCholesterol || totalCholesterol < 130 || totalCholesterol > 320) return null;
    if (!hdl || hdl < 20 || hdl > 100) return null;
  }

  if (outcome === 'HF') {
    // HF requires BMI
    if (!bmi || bmi < 18.5 || bmi >= 40) return null;
  }

  if (!systolicBP || systolicBP < 90 || systolicBP > 200) return null;
  if (egfr === undefined || egfr === null || egfr <= 0) return null;

  // Convert cholesterol to mmol/L
  const tcMmol = mmolConversion(totalCholesterol);
  const hdlMmol = mmolConversion(hdl);
  const nonHDLMmol = tcMmol - hdlMmol;

  // Center and scale predictors exactly as in official code
  const ageCentered = (age - 55) / 10;
  const ageSquared = ageCentered * ageCentered;
  const nonHDLCentered = nonHDLMmol - 3.5;
  const hdlCentered = (hdlMmol - 1.3) / 0.3;
  const sbpLt110 = Math.min(systolicBP, 110);
  const sbpGte110 = Math.max(systolicBP, 110);
  const sbpLt110Scaled = (sbpLt110 - 110) / 20;
  const sbpGte110Scaled = (sbpGte110 - 130) / 20;
  const bmiLt30 = Math.min(bmi, 30);
  const bmiGte30 = Math.max(bmi, 30);
  const bmiLt30Scaled = (bmiLt30 - 25) / 5;
  const bmiGte30Scaled = (bmiGte30 - 30) / 5;
  const egfrLt60 = Math.min(egfr, 60);
  const egfrGte60 = Math.max(egfr, 60);
  const egfrLt60Scaled = (egfrLt60 - 60) / (-15);
  const egfrGte60Scaled = (egfrGte60 - 90) / (-15);

  const dm = diabetic ? 1 : 0;
  const smoking = smoker ? 1 : 0;
  const bptreat = onBPMeds ? 1 : 0;
  const statin = onStatin ? 1 : 0;

  let logOdds = 0;

  // Apply official coefficients based on sex, outcome, and timeframe
  const isFemale = sex === 'female';

  if (outcome === 'CVD' && timeframe === '10yr') {
    if (isFemale) {
      logOdds = -3.307728 +
        0.7939329 * ageCentered +
        0.0305239 * nonHDLCentered -
        0.1606857 * hdlCentered -
        0.2394003 * sbpLt110Scaled +
        0.360078 * sbpGte110Scaled +
        0.8667604 * dm +
        0.5360739 * smoking +
        0.6045917 * egfrLt60Scaled +
        0.0433769 * egfrGte60Scaled +
        0.3151672 * bptreat -
        0.1477655 * statin -
        0.0663612 * bptreat * sbpGte110Scaled +
        0.1197879 * statin * nonHDLCentered -
        0.0819715 * ageCentered * nonHDLCentered +
        0.0306769 * ageCentered * hdlCentered -
        0.0946348 * ageCentered * sbpGte110Scaled -
        0.27057 * ageCentered * dm -
        0.078715 * ageCentered * smoking -
        0.1637806 * ageCentered * egfrLt60Scaled;
    } else {
      logOdds = -3.031168 +
        0.7688528 * ageCentered +
        0.0736174 * nonHDLCentered -
        0.0954431 * hdlCentered -
        0.4347345 * sbpLt110Scaled +
        0.3362658 * sbpGte110Scaled +
        0.7692857 * dm +
        0.4386871 * smoking +
        0.5378979 * egfrLt60Scaled +
        0.0164827 * egfrGte60Scaled +
        0.288879 * bptreat -
        0.1337349 * statin -
        0.0475924 * bptreat * sbpGte110Scaled +
        0.150273 * statin * nonHDLCentered -
        0.0517874 * ageCentered * nonHDLCentered +
        0.0191169 * ageCentered * hdlCentered -
        0.1049477 * ageCentered * sbpGte110Scaled -
        0.2251948 * ageCentered * dm -
        0.0895067 * ageCentered * smoking -
        0.1543702 * ageCentered * egfrLt60Scaled;
    }
  } else if (outcome === 'CVD' && timeframe === '30yr') {
    if (isFemale) {
      logOdds = -1.318827 +
        0.5503079 * ageCentered -
        0.0928369 * ageSquared +
        0.0409794 * nonHDLCentered +
        (-0.1663306) * hdlCentered +
        (-0.1628654) * sbpLt110Scaled +
        0.3299505 * sbpGte110Scaled +
        0.6793894 * dm +
        0.3196112 * smoking +
        0.1857101 * egfrLt60Scaled +
        0.0553528 * egfrGte60Scaled +
        0.2894 * bptreat +
        (-0.075688) * statin +
        (-0.056367) * bptreat * sbpGte110Scaled +
        0.1071019 * statin * nonHDLCentered +
        (-0.0751438) * ageCentered * nonHDLCentered +
        0.0301786 * ageCentered * hdlCentered +
        (-0.0998776) * ageCentered * sbpGte110Scaled +
        (-0.3206166) * ageCentered * dm +
        (-0.1607862) * ageCentered * smoking +
        (-0.1450788) * ageCentered * egfrLt60Scaled;
    } else {
      logOdds = -1.148204 +
        0.4627309 * ageCentered -
        0.0984281 * ageSquared +
        0.0836088 * nonHDLCentered +
        (-0.1029824) * hdlCentered +
        (-0.2140352) * sbpLt110Scaled +
        0.2904325 * sbpGte110Scaled +
        0.5331276 * dm +
        0.2141914 * smoking +
        0.1155556 * egfrLt60Scaled +
        0.0603775 * egfrGte60Scaled +
        0.232714 * bptreat +
        (-0.0272112) * statin +
        (-0.0384488) * bptreat * sbpGte110Scaled +
        0.134192 * statin * nonHDLCentered +
        (-0.0511759) * ageCentered * nonHDLCentered +
        0.0165865 * ageCentered * hdlCentered +
        (-0.1101437) * ageCentered * sbpGte110Scaled +
        (-0.2585943) * ageCentered * dm +
        (-0.1566406) * ageCentered * smoking +
        (-0.1166776) * ageCentered * egfrLt60Scaled;
    }
  } else if (outcome === 'ASCVD' && timeframe === '10yr') {
    if (isFemale) {
      logOdds = -3.819975 +
        0.719883 * ageCentered +
        0.1176967 * nonHDLCentered -
        0.151185 * hdlCentered -
        0.0835358 * sbpLt110Scaled +
        0.3592852 * sbpGte110Scaled +
        0.8348585 * dm +
        0.4831078 * smoking +
        0.4864619 * egfrLt60Scaled +
        0.0397779 * egfrGte60Scaled +
        0.2265309 * bptreat -
        0.0592374 * statin -
        0.0395762 * bptreat * sbpGte110Scaled +
        0.0844423 * statin * nonHDLCentered -
        0.0567839 * ageCentered * nonHDLCentered +
        0.0325692 * ageCentered * hdlCentered -
        0.1035985 * ageCentered * sbpGte110Scaled -
        0.2417542 * ageCentered * dm -
        0.0791142 * ageCentered * smoking -
        0.1671492 * ageCentered * egfrLt60Scaled;
    } else {
      logOdds = -3.500655 +
        0.7099847 * ageCentered +
        0.1658663 * nonHDLCentered -
        0.1144285 * hdlCentered -
        0.2837212 * sbpLt110Scaled +
        0.3239977 * sbpGte110Scaled +
        0.7189597 * dm +
        0.3956973 * smoking +
        0.3690075 * egfrLt60Scaled +
        0.0203619 * egfrGte60Scaled +
        0.2036522 * bptreat -
        0.0865581 * statin -
        0.0322916 * bptreat * sbpGte110Scaled +
        0.114563 * statin * nonHDLCentered -
        0.0300005 * ageCentered * nonHDLCentered +
        0.0232747 * ageCentered * hdlCentered -
        0.0927024 * ageCentered * sbpGte110Scaled -
        0.2018525 * ageCentered * dm -
        0.0970527 * ageCentered * smoking -
        0.1217081 * ageCentered * egfrLt60Scaled;
    }
  } else if (outcome === 'ASCVD' && timeframe === '30yr') {
    if (isFemale) {
      logOdds = -1.974074 +
        0.4669202 * ageCentered -
        0.0893118 * ageSquared +
        0.1256901 * nonHDLCentered -
        0.1542255 * hdlCentered -
        0.0018093 * sbpLt110Scaled +
        0.322949 * sbpGte110Scaled +
        0.6296707 * dm +
        0.268292 * smoking +
        0.100106 * egfrLt60Scaled +
        0.0499663 * egfrGte60Scaled +
        0.1875292 * bptreat +
        0.0152476 * statin -
        0.0276123 * bptreat * sbpGte110Scaled +
        0.0736147 * statin * nonHDLCentered -
        0.0521962 * ageCentered * nonHDLCentered +
        0.0316918 * ageCentered * hdlCentered -
        0.1046101 * ageCentered * sbpGte110Scaled -
        0.2727793 * ageCentered * dm -
        0.1530907 * ageCentered * smoking -
        0.1299149 * ageCentered * egfrLt60Scaled;
    } else {
      logOdds = -1.736444 +
        0.3994099 * ageCentered -
        0.0937484 * ageSquared +
        0.1744643 * nonHDLCentered -
        0.120203 * hdlCentered -
        0.0665117 * sbpLt110Scaled +
        0.2753037 * sbpGte110Scaled +
        0.4790257 * dm +
        0.1782635 * smoking -
        0.0218789 * egfrLt60Scaled +
        0.0602553 * egfrGte60Scaled +
        0.1421182 * bptreat +
        0.0135996 * statin -
        0.0218265 * bptreat * sbpGte110Scaled +
        0.1013148 * statin * nonHDLCentered -
        0.0312619 * ageCentered * nonHDLCentered +
        0.020673 * ageCentered * hdlCentered -
        0.0920935 * ageCentered * sbpGte110Scaled -
        0.2159947 * ageCentered * dm -
        0.1548811 * ageCentered * smoking -
        0.0712547 * ageCentered * egfrLt60Scaled;
    }
  } else if (outcome === 'HF' && timeframe === '10yr') {
    if (isFemale) {
      logOdds = -4.310409 +
        0.8998235 * ageCentered -
        0.4559771 * sbpLt110Scaled +
        0.3576505 * sbpGte110Scaled +
        1.038346 * dm +
        0.583916 * smoking -
        0.0072294 * bmiLt30Scaled +
        0.2997706 * bmiGte30Scaled +
        0.7451638 * egfrLt60Scaled +
        0.0557087 * egfrGte60Scaled +
        0.3534442 * bptreat -
        0.0981511 * bptreat * sbpGte110Scaled -
        0.0946663 * ageCentered * sbpGte110Scaled -
        0.3581041 * ageCentered * dm -
        0.1159453 * ageCentered * smoking -
        0.003878 * ageCentered * bmiGte30Scaled -
        0.1884289 * ageCentered * egfrLt60Scaled;
    } else {
      logOdds = -3.946391 +
        0.8972642 * ageCentered -
        0.6811466 * sbpLt110Scaled +
        0.3634461 * sbpGte110Scaled +
        0.923776 * dm +
        0.5023736 * smoking -
        0.0485841 * bmiLt30Scaled +
        0.3726929 * bmiGte30Scaled +
        0.6926917 * egfrLt60Scaled +
        0.0251827 * egfrGte60Scaled +
        0.2980922 * bptreat -
        0.0497731 * bptreat * sbpGte110Scaled -
        0.1289201 * ageCentered * sbpGte110Scaled -
        0.3040924 * ageCentered * dm -
        0.1401688 * ageCentered * smoking +
        0.0068126 * ageCentered * bmiGte30Scaled -
        0.1797778 * ageCentered * egfrLt60Scaled;
    }
  } else if (outcome === 'HF' && timeframe === '30yr') {
    if (isFemale) {
      logOdds = -2.205379 +
        0.6254374 * ageCentered -
        0.0983038 * ageSquared -
        0.3919241 * sbpLt110Scaled +
        0.3142295 * sbpGte110Scaled +
        0.8330787 * dm +
        0.3438651 * smoking +
        0.0594874 * bmiLt30Scaled +
        0.2525536 * bmiGte30Scaled +
        0.2981642 * egfrLt60Scaled +
        0.0667159 * egfrGte60Scaled +
        0.333921 * bptreat -
        0.0893177 * bptreat * sbpGte110Scaled -
        0.0974299 * ageCentered * sbpGte110Scaled -
        0.404855 * ageCentered * dm -
        0.1982991 * ageCentered * smoking -
        0.0035619 * ageCentered * bmiGte30Scaled -
        0.1564215 * ageCentered * egfrLt60Scaled;
    } else {
      logOdds = -1.95751 +
        0.5681541 * ageCentered -
        0.1048388 * ageSquared -
        0.4761564 * sbpLt110Scaled +
        0.30324 * sbpGte110Scaled +
        0.6840338 * dm +
        0.2656273 * smoking +
        0.0833107 * bmiLt30Scaled +
        0.26999 * bmiGte30Scaled +
        0.2541805 * egfrLt60Scaled +
        0.0638923 * egfrGte60Scaled +
        0.2583631 * bptreat -
        0.0391938 * bptreat * sbpGte110Scaled -
        0.1269124 * ageCentered * sbpGte110Scaled -
        0.3273572 * ageCentered * dm -
        0.2043019 * ageCentered * smoking -
        0.0182831 * ageCentered * bmiGte30Scaled -
        0.1342618 * ageCentered * egfrLt60Scaled;
    }
  } else {
    return null;
  }

  // Convert log odds to probability (as percentage)
  const risk = 100 * Math.exp(logOdds) / (1 + Math.exp(logOdds));

  return Math.round(risk * 10) / 10; // Round to 1 decimal place
}

/**
 * Calculate all PREVENT risk outcomes (10-year and 30-year)
 * Based on official AHA PREVENT equations v1.0.0
 */
export function calculateAllPREVENTRisks(inputs: PREVENTInputs): PREVENTRisks {
  return {
    totalCVD_10yr: calculateRisk(inputs, 'CVD', '10yr'),
    ascvd_10yr: calculateRisk(inputs, 'ASCVD', '10yr'),
    heartFailure_10yr: calculateRisk(inputs, 'HF', '10yr'),
    totalCVD_30yr: calculateRisk(inputs, 'CVD', '30yr'),
    ascvd_30yr: calculateRisk(inputs, 'ASCVD', '30yr'),
    heartFailure_30yr: calculateRisk(inputs, 'HF', '30yr'),
  };
}

/**
 * Calculate PREVENT 10-year Total CVD risk (backward compatibility)
 */
export function calculatePREVENTRisk(inputs: PREVENTInputs): number {
  return calculateRisk(inputs, 'CVD', '10yr') || 0;
}

/**
 * Categorize PREVENT risk according to AHA guidelines
 */
export function categorizePREVENTRisk(risk: number): 'low' | 'borderline' | 'intermediate' | 'high' {
  if (risk < 5) return 'low';
  if (risk < 7.5) return 'borderline';
  if (risk < 20) return 'intermediate';
  return 'high';
}
