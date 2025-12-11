#!/usr/bin/env node

import { ConvexHttpClient } from "convex/browser";
import fs from "fs";
import { api } from "./convex/_generated/api.js";

const client = new ConvexHttpClient(
  process.env.NEXT_PUBLIC_CONVEX_URL ||
    "https://valuable-wildcat-170.convex.cloud"
);

async function testPEOValidation() {
  console.log(
    "Testing Feature #118: Validate census with all PEO required fields"
  );

  // Step 1: Create a client
  console.log("\n1. Creating test client...");
  const clientId = await client.mutation(api.clients.createClient, {
    name: "Feature 118 PEO Test",
    contactEmail: "f118@test.com",
    notes: "Testing PEO validation with all required fields",
  });
  console.log(`✓ Client created: ${clientId}`);

  // Step 2: Read and parse the census file
  console.log("\n2. Reading test census file...");
  const csvContent = fs.readFileSync("./test-census-peo-valid.csv", "utf-8");
  const lines = csvContent.trim().split("\n");
  const columns = lines[0].split(",");
  const rows = lines.slice(1).map((line) => {
    const values = line.split(",");
    const row = {};
    columns.forEach((col, i) => {
      row[col] = values[i];
    });
    return row;
  });

  console.log(
    `✓ Parsed census: ${columns.length} columns, ${rows.length} rows`
  );
  console.log(`  Columns: ${columns.join(", ")}`);

  // Step 3: Save census to database
  console.log("\n3. Importing census...");
  const censusUploadId = await client.mutation(api.census.saveCensus, {
    clientId,
    fileName: "test-census-peo-valid.csv",
    columns,
    rows,
  });
  console.log(`✓ Census imported: ${censusUploadId}`);

  // Step 4: Wait for validation to complete
  console.log("\n4. Waiting for validation to complete...");
  await new Promise((resolve) => setTimeout(resolve, 2000));

  // Step 5: Get validation results
  console.log("\n5. Retrieving validation results...");
  const validation = await client.query(api.censusValidation.getValidation, {
    censusUploadId,
  });

  if (!validation) {
    console.log("❌ No validation results found");
    process.exit(1);
  }

  console.log("\n📊 VALIDATION RESULTS:");
  console.log(
    "================================================================================"
  );
  console.log(`PEO Score: ${validation.peoScore}/100`);
  console.log(`ACA Score: ${validation.acaScore}/100`);
  console.log(`Total Rows: ${validation.totalRows}`);
  console.log(
    `PEO Valid Rows: ${validation.peoValidRows}/${validation.totalRows}`
  );
  console.log(
    `ACA Valid Rows: ${validation.acaValidRows}/${validation.totalRows}`
  );
  console.log(`\nIssues Found: ${validation.issues.length}`);

  if (validation.issues.length > 0) {
    console.log("\n⚠️  ISSUES:");
    validation.issues.forEach((issue, i) => {
      console.log(`\n  ${i + 1}. ${issue.message}`);
      console.log(`     Field: ${issue.field}`);
      console.log(`     Type: ${issue.issueType}`);
      console.log(`     Required for: ${issue.requiredFor}`);
      console.log(`     Affected rows: ${issue.affectedRows.length}`);
    });
  }

  console.log(
    "\n================================================================================"
  );

  // Verify test expectations - Feature #118 is specifically about PEO validation
  console.log("\n✅ TEST VERIFICATION (PEO only):");

  // Check for PEO-specific issues only
  const peoIssues = validation.issues.filter(
    (issue) => issue.requiredFor === "PEO" || issue.requiredFor === "both"
  );

  const allPass = validation.peoScore === 100 && peoIssues.length === 0;

  if (validation.peoScore === 100) {
    console.log("✓ PEO quality score is 100");
  } else {
    console.log(`✗ PEO quality score is ${validation.peoScore}, expected 100`);
  }

  if (peoIssues.length === 0) {
    console.log("✓ No PEO validation issues reported");
  } else {
    console.log(`✗ ${peoIssues.length} PEO validation issues found`);
  }

  if (allPass) {
    console.log(
      "\n🎉 Feature #118 PASSED: PEO validation with all required fields works correctly"
    );
    process.exit(0);
  } else {
    console.log("\n❌ Feature #118 FAILED: See issues above");
    process.exit(1);
  }
}

testPEOValidation().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});
