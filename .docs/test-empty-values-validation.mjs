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

  // Step 2: Load and parse test CSV
  console.log("📋 Step 2: Loading test CSV with empty salary values...");
  const csvContent = readFileSync("./test-census-empty-values.csv", "utf-8");
  const { headers, rows } = parseCSV(csvContent);

  console.log(`  ✅ Parsed ${rows.length} rows`);
  console.log(`  ✅ Columns: ${headers.join(", ")}`);
  console.log("  📝 Row data:");
  rows.forEach((row, idx) => {
    console.log(`     Row ${idx}: Name="${row.Name}", Salary="${row.Salary}"`);
  });
  console.log("");

  // Step 3: Import census
  console.log("📋 Step 3: Importing census...");
  console.log(`  📝 Columns being sent: ${JSON.stringify(headers)}`);
  const censusId = await client.mutation(api.census.saveCensus, {
    clientId: testClient._id,
    fileName: "test-census-empty-values.csv",
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
  });
  console.log("");

  // Step 6: Verify missing_value issue
  console.log("📋 Step 6: Verifying missing_value detection...");
  const missingValueIssue = validation.issues.find(
    (i) => i.issueType === "missing_value" && i.field === "salary"
  );

  if (!missingValueIssue) {
    console.error("  ❌ FAIL: No missing_value issue found for salary field");
    process.exit(1);
  }

  console.log("  ✅ Issue Type:", missingValueIssue.issueType);
  console.log("  ✅ Field:", missingValueIssue.field);
  console.log("  ✅ Message:", missingValueIssue.message);
  console.log("  ✅ Required For:", missingValueIssue.requiredFor);
  console.log("  ✅ Affected Rows:", missingValueIssue.affectedRows);
  console.log("");

  // Step 7: Verify specific requirements
  console.log("📋 Step 7: Verifying test requirements...");

  // Check 1: Issue type is missing_value
  if (missingValueIssue.issueType !== "missing_value") {
    console.error(
      `  ❌ FAIL: Expected issueType "missing_value", got "${missingValueIssue.issueType}"`
    );
    process.exit(1);
  }
  console.log("  ✅ Issue type is 'missing_value'");

  // Check 2: Affected row indices are tracked (rows 1 and 3 - Jane Smith and Alice Williams)
  const expectedAffectedRows = [1, 3]; // 0-indexed: row 2 and row 4
  const actualAffectedRows = missingValueIssue.affectedRows.sort();
  const expectedSorted = expectedAffectedRows.sort();

  if (JSON.stringify(actualAffectedRows) !== JSON.stringify(expectedSorted)) {
    console.error(
      `  ❌ FAIL: Expected affected rows ${expectedSorted}, got ${actualAffectedRows}`
    );
    process.exit(1);
  }
  console.log(
    `  ✅ Affected row indices tracked correctly: ${actualAffectedRows}`
  );

  // Check 3: Quality score is reduced
  const expectedValidRows =
    validation.totalRows - missingValueIssue.affectedRows.length;
  const expectedScore = Math.round(
    (expectedValidRows / validation.totalRows) * 100
  );

  if (validation.peoScore > expectedScore) {
    console.error(
      `  ❌ FAIL: PEO score ${validation.peoScore}% is higher than expected ${expectedScore}%`
    );
    process.exit(1);
  }
  console.log(
    `  ✅ Quality score reduced: ${validation.peoScore}% (${validation.peoValidRows}/${validation.totalRows} valid)`
  );

  // Check 4: Required for both PEO and ACA
  if (missingValueIssue.requiredFor !== "both") {
    console.error(
      `  ❌ FAIL: Expected requiredFor "both", got "${missingValueIssue.requiredFor}"`
    );
    process.exit(1);
  }
  console.log("  ✅ Issue marked as required for both PEO and ACA");

  console.log("\n" + "=".repeat(80));
  console.log("🎉 ALL CHECKS PASSED! Feature #30 is working correctly.");
  console.log("=".repeat(80) + "\n");
}

main().catch((error) => {
  console.error("\n❌ Error:", error.message);
  console.error(error.stack);
  process.exit(1);
});
