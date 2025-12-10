#!/usr/bin/env node

// Simplified OKLCH to sRGB luminance for grayscale colors
function getLuminance(oklchL) {
  // For grayscale OKLCH (c=0), approximate conversion
  // OKLCH L roughly maps to perceived lightness
  // Convert to linear sRGB value
  const srgb = oklchL;

  // Convert sRGB to linear RGB
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

const colors = {
  background: 1.0,
  foreground: 0.145,
  muted_foreground: 0.465,
  primary: 0.205,
  secondary: 0.97,
  border: 0.922,
};

console.log("WCAG AA Contrast Requirements:");
console.log("- Normal text: 4.5:1 minimum");
console.log("- Large text (18pt+): 3:1 minimum");
console.log("- UI components: 3:1 minimum\n");

console.log("Contrast Ratios on White Background:\n");

const failures = [];

for (const [name, lightness] of Object.entries(colors)) {
  if (name === "background") continue;
  const ratio = getContrastRatio(colors.background, lightness);
  const passNormal = ratio >= 4.5;
  const passLarge = ratio >= 3.0;

  console.log(`${name}:`);
  console.log(`  OKLCH L: ${lightness}`);
  console.log(`  Ratio: ${ratio.toFixed(2)}:1`);
  console.log(`  Normal text (4.5:1): ${passNormal ? "✅ PASS" : "❌ FAIL"}`);
  console.log(`  Large text (3:1): ${passLarge ? "✅ PASS" : "❌ FAIL"}\n`);

  if (!passNormal) {
    failures.push({ name, ratio: ratio.toFixed(2), lightness });
  }
}

if (failures.length > 0) {
  console.log("\n⚠️  FAILURES DETECTED:");
  failures.forEach((f) => {
    const recommended = 0.4; // Approximate L value for 4.5:1 on white
    console.log(
      `  ${f.name}: ${f.ratio}:1 (current L=${f.lightness}, recommend L≤${recommended})`
    );
  });
}
