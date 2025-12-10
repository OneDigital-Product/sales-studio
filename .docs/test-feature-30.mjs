#!/usr/bin/env node

import { ConvexHttpClient } from "convex/browser";
import { readFileSync } from "fs";
import { api } from "./convex/_generated/api.js";

const CONVEX_URL =
  process.env.NEXT_PUBLIC_CONVEX_URL ||
  "https://valuable-wildcat-170.convex.cloud";
const client = new ConvexHttpClient(CONVEX_URL);

// Simple CSV parser
function parseCSV(content) {
  const lines = content.trim().split("\n");
  const headers = lines[0].split(",").map((h) => h.trim());
  const rows = [];

  for (let i = 1; i < lines.length; i++) {
    if (!lines[i].trim()) continue; // Skip empty lines
    const values = lines[i].split(",").map((v) => v.trim());
    const row = {};
    for (let j = 0; j < headers.length; j++) {
      row[headers[j]] = values[j] || ""; // Empty string for missing values
    }
    rows.push(row);
  }

  return { headers, rows };
}

async function main() {
  console.log(
    "🧪 Testing Feature #30: Validate census with empty required values (PEO)\n"
  );

  // Step 1: Find or create Test Client
  console.log("📋 Step 1: Finding Test Client...");
  const clients = await client.query(api.clients.getClients);
  let testClient = clients.find((c) => c.contactEmail === "test@example.com");

  if (!testClient) {
    console.log("  Creating Test Client...");
    const clientId = await client.mutation(api.clients.createClient, {
      name: "Test Client",
      contactEmail: "test@example.com",
      notes: "For testing validation",
    });
    testClient = await client.query(api.clients.getClient, { id: clientId });
  }

  console.log(`  ✅ Found client: ${testClient.name} (${testClient._id})\n`);

  // Step 2: Load and parse test CSV with PEO issues
  console.log("📋 Step 2: Loading test-census-peo-issues.csv...");
  const csvContent = readFileSync("./test-census-peo-issues.csv", "utf-8");
  const { headers, rows } = parseCSV(csvContent);

  console.log(`  ✅ Parsed ${rows.length} rows`);
  console.log(`  ✅ Columns: ${headers.join(", ")}`);
  console.log("\n  📝 Rows with empty values:");
  rows.forEach((row, idx) => {
    const emptyFields = [];
    if (!row["Employee Name"]) emptyFields.push("Employee Name");
    if (!row["Salary"]) emptyFields.push("Salary");
    if (!row["Date of Birth"]) emptyFields.push("Date of Birth");
    if (!row["Coverage Tier"]) emptyFields.push("Coverage Tier");
    if (emptyFields.length > 0) {
      console.log(
        `     Row ${idx}: ${row["Employee Name"] || "(unnamed)"} - Missing: ${emptyFields.join(", ")}`
      );
    }
  });
  console.log("");

  // Step 3: Import census
  console.log("📋 Step 3: Importing census...");
  const censusId = await client.mutation(api.census.saveCensus, {
    clientId: testClient._id,
    fileName: "test-census-peo-issues.csv",
    columns: headers,
    rows: rows.map((data, idx) => ({ data, rowIndex: idx })),
  });

  console.log(`  ✅ Census imported: ${censusId}\n`);

  // Step 4: Run validation
  console.log("📋 Step 4: Running validation...");
  const validationId = await client.mutation(
    api.censusValidation.validateCensus,
    {
      censusUploadId: censusId,
    }
  );

  console.log(`  ✅ Validation completed: ${validationId}\n`);

  // Step 5: Get validation results
  console.log("📋 Step 5: Retrieving validation results...");
  const validation = await client.query(api.censusValidation.getValidation, {
    censusUploadId: censusId,
  });

  console.log("  📊 Validation Summary:");
  console.log(`     Total Rows: ${validation.totalRows}`);
  console.log(
    `     PEO Score: ${validation.peoScore}% (${validation.peoValidRows}/${validation.totalRows} rows valid)`
  );
  console.log(
    `     ACA Score: ${validation.acaScore}% (${validation.acaValidRows}/${validation.totalRows} rows valid)`
  );
  console.log(`     Issues Found: ${validation.issues.length}`);
  console.log("\n  📋 All Issues:");
  validation.issues.forEach((issue, idx) => {
    console.log(
      `     ${idx + 1}. ${issue.issueType} - ${issue.field}: ${issue.message}`
    );
    console.log(`        Affected Rows: ${issue.affectedRows}`);
    console.log(`        Required For: ${issue.requiredFor}`);
  });
  console.log("");

  // Step 6: Verify missing_value issues exist
  console.log("📋 Step 6: Verifying missing_value detection...");
  const missingValueIssues = validation.issues.filter(
    (i) => i.issueType === "missing_value"
  );

  if (missingValueIssues.length === 0) {
    console.error("  ❌ FAIL: No missing_value issues found");
    process.exit(1);
  }

  console.log(`  ✅ Found ${missingValueIssues.length} missing_value issues`);

  // Verify we have missing salary issue
  const missingSalaryIssue = missingValueIssues.find(
    (i) => i.field === "salary"
  );
  if (!missingSalaryIssue) {
    console.error("  ❌ FAIL: No missing salary issue found");
    process.exit(1);
  }
  console.log(
    `  ✅ Missing salary issue detected (${missingSalaryIssue.affectedRows.length} rows)`
  );

  // Step 7: Verify requirements
  console.log("\n📋 Step 7: Verifying test requirements...");

  // Check 1: Issue type is missing_value
  console.log("  ✅ Issue type is 'missing_value'");

  // Check 2: Affected row indices are tracked
  if (
    !Array.isArray(missingSalaryIssue.affectedRows) ||
    missingSalaryIssue.affectedRows.length === 0
  ) {
    console.error("  ❌ FAIL: Affected rows not tracked");
    process.exit(1);
  }
  console.log(
    `  ✅ Affected row indices tracked: ${missingSalaryIssue.affectedRows}`
  );

  // Check 3: Quality score is reduced
  if (validation.peoScore === 100) {
    console.error("  ❌ FAIL: PEO score should be reduced from 100%");
    process.exit(1);
  }
  console.log(
    `  ✅ Quality score reduced: ${validation.peoScore}% (down from 100%)`
  );

  // Check 4: Salary is required for both PEO and ACA
  if (missingSalaryIssue.requiredFor !== "both") {
    console.error(
      `  ❌ FAIL: Expected requiredFor "both", got "${missingSalaryIssue.requiredFor}"`
    );
    process.exit(1);
  }
  console.log("  ✅ Salary is required for both PEO and ACA");

  console.log("\n" + "=".repeat(80));
  console.log("🎉 ALL CHECKS PASSED! Feature #30 is working correctly.");
  console.log("=".repeat(80));
  console.log("\n✅ Test verified:");
  console.log("   - Validation detects missing_value issues");
  console.log("   - Affected row indices are tracked");
  console.log("   - Quality score is reduced appropriately");
  console.log("   - UI should display validation issues correctly\n");
}

main().catch((error) => {
  console.error("\n❌ Error:", error.message);
  console.error(error.stack);
  process.exit(1);
});
