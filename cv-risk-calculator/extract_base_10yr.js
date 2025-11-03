import fs from 'fs';

// Read the full coefficients file
const allCoefficients = JSON.parse(fs.readFileSync('prevent_coefficients.json', 'utf8'));

// Extract just the base_10yr model
const base10yr = allCoefficients.base_10yr;

// Write it to a separate file
fs.writeFileSync('base_10yr_coefficients.json', JSON.stringify(base10yr, null, 2));

console.log(`Extracted ${base10yr.length} coefficient rows for base_10yr model`);
console.log('\nVariable names:');
base10yr.forEach((row, idx) => {
  console.log(`${idx + 1}. ${row.beta_coefficients}`);
});
