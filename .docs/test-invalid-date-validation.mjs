#!/usr/bin/env node

/**
 * Test Feature #31: Validate census with invalid date format
 *
 * This script tests that the validation system correctly detects
 * invalid date formats and creates "invalid_value" issues.
 */

import { ConvexHttpClient } from "convex/browser";
import fs from "fs";
import { api } from "./convex/_generated/api.js";

const CONVEX_URL = "https://valuable-wildcat-170.convex.cloud";
const client = new ConvexHttpClient(CONVEX_URL);

async function testInvalidDateValidation() {
  console.log("=".repeat(80));
  console.log("FEATURE #31: Validate census with invalid date format");
  console.log("=".repeat(80));
  console.log();

  // Read the test CSV with invalid dates
  const csvPath = "./test-census-invalid-dates.csv";
  const csvContent = fs.readFileSync(csvPath, "utf8");
  const lines = csvContent.trim().split("\n");
  const headers = lines[0].split(",");

  console.log("📄 Test CSV: test-census-invalid-dates.csv");
  console.log("   Headers:", headers.join(", "));
  console.log("   Rows with invalid dates:");
  console.log("   - Row 0: John Smith, DOB: 13/45/2020 (invalid month/day)");
  console.log("   - Row 1: Jane Doe, DOB: invalid-date (not a date)");
  console.log("   - Row 2: Bob Johnson, DOB: 99-99-9999 (invalid date)");
  console.log("   - Row 3: Alice Williams, DOB: not-a-date (not a date)");
  console.log();

  // Parse CSV into rows
  const rows = lines.slice(1).map((line) => {
    const values = line.split(",");
    const data = {};
    headers.forEach((header, i) => {
      data[header] = values[i] || "";
    });
    return data;
  });

  console.log(`📊 Parsed ${rows.length} rows from CSV`);
  console.log("Sample row data:", JSON.stringify(rows[0], null, 2));
  console.log();

  // Get or create test client
  const clients = await client.query(api.clients.getClients);
  let testClient = clients.find((c) => c.name === "Invalid Date Test Client");

  if (!testClient) {
    console.log("Creating new test client...");
    const clientId = await client.mutation(api.clients.createClient, {
      name: "Invalid Date Test Client",
      contactEmail: "invaliddate@test.com",
      notes: "Testing invalid date validation",
    });
    testClient = await client.query(api.clients.getClient, { id: clientId });
  }

  console.log(`✅ Using client: ${testClient.name} (ID: ${testClient._id})`);
  console.log();

  // Import census
  console.log("⏳ Importing census data...");
  const censusId = await client.mutation(api.census.saveCensus, {
    clientId: testClient._id,
    fileName: "test-census-invalid-dates.csv",
    columns: headers,
    rows,
  });

  console.log(`✅ Census imported: ${censusId}`);
  console.log();

  // Run validation
  console.log("🔍 Running validation...");
  const validationId = await client.mutation(
    api.censusValidation.validateCensus,
    {
      censusUploadId: censusId,
    }
  );

  console.log(`✅ Validation completed: ${validationId}`);
  console.log();

  // Get validation results
  console.log("📊 Retrieving validation results...");
  const validation = await client.query(api.censusValidation.getValidation, {
    censusUploadId: censusId,
  });

  if (!validation) {
    console.error("❌ ERROR: No validation found!");
    process.exit(1);
  }

  console.log("✅ Validation retrieved");
  console.log();

  // Display validation results
  console.log("=".repeat(80));
  console.log("VALIDATION RESULTS");
  console.log("=".repeat(80));
  console.log();
  console.log(`PEO Score: ${validation.peoScore}%`);
  console.log(`ACA Score: ${validation.acaScore}%`);
  console.log(`Total Rows: ${validation.totalRows}`);
  console.log(`PEO Valid Rows: ${validation.peoValidRows}`);
  console.log(`ACA Valid Rows: ${validation.acaValidRows}`);
  console.log();

  // Check for invalid_value issues
  const invalidDateIssues = validation.issues.filter(
    (issue) =>
      issue.field === "date_of_birth" && issue.issueType === "invalid_value"
  );

  if (invalidDateIssues.length === 0) {
    console.error(
      "❌ FAILED: No invalid_value issues found for date_of_birth!"
    );
    console.log("All issues:", JSON.stringify(validation.issues, null, 2));
    process.exit(1);
  }

  console.log("✅ VALIDATION ISSUES DETECTED:");
  console.log();

  for (const issue of invalidDateIssues) {
    console.log(`Issue: ${issue.field}`);
    console.log(`  Type: ${issue.issueType}`);
    console.log(`  Message: ${issue.message}`);
    console.log(`  Required For: ${issue.requiredFor}`);
    console.log(`  Affected Rows: ${issue.affectedRows.join(", ")}`);
    console.log();
  }

  // Verify test requirements
  console.log("=".repeat(80));
  console.log("TEST VERIFICATION");
  console.log("=".repeat(80));
  console.log();

  const checks = [
    {
      name: "Census uploaded with invalid dates",
      pass: rows.length === 4,
      message: rows.length === 4 ? "✅ PASS" : "❌ FAIL",
    },
    {
      name: "Census imported successfully",
      pass: validation.totalRows === 4,
      message: validation.totalRows === 4 ? "✅ PASS" : "❌ FAIL",
    },
    {
      name: "Validation detects invalid_value issues",
      pass: invalidDateIssues.length > 0,
      message: invalidDateIssues.length > 0 ? "✅ PASS" : "❌ FAIL",
    },
    {
      name: "Issue type is invalid_value (not missing_value)",
      pass: invalidDateIssues.every((i) => i.issueType === "invalid_value"),
      message: invalidDateIssues.every((i) => i.issueType === "invalid_value")
        ? "✅ PASS"
        : "❌ FAIL",
    },
    {
      name: "Affected rows are identified",
      pass: invalidDateIssues[0].affectedRows.length === 4,
      message:
        invalidDateIssues[0].affectedRows.length === 4
          ? "✅ PASS"
          : "❌ FAIL (expected 4 rows)",
    },
    {
      name: "Quality score is reduced",
      pass: validation.peoScore < 100 && validation.acaScore < 100,
      message:
        validation.peoScore < 100 && validation.acaScore < 100
          ? "✅ PASS"
          : "❌ FAIL",
    },
  ];

  for (const check of checks) {
    console.log(`${check.message} - ${check.name}`);
  }

  console.log();

  const allPassed = checks.every((c) => c.pass);
  if (allPassed) {
    console.log("🎉 ALL CHECKS PASSED - Feature #31 is working correctly!");
    console.log();
    process.exit(0);
  } else {
    console.log("❌ SOME CHECKS FAILED");
    console.log();
    process.exit(1);
  }
}

testInvalidDateValidation().catch((err) => {
  console.error("Error running test:", err);
  process.exit(1);
});
