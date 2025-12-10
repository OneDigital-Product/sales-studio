#!/usr/bin/env node
import { ConvexHttpClient } from "convex/browser";
import { api } from "./convex/_generated/api.js";

const client = new ConvexHttpClient(
  process.env.NEXT_PUBLIC_CONVEX_URL ||
    "https://valuable-wildcat-170.convex.cloud"
);

async function test() {
  console.log(
    "Feature #119: Validate census with all ACA required fields present"
  );
  console.log(
    "============================================================================"
  );

  // Step 1: Create client
  console.log("\n1. Creating test client...");
  const clientId = await client.mutation(api.clients.createClient, {
    name: "Feature 119 ACA Test",
    contactEmail: "aca@test.com",
    notes: "Testing ACA validation with all required fields",
  });
  console.log("✓ Client created:", clientId);

  // Step 2: Import census with all ACA fields
  console.log("\n2. Importing census with all ACA required fields...");
  const columns = [
    "Employee Name",
    "Date of Birth",
    "ZIP Code",
    "Salary",
    "Coverage Tier",
    "Hours Per Week",
    "Hire Date",
  ];
  const rowsData = [
    [
      "John Smith",
      "1985-03-15",
      "90210",
      "75000",
      "Employee Only",
      "40",
      "2020-01-15",
    ],
    [
      "Jane Doe",
      "1990-07-22",
      "10001",
      "82000",
      "Employee + Spouse",
      "40",
      "2019-06-01",
    ],
    [
      "Bob Johnson",
      "1978-11-08",
      "60601",
      "95000",
      "Family",
      "45",
      "2018-03-20",
    ],
    [
      "Alice Williams",
      "1992-04-30",
      "98101",
      "68000",
      "Employee + Children",
      "38",
      "2021-09-10",
    ],
    [
      "Charlie Brown",
      "1988-09-12",
      "30301",
      "71000",
      "Employee Only",
      "40",
      "2022-02-28",
    ],
  ];

  // Convert array of arrays to array of objects
  const rows = rowsData.map((values) => {
    const row = {};
    columns.forEach((col, i) => {
      row[col] = values[i];
    });
    return row;
  });

  const censusUploadId = await client.mutation(api.census.saveCensus, {
    clientId,
    fileName: "test-census-aca-valid.csv",
    columns,
    rows,
  });
  console.log("✓ Census imported:", censusUploadId);

  // Wait for validation to complete
  await new Promise((resolve) => setTimeout(resolve, 2000));

  // Step 3: Get validation results
  console.log("\n3. Checking validation results...");
  const validation = await client.query(api.censusValidation.getValidation, {
    censusUploadId,
  });

  if (!validation) {
    console.error("✗ Validation not found!");
    process.exit(1);
  }

  console.log("\nValidation Results:");
  console.log("  Total rows:", validation.totalRows);
  console.log("  PEO score:", validation.peoScore);
  console.log("  PEO valid rows:", validation.peoValidRows);
  console.log("  ACA score:", validation.acaScore);
  console.log("  ACA valid rows:", validation.acaValidRows);
  console.log("  Issues found:", validation.issues.length);

  // Step 4: Verify ACA validation passes
  console.log("\n4. Verifying ACA validation...");
  if (validation.acaScore !== 100) {
    console.error(`✗ ACA score is ${validation.acaScore}, expected 100`);
    console.log("\nIssues:");
    validation.issues.forEach((issue) => {
      console.log(`  - ${issue.field}: ${issue.message} (${issue.issueType})`);
      console.log(`    Required for: ${issue.requiredFor}`);
      console.log(`    Affected rows: ${issue.affectedRows.join(", ")}`);
    });
    process.exit(1);
  }
  console.log("✓ ACA score is 100");

  // Step 5: Verify no issues reported
  console.log("\n5. Verifying no issues...");
  if (validation.issues.length > 0) {
    console.error(`✗ Found ${validation.issues.length} issues, expected 0`);
    validation.issues.forEach((issue) => {
      console.log(`  - ${issue.field}: ${issue.message}`);
    });
    process.exit(1);
  }
  console.log("✓ No issues found");

  console.log(
    "\n============================================================================"
  );
  console.log("✓ Feature #119 TEST PASSED");
  console.log("  Client ID:", clientId);
  console.log("  Census Upload ID:", censusUploadId);
  console.log(
    "============================================================================"
  );
}

test().catch(console.error);
