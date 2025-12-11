#!/usr/bin/env node

import { ConvexHttpClient } from "convex/browser";
import fs from "fs";
import xlsx from "xlsx";
import { api } from "./convex/_generated/api.js";

const client = new ConvexHttpClient(
  "https://valuable-wildcat-170.convex.cloud"
);

console.log(
  "\n=== FEATURE #47: Validate ACA hours_per_week (0-168 range) ===\n"
);

// Read and parse the test CSV (raw:true to keep dates as strings)
const fileBuffer = fs.readFileSync("test-census-hours-per-week.csv");
const workbook = xlsx.read(fileBuffer, { raw: false, cellDates: false });
const worksheet = workbook.Sheets[workbook.SheetNames[0]];
const jsonData = xlsx.utils.sheet_to_json(worksheet, { raw: false });

console.log(
  `Parsed ${jsonData.length} rows with columns:`,
  Object.keys(jsonData[0])
);
console.log("\nParsed data sample:");
console.log(JSON.stringify(jsonData[0], null, 2));
console.log("\nTest Data:");
console.log("- Row 1 (John Doe): 40 hours (VALID)");
console.log("- Row 2 (Jane Smith): 200 hours (INVALID - exceeds 168)");
console.log("- Row 3 (Bob Johnson): 35 hours (VALID)");
console.log("- Row 4 (Alice Williams): -10 hours (INVALID - negative)\n");

try {
  // Find or create test client
  const clients = await client.query(api.clients.getClients);
  let testClient = clients.find((c) => c.name === "Hours Per Week Test Client");

  if (!testClient) {
    const clientId = await client.mutation(api.clients.createClient, {
      name: "Hours Per Week Test Client",
      contactEmail: "hourstest@example.com",
      notes: "Testing hours_per_week validation (0-168 range)",
    });
    testClient = await client.query(api.clients.getClient, { id: clientId });
  }

  console.log(`Using test client: ${testClient.name} (${testClient._id})\n`);

  // Import census data
  const columns = Object.keys(jsonData[0]);
  const censusUploadId = await client.mutation(api.census.saveCensus, {
    clientId: testClient._id,
    fileName: "test-census-hours-per-week.csv",
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

  // Check for hours_per_week issues
  const hoursIssues = validation.issues.filter(
    (i) => i.field === "hours_per_week"
  );

  if (hoursIssues.length === 0) {
    console.log("❌ FAIL: No hours_per_week validation issues found!");
    process.exit(1);
  }

  console.log("=== ALL VALIDATION ISSUES ===\n");
  for (const issue of validation.issues) {
    console.log(`Field: ${issue.field}`);
    console.log(`Issue Type: ${issue.issueType}`);
    console.log(`Message: ${issue.message}`);
    console.log(`Affected Rows: ${issue.affectedRows.join(", ")}`);
    console.log(`Required For: ${issue.requiredFor}`);
    console.log();
  }

  console.log("=== HOURS_PER_WEEK ISSUES ===\n");
  for (const issue of hoursIssues) {
    console.log(`Issue Type: ${issue.issueType}`);
    console.log(`Message: ${issue.message}`);
    console.log(`Affected Rows: ${issue.affectedRows.join(", ")}`);
    console.log(`Required For: ${issue.requiredFor}`);
    console.log();
  }

  // Verify expected results
  const invalidHoursIssue = hoursIssues.find(
    (i) => i.issueType === "invalid_value"
  );

  if (!invalidHoursIssue) {
    console.log("❌ FAIL: No invalid_value issue found for hours_per_week!");
    process.exit(1);
  }

  console.log("✅ PASS: Invalid hours_per_week detected");

  // Check affected rows (should be rows 2 and 4 - indices 1 and 3)
  if (
    !(
      invalidHoursIssue.affectedRows.includes(1) &&
      invalidHoursIssue.affectedRows.includes(3)
    )
  ) {
    console.log(
      "❌ FAIL: Expected rows 1 and 3 (Jane Smith with 200, Alice Williams with -10) to be flagged!"
    );
    console.log(`Got affected rows: ${invalidHoursIssue.affectedRows}`);
    process.exit(1);
  }

  console.log("✅ PASS: Correct rows flagged (200 hours and -10 hours)");

  // Check it's required for ACA only
  if (invalidHoursIssue.requiredFor !== "ACA") {
    console.log(
      `❌ FAIL: hours_per_week should be required for ACA only, got: ${invalidHoursIssue.requiredFor}`
    );
    process.exit(1);
  }

  console.log("✅ PASS: hours_per_week is ACA-specific field");

  // Check error message mentions valid range
  if (
    !(
      invalidHoursIssue.message.includes("0") &&
      invalidHoursIssue.message.includes("168")
    )
  ) {
    console.log(
      `❌ FAIL: Error message should mention valid range (0-168), got: ${invalidHoursIssue.message}`
    );
    process.exit(1);
  }

  console.log("✅ PASS: Error message mentions valid range (0-168)");

  // Check ACA score reflects the invalid hours
  const expectedValidRows = 2; // Only rows 1 and 3 are valid (40 and 35 hours)
  if (validation.acaValidRows !== expectedValidRows) {
    console.log(
      `❌ FAIL: Expected ${expectedValidRows} ACA valid rows, got ${validation.acaValidRows}`
    );
    process.exit(1);
  }

  console.log(
    `✅ PASS: ACA validation correctly counts ${expectedValidRows} valid rows\n`
  );

  console.log("=== ALL CHECKS PASSED ===");
  console.log(
    "✅ Feature #47: Validate ACA hours_per_week (0-168 range) - VERIFIED"
  );
} catch (error) {
  console.error("Error:", error);
  process.exit(1);
}
