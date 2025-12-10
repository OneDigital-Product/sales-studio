#!/usr/bin/env node

import { ConvexHttpClient } from "convex/browser";
import fs from "fs";
import xlsx from "xlsx";
import { api } from "./convex/_generated/api.js";

const client = new ConvexHttpClient(
  "https://valuable-wildcat-170.convex.cloud"
);

console.log("\n=== FEATURE #48: Validate ACA hire_date (missing column) ===\n");

// Read and parse the test CSV (without hire_date column)
const fileBuffer = fs.readFileSync("test-census-no-hire-date.csv");
const workbook = xlsx.read(fileBuffer, { raw: false, cellDates: false });
const worksheet = workbook.Sheets[workbook.SheetNames[0]];
const jsonData = xlsx.utils.sheet_to_json(worksheet, { raw: false });

console.log(
  `Parsed ${jsonData.length} rows with columns:`,
  Object.keys(jsonData[0])
);
console.log("\nTest Data: Census WITHOUT hire_date column");
console.log("Expected: ACA validation should detect missing_column issue\n");

try {
  // Find or create test client
  const clients = await client.query(api.clients.getClients);
  let testClient = clients.find((c) => c.name === "Hire Date Test Client");

  if (!testClient) {
    const clientId = await client.mutation(api.clients.createClient, {
      name: "Hire Date Test Client",
      contactEmail: "hiredatetest@example.com",
      notes: "Testing hire_date validation (missing column)",
    });
    testClient = await client.query(api.clients.getClient, { id: clientId });
  }

  console.log(`Using test client: ${testClient.name} (${testClient._id})\n`);

  // Import census data
  const columns = Object.keys(jsonData[0]);
  const censusUploadId = await client.mutation(api.census.saveCensus, {
    clientId: testClient._id,
    fileName: "test-census-no-hire-date.csv",
    columns,
    rows: jsonData,
  });

  console.log(`✅ Census imported: ${censusUploadId}`);

  // Run validation
  const validationId = await client.mutation(
    api.censusValidation.validateCensus,
    {
      censusUploadId,
    }
  );

  console.log(`✅ Validation completed: ${validationId}\n`);

  // Get validation results
  const validation = await client.query(api.censusValidation.getValidation, {
    censusUploadId,
  });

  console.log("=== VALIDATION RESULTS ===\n");
  console.log(`PEO Score: ${validation.peoScore}%`);
  console.log(`ACA Score: ${validation.acaScore}%`);
  console.log(`Total Rows: ${validation.totalRows}`);
  console.log(`PEO Valid Rows: ${validation.peoValidRows}`);
  console.log(`ACA Valid Rows: ${validation.acaValidRows}`);
  console.log(`\nTotal Issues: ${validation.issues.length}\n`);

  // Check for hire_date issues
  const hireDateIssues = validation.issues.filter(
    (i) => i.field === "hire_date"
  );

  if (hireDateIssues.length === 0) {
    console.log("❌ FAIL: No hire_date validation issues found!");
    process.exit(1);
  }

  console.log("=== HIRE_DATE ISSUES ===\n");
  for (const issue of hireDateIssues) {
    console.log(`Issue Type: ${issue.issueType}`);
    console.log(`Message: ${issue.message}`);
    console.log(`Affected Rows: ${issue.affectedRows.join(", ")}`);
    console.log(`Required For: ${issue.requiredFor}`);
    console.log();
  }

  // Verify expected results
  const missingColumnIssue = hireDateIssues.find(
    (i) => i.issueType === "missing_column"
  );

  if (!missingColumnIssue) {
    console.log("❌ FAIL: No missing_column issue found for hire_date!");
    console.log(
      "Found issue types:",
      hireDateIssues.map((i) => i.issueType)
    );
    process.exit(1);
  }

  console.log("✅ PASS: Missing hire_date column detected");

  // Check all rows are affected
  if (missingColumnIssue.affectedRows.length !== validation.totalRows) {
    console.log(
      `❌ FAIL: Expected all ${validation.totalRows} rows to be affected!`
    );
    console.log(`Got ${missingColumnIssue.affectedRows.length} affected rows`);
    process.exit(1);
  }

  console.log(
    `✅ PASS: All ${validation.totalRows} rows affected by missing column`
  );

  // Check it's required for ACA only
  if (missingColumnIssue.requiredFor !== "ACA") {
    console.log(
      `❌ FAIL: hire_date should be required for ACA only, got: ${missingColumnIssue.requiredFor}`
    );
    process.exit(1);
  }

  console.log("✅ PASS: hire_date is ACA-specific field");

  // Check error message mentions the column name
  if (!missingColumnIssue.message.toLowerCase().includes("hire_date")) {
    console.log(
      `❌ FAIL: Error message should mention 'hire_date', got: ${missingColumnIssue.message}`
    );
    process.exit(1);
  }

  console.log('✅ PASS: Error message mentions "hire_date"');

  // Check ACA score is 0% (no rows valid without hire_date)
  if (validation.acaScore !== 0) {
    console.log(
      `❌ FAIL: Expected ACA score of 0% (missing required column), got ${validation.acaScore}%`
    );
    process.exit(1);
  }

  console.log("✅ PASS: ACA score is 0% (missing required column)\n");

  console.log("=== ALL CHECKS PASSED ===");
  console.log(
    "✅ Feature #48: Validate ACA hire_date (missing column) - VERIFIED"
  );
} catch (error) {
  console.error("Error:", error);
  process.exit(1);
}
