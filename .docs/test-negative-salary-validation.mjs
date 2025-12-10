#!/usr/bin/env node

/**
 * Test Feature #33: Validate census with negative salary values
 *
 * Test cases:
 * - -50000 (negative salary - invalid)
 * - 60000 (positive salary - valid)
 * - 0 (zero salary - invalid, must be positive)
 */

import { ConvexHttpClient } from "convex/browser";
import fs from "fs";

const client = new ConvexHttpClient(
  "https://valuable-wildcat-170.convex.cloud"
);

async function testNegativeSalaryValidation() {
  console.log(
    "🧪 Testing Feature #33: Validate census with negative salary values\n"
  );

  // Read and parse the test CSV file
  const csvContent = fs.readFileSync(
    "test-census-negative-salary.csv",
    "utf-8"
  );
  const lines = csvContent.trim().split("\n");
  const headers = lines[0].split(",");

  console.log("📋 CSV Headers:", headers);
  console.log("📊 Total rows (including header):", lines.length);
  console.log("");

  // Parse data rows (skip header)
  const dataRows = lines.slice(1).map((line, index) => {
    const values = line.split(",");
    const data = {};
    headers.forEach((header, i) => {
      data[header.trim()] = values[i]?.trim() || "";
    });
    console.log(`Row ${index} data:`, data);
    return data;
  });

  console.log("\n📤 Uploading census with negative/zero salary values...");

  // Create test client
  const clientId = await client.mutation("clients:createClient", {
    name: "Negative Salary Test Client",
    contactEmail: "salarytest@example.com",
    notes: "Testing negative salary validation",
  });

  console.log(`✅ Client created: ${clientId}`);

  // Save census data
  const censusId = await client.mutation("census:saveCensus", {
    clientId,
    fileName: "test-census-negative-salary.csv",
    columns: headers,
    rows: dataRows,
  });

  console.log(`✅ Census imported: ${censusId}`);
  console.log("");

  // Wait a moment for validation to complete
  await new Promise((resolve) => setTimeout(resolve, 1000));

  // Fetch validation results
  const validation = await client.query("censusValidation:getValidation", {
    censusUploadId: censusId,
  });

  console.log("📊 VALIDATION RESULTS:");
  console.log("=".repeat(80));

  if (!validation) {
    console.log("❌ ERROR: No validation results found!");
    process.exit(1);
  }

  console.log("\nPEO Validation:");
  console.log(`  Overall Score: ${validation.peoScore}%`);
  console.log(
    `  Valid Rows: ${validation.peoValidRows} / ${validation.totalRows}`
  );

  console.log("\nACA Validation:");
  console.log(`  Overall Score: ${validation.acaScore}%`);
  console.log(
    `  Valid Rows: ${validation.acaValidRows} / ${validation.totalRows}`
  );
  console.log("");

  if (validation.issues && validation.issues.length > 0) {
    console.log(`Issues Found (${validation.issues.length}):`);
    for (const issue of validation.issues) {
      console.log(`  - Field: ${issue.field}`);
      console.log(`    Type: ${issue.issueType}`);
      console.log(`    Message: ${issue.message}`);
      console.log(`    Required For: ${issue.requiredFor}`);
      console.log(`    Affected Rows: [${issue.affectedRows.join(", ")}]`);
      console.log("");
    }
  } else {
    console.log("  ✅ No issues found");
  }

  // Verify test requirements
  console.log("\n" + "=".repeat(80));
  console.log("TEST VERIFICATION:");
  console.log("=".repeat(80));

  let allPassed = true;

  // Check 1: Census uploaded with negative/zero salary
  console.log("✅ Census uploaded with negative/zero salary values");

  // Check 2: Census imported successfully
  if (censusId) {
    console.log("✅ Census imported successfully");
  } else {
    console.log("❌ Census import failed");
    allPassed = false;
  }

  // Check 3: Validation detects invalid_value issues for salary
  const salaryIssues =
    validation.issues?.filter(
      (i) => i.field === "salary" && i.issueType === "invalid_value"
    ) || [];

  if (salaryIssues.length > 0) {
    console.log("✅ Validation detects invalid_value issues for salary");
  } else {
    console.log("❌ No invalid_value issues found for salary");
    allPassed = false;
  }

  // Check 4: Issue type is invalid_value (not missing_value)
  const hasInvalidValueIssue = salaryIssues.some(
    (i) => i.issueType === "invalid_value"
  );
  if (hasInvalidValueIssue) {
    console.log("✅ Issue type is invalid_value (not missing_value)");
  } else {
    console.log("❌ Issue type is not invalid_value");
    allPassed = false;
  }

  // Check 5: Rows 0 and 2 should be flagged (negative and zero)
  const affectedRows = salaryIssues[0]?.affectedRows || [];
  if (
    affectedRows.length === 2 &&
    affectedRows.includes(0) &&
    affectedRows.includes(2)
  ) {
    console.log(
      "✅ Rows with negative/zero salaries are identified (rows 0, 2)"
    );
  } else {
    console.log(
      `❌ Expected rows [0, 2] to be affected, got [${affectedRows.join(", ")}]`
    );
    allPassed = false;
  }

  // Check 6: Quality score should reflect 1 valid row out of 3 (33%)
  const expectedScore = Math.round((1 / 3) * 100);
  if (validation.peoScore === expectedScore) {
    console.log(`✅ Quality score is ${expectedScore}% (1 valid row out of 3)`);
  } else {
    console.log(
      `❌ Expected quality score ${expectedScore}%, got ${validation.peoScore}%`
    );
    allPassed = false;
  }

  console.log("\n" + "=".repeat(80));
  if (allPassed) {
    console.log("✅ ALL CHECKS PASSED - Feature #33 verified!");
  } else {
    console.log("❌ SOME CHECKS FAILED - Review results above");
    process.exit(1);
  }
}

testNegativeSalaryValidation().catch((error) => {
  console.error("❌ Test failed with error:", error);
  process.exit(1);
});
