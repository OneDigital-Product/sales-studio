#!/usr/bin/env node
import fs from "fs";

const data = JSON.parse(fs.readFileSync("feature_list.json", "utf8"));
const total = data.length;
const passing = data.filter((f) => f.passes === true).length;
const failing = data.filter((f) => f.passes === false).length;

console.log("Total tests:", total);
console.log("Passing:", passing);
console.log("Failing:", failing);
console.log("Completion:", ((passing / total) * 100).toFixed(1) + "%");

if (failing > 0) {
  console.log("\nFailing tests:");
  data.forEach((test, idx) => {
    if (test.passes === false) {
      console.log(`  #${idx + 1}: ${test.description}`);
    }
  });
}
