import { readFileSync } from "fs";

const data = JSON.parse(readFileSync("./feature_list.json", "utf-8"));
const failing = data.filter((t) => !t.passes);
const passing = data.filter((t) => t.passes);

console.log("=== TEST STATUS ===");
console.log(`Total: ${data.length}`);
console.log(`Passing: ${passing.length}`);
console.log(`Failing: ${failing.length}`);
console.log(`Progress: ${((passing.length / data.length) * 100).toFixed(1)}%`);

console.log("\n=== FIRST 10 FAILING TESTS ===");
failing.slice(0, 10).forEach((t, i) => {
  console.log(`\n${i + 1}. [${t.category}] ${t.description}`);
  console.log(`   Steps: ${t.steps[0]}`);
});
