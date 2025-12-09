#!/usr/bin/env node

/**
 * Script to import test census data with validation issues
 * Run: node test-import-census.mjs
 */

import { parse } from "csv-parse/sync";
import { readFileSync } from "fs";

// Read and parse the problematic census file
const csvContent = readFileSync("./test-census-missing-column.csv", "utf-8");
const records = parse(csvContent, {
  columns: true,
  skip_empty_lines: true,
});

console.log("Parsed CSV with missing salary column:");
console.log("Columns:", Object.keys(records[0]));
console.log("Rows:", records.length);
console.log("Sample row:", records[0]);
console.log(
  '\nThis census file is missing the "salary" column, which is required for PEO validation.'
);
console.log("Expected validation result: PEO and ACA scores should be < 100%");
console.log('Expected issue: missing_column for "salary" field');
