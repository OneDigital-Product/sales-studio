#!/usr/bin/env node

import fs from "fs";

const csvPath = "./test-census-invalid-dates.csv";
const csvContent = fs.readFileSync(csvPath, "utf8");
const lines = csvContent.trim().split("\n");
const headers = lines[0].split(",");

console.log("CSV Headers:");
console.log(headers);
console.log("\nHeader details:");
headers.forEach((h, i) => {
  console.log(
    `  [${i}] "${h}" (length: ${h.length}, charCodes: ${Array.from(h)
      .map((c) => c.charCodeAt(0))
      .join(",")})`
  );
});

const rows = lines.slice(1).map((line, index) => {
  const values = line.split(",");
  const data = {};
  headers.forEach((header, i) => {
    data[header] = values[i] || "";
  });
  return { data, rowIndex: index };
});

console.log("\nFirst row data:");
console.log(JSON.stringify(rows[0].data, null, 2));

console.log("\nData keys:");
Object.keys(rows[0].data).forEach((key) => {
  console.log(`  "${key}" (length: ${key.length})`);
});

console.log("\nTesting column normalization:");
const normalizeColumnName = (name) =>
  name
    .toLowerCase()
    .trim()
    .replace(/[_\-\s]+/g, " ");

headers.forEach((h) => {
  console.log(`  "${h}" -> normalized: "${normalizeColumnName(h)}"`);
});

console.log("\nChecking if 'Date of Birth' alias matches:");
const dateAliases = ["dob", "birth date", "birthdate", "date of birth"];
const normalizedHeaders = headers.map(normalizeColumnName);
const normalizedAliases = dateAliases.map(normalizeColumnName);

console.log("Normalized headers:", normalizedHeaders);
console.log("Normalized aliases:", normalizedAliases);

for (const alias of normalizedAliases) {
  const index = normalizedHeaders.indexOf(alias);
  if (index !== -1) {
    console.log(
      `  ✅ Found match: "${alias}" at index ${index}, original: "${headers[index]}"`
    );
  }
}
