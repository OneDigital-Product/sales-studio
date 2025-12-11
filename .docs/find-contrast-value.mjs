#!/usr/bin/env node

// Find OKLCH L value that achieves 4.5:1 contrast on white background

function getLuminance(oklchL) {
  const srgb = oklchL;
  const linear =
    srgb <= 0.040_45 ? srgb / 12.92 : ((srgb + 0.055) / 1.055) ** 2.4;
  return linear;
}

function getContrastRatio(l1, l2) {
  const lum1 = getLuminance(l1);
  const lum2 = getLuminance(l2);
  const lighter = Math.max(lum1, lum2);
  const darker = Math.min(lum1, lum2);
  return (lighter + 0.05) / (darker + 0.05);
}

const targetRatio = 4.5;
const background = 1.0;

// Binary search for the right L value
let low = 0.0;
let high = 1.0;
let result = 0.5;

for (let i = 0; i < 50; i++) {
  const mid = (low + high) / 2;
  const ratio = getContrastRatio(background, mid);

  if (Math.abs(ratio - targetRatio) < 0.01) {
    result = mid;
    break;
  }

  if (ratio < targetRatio) {
    high = mid;
  } else {
    low = mid;
  }
  result = mid;
}

console.log("For 4.5:1 contrast on white:");
console.log(`  OKLCH L value: ${result.toFixed(3)}`);
console.log(
  `  Actual ratio: ${getContrastRatio(background, result).toFixed(2)}:1`
);
console.log(`\nRecommendation: oklch(${result.toFixed(3)} 0 0)`);
