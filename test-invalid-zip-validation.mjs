#!/usr/bin/env node

/**
 * Test Feature #32: Validate census with invalid zip code format
 *
 * Test cases:
 * - 1234 (4 digits)
 * - 123456 (6 digits)
 * - ABCDE (letters)
 * - 12345-678 (wrong format for ZIP+4)
 */

import { ConvexHttpClient } from "convex/browser";
import fs from "fs";

const client = new ConvexHttpClient(
  "https://valuable-wildcat-170.convex.cloud"
);

async function testInvalidZipValidation() {
  console.log(
    "🧪 Testing Feature #32: Validate census with invalid zip code format\n"
  );

  // Read and parse the test CSV file
  const csvContent = fs.readFileSync("test-census-invalid-zips.csv", "utf-8");
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

  console.log("\n📤 Uploading census with invalid zip codes...");

  // Create test client
  const clientId = await client.mutation("clients:createClient", {
    name: "Invalid Zip Test Client",
    contactEmail: "ziptest@example.com",
    notes: "Testing invalid zip code validation",
  });

  console.log(`✅ Client created: ${clientId}`);

  // Save census data - IMPORTANT: Pass raw data objects, not wrapped
  const censusId = await client.mutation("census:saveCensus", {
    clientId,
    fileName: "test-census-invalid-zips.csv",
    columns: headers,
    rows: dataRows, // Raw data objects, NOT wrapped in {data, rowIndex}
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

  // Check 1: Census uploaded with invalid zip codes
  console.log("✅ Census uploaded with invalid zip codes");

  // Check 2: Census imported successfully
  if (censusId) {
    console.log("✅ Census imported successfully");
  } else {
    console.log("❌ Census import failed");
    allPassed = false;
  }

  // Check 3: Validation detects invalid_value issues for zip_code
  const zipIssues =
    validation.issues?.filter(
      (i) => i.field === "zip_code" && i.issueType === "invalid_value"
    ) || [];

  if (zipIssues.length > 0) {
    console.log("✅ Validation detects invalid_value issues for zip_code");
  } else {
    console.log("❌ No invalid_value issues found for zip_code");
    allPassed = false;
  }

  // Check 4: Issue type is invalid_value (not missing_value)
  const hasInvalidValueIssue = zipIssues.some(
    (i) => i.issueType === "invalid_value"
  );
  if (hasInvalidValueIssue) {
    console.log("✅ Issue type is invalid_value (not missing_value)");
  } else {
    console.log("❌ Issue type is not invalid_value");
    allPassed = false;
  }

  // Check 5: All 4 rows should be flagged as invalid
  const affectedRows = zipIssues[0]?.affectedRows || [];
  if (
    affectedRows.length === 4 &&
    affectedRows.includes(0) &&
    affectedRows.includes(1) &&
    affectedRows.includes(2) &&
    affectedRows.includes(3)
  ) {
    console.log("✅ All 4 rows with invalid zip codes are identified");
  } else {
    console.log(
      `❌ Expected 4 affected rows, got ${affectedRows.length}: [${affectedRows.join(", ")}]`
    );
    allPassed = false;
  }

  // Check 6: Quality score should be reduced (0% since all rows are invalid)
  if (validation.peoScore === 0) {
    console.log("✅ Quality score is reduced to 0% (all rows invalid)");
  } else {
    console.log(`❌ Expected quality score 0%, got ${validation.peoScore}%`);
    allPassed = false;
  }

  console.log("\n" + "=".repeat(80));
  if (allPassed) {
    console.log("✅ ALL CHECKS PASSED - Feature #32 verified!");
  } else {
    console.log("❌ SOME CHECKS FAILED - Review results above");
    process.exit(1);
  }
}

testInvalidZipValidation().catch((error) => {
  console.error("❌ Test failed with error:", error);
  process.exit(1);
});
