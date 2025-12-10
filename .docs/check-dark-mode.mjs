#!/usr/bin/env node

function getLuminance(l) {
  const linear = l <= 0.040_45 ? l / 12.92 : ((l + 0.055) / 1.055) ** 2.4;
  return linear;
}

function getContrast(l1, l2) {
  const lum1 = getLuminance(l1);
  const lum2 = getLuminance(l2);
  const lighter = Math.max(lum1, lum2);
  const darker = Math.min(lum1, lum2);
  return (lighter + 0.05) / (darker + 0.05);
}

const bgDark = 0.145;
const mutedFgDark = 0.708;

const ratio = getContrast(bgDark, mutedFgDark);
console.log("Dark mode muted-foreground contrast:", ratio.toFixed(2) + ":1");
console.log("Passes 4.5:1?", ratio >= 4.5 ? "YES ✅" : "NO ❌");

if (ratio < 4.5) {
  // Find correct value
  let low = bgDark;
  let high = 1.0;
  let result = 0.7;

  for (let i = 0; i < 50; i++) {
    const mid = (low + high) / 2;
    const r = getContrast(bgDark, mid);

    if (Math.abs(r - 4.5) < 0.01) {
      result = mid;
      break;
    }

    if (r < 4.5) {
      low = mid;
    } else {
      high = mid;
    }
    result = mid;
  }

  console.log(
    "\nRecommended dark mode value: oklch(" + result.toFixed(3) + " 0 0)"
  );
  console.log("Would achieve:", getContrast(bgDark, result).toFixed(2) + ":1");
}
