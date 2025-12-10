import fs from "fs";

const data = JSON.parse(fs.readFileSync("./feature_list.json", "utf8"));
const failing = data.filter((f) => !f.passes);

console.log(`Total passing: ${data.filter((f) => f.passes).length}`);
console.log(`Total failing: ${failing.length}`);
console.log("\nFirst 10 failing features:\n");

failing.slice(0, 10).forEach((f, i) => {
  const idx = data.indexOf(f);
  console.log(`${idx}. ${f.description}`);
  console.log(`   Steps: ${f.steps.join(" -> ")}\n`);
});
