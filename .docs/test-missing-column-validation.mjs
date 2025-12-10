#!/usr/bin/env node

/**
 * Test Feature #29: Validate census with missing required column (PEO)
 * This script imports a census file without the salary column and verifies
 * that validation detects the missing_column issue.
 */

import { ConvexHttpClient } from "convex/browser";
import { readFileSync } from "fs";
import { api } from "./convex/_generated/api.js";

const client = new ConvexHttpClient(
  process.env.NEXT_PUBLIC_CONVEX_URL ||
    "https://valuable-wildcat-170.convex.cloud"
);

// Simple CSV parser
function parseCSV(content) {
  const lines = content.trim().split("\n");
  const headers = lines[0].split(",").map((h) => h.trim());
  const records = [];

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(",").map((v) => v.trim());
    const record = {};
    for (let j = 0; j < headers.length; j++) {
      record[headers[j]] = values[j];
    }
    records.push(record);
  }

  return { headers, records };
}

async function testMissingColumnValidation() {
  console.log(
    "🧪 Testing Feature #29: Validate census with missing required column (PEO)\n"
  );

  // Step 1: Find Test Client
  console.log("Step 1: Finding Test Client...");
  const clients = await client.query(api.clients.getClients);
  console.log(
    `   Found ${clients.length} clients:`,
    clients.map((c) => c.name)
  );
  const testClient = clients.find((c) => c.name === "Test Client");

  if (!testClient) {
    console.error("❌ Test Client not found. Creating one...");
    const clientId = await client.mutation(api.clients.createClient, {
      name: "Test Client",
      contactEmail: "test@example.com",
      notes: "Test client for Feature #29",
    });
    const newClient = await client.query(api.clients.getClient, {
      id: clientId,
    });
    console.log(`✅ Created Test Client (ID: ${newClient._id})\n`);
    return testMissingColumnValidation(); // Re-run with new client
  }
  console.log(`✅ Found Test Client (ID: ${testClient._id})\n`);

  // Step 2: Parse census file without salary column
  console.log("Step 2: Parsing test-census-missing-column.csv...");
  const csvContent = readFileSync("./test-census-missing-column.csv", "utf-8");
  const { headers: columns, records } = parseCSV(csvContent);

  console.log(`   Columns found: ${columns.join(", ")}`);
  console.log(`   ⚠️  Note: "Salary" column is MISSING (required for PEO)`);
  console.log(`   Rows: ${records.length}\n`);

  // Step 3: Import census data
  console.log("Step 3: Importing census data...");
  const censusUploadId = await client.mutation(api.census.saveCensus, {
    clientId: testClient._id,
    fileName: "test-census-missing-column.csv",
    columns,
    rows: records,
  });
  console.log(`✅ Census imported (ID: ${censusUploadId})\n`);

  // Step 4: Run validation
  console.log("Step 4: Running validation...");
  const validationId = await client.mutation(
    api.censusValidation.validateCensus,
    {
      censusUploadId,
    }
  );
  console.log(`✅ Validation completed (ID: ${validationId})\n`);

  // Step 5: Get validation results
  console.log("Step 5: Retrieving validation results...");
  const validation = await client.query(api.censusValidation.getValidation, {
    censusUploadId,
  });

  if (!validation) {
    console.error("❌ Validation results not found");
    process.exit(1);
  }

  // Step 6: Verify results
  console.log("\n📊 VALIDATION RESULTS:");
  console.log("=".repeat(60));
  console.log(
    `PEO Score: ${validation.peoScore}% (${validation.peoValidRows}/${validation.totalRows} rows valid)`
  );
  console.log(
    `ACA Score: ${validation.acaScore}% (${validation.acaValidRows}/${validation.totalRows} rows valid)`
  );
  console.log(`\nTotal Issues: ${validation.issues.length}`);
  console.log("=".repeat(60));

  if (validation.issues.length > 0) {
    console.log("\n🔍 ISSUES FOUND:");
    for (const issue of validation.issues) {
      console.log(`\n  Field: ${issue.field}`);
      console.log(`  Type: ${issue.issueType}`);
      console.log(`  Message: ${issue.message}`);
      console.log(`  Required For: ${issue.requiredFor}`);
      console.log(`  Affected Rows: ${issue.affectedRows.length} row(s)`);
    }
  }

  // Step 7: Verify expected behavior
  console.log("\n\n✅ FEATURE #29 VERIFICATION:");
  console.log("=".repeat(60));

  const missingColumnIssue = validation.issues.find(
    (i) => i.issueType === "missing_column" && i.field === "salary"
  );

  if (missingColumnIssue) {
    console.log("✅ PASS: Validation detected missing 'salary' column");
    console.log(`   Issue Type: ${missingColumnIssue.issueType}`);
    console.log(`   Message: ${missingColumnIssue.message}`);
    console.log(`   Required For: ${missingColumnIssue.requiredFor}`);
    console.log(
      `   Affected: All ${missingColumnIssue.affectedRows.length} rows`
    );
  } else {
    console.log("❌ FAIL: Missing column issue not detected for 'salary'");
    process.exit(1);
  }

  if (validation.peoScore < 100) {
    console.log(
      `✅ PASS: PEO score reduced to ${validation.peoScore}% (expected < 100%)`
    );
  } else {
    console.log(
      "❌ FAIL: PEO score should be < 100% due to missing salary column"
    );
    process.exit(1);
  }

  if (validation.acaScore < 100) {
    console.log(
      `✅ PASS: ACA score reduced to ${validation.acaScore}% (expected < 100%)`
    );
  } else {
    console.log(
      "❌ FAIL: ACA score should be < 100% due to missing salary column"
    );
    process.exit(1);
  }

  console.log("\n🎉 ALL CHECKS PASSED! Feature #29 is working correctly.");
  console.log("=".repeat(60));

  process.exit(0);
}

testMissingColumnValidation().catch((error) => {
  console.error("❌ Error:", error);
  process.exit(1);
});
