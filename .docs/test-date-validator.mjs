const DATE_PATTERN_ISO = /^\d{4}-\d{2}-\d{2}$/;
const DATE_PATTERN_US = /^\d{2}\/\d{2}\/\d{4}$/;
const DATE_PATTERN_DASH = /^\d{2}-\d{2}-\d{4}$/;
const DATE_PATTERN_SHORT = /^\d{1,2}\/\d{1,2}\/\d{2,4}$/;

const DATE_PATTERNS = [
  DATE_PATTERN_ISO,
  DATE_PATTERN_US,
  DATE_PATTERN_DASH,
  DATE_PATTERN_SHORT,
];

const isEmptyValue = (value) =>
  value === null || value === undefined || value === "";

const isValidDate = (value) => {
  if (isEmptyValue(value)) {
    return false;
  }
  const str = String(value);
  console.log(`  Testing "${str}"`);
  console.log(`    Matches pattern: ${DATE_PATTERNS.some((p) => p.test(str))}`);
  if (!DATE_PATTERNS.some((p) => p.test(str))) {
    return false;
  }
  const parsed = Date.parse(str);
  console.log(
    `    Date.parse result: ${parsed}, isNaN: ${Number.isNaN(parsed)}`
  );
  return !Number.isNaN(parsed);
};

const testValues = [
  "13/45/2020",
  "invalid-date",
  "99-99-9999",
  "2020-02-30",
  "01/15/1985", // valid
];

console.log("Testing date validator function:\n");
for (const val of testValues) {
  const result = isValidDate(val);
  console.log(`"${val}" -> ${result ? "✅ VALID" : "❌ INVALID"}\n`);
}
