#!/usr/bin/env node
import { ConvexHttpClient } from "convex/browser";
import { readFileSync } from "fs";
import { api } from "./convex/_generated/api.js";

const client = new ConvexHttpClient(
  "https://valuable-wildcat-170.convex.cloud"
);

async function runTest() {
  console.log("=== Feature #35: Census Quality Score (50% Valid) ===\n");

  const csvContent = readFileSync("test-census-50-percent.csv", "utf-8");
  const lines = csvContent.trim().split("\n");
  const headers = lines[0].split(",");
  const dataRows = lines.slice(1).map((line) => {
    const values = line.split(",");
    const row = {};
    headers.forEach((header, i) => {
      row[header.trim()] = values[i]?.trim() || "";
    });
    return row;
  });

  console.log(`Parsed ${dataRows.length} rows with ${headers.length} columns`);
  console.log("Expected: 2 valid rows, 2 invalid rows = 50% score\n");

  const clientId = await client.mutation(api.clients.createClient, {
    name: "50 Percent Test Client",
    contactEmail: "fifty@test.com",
    notes: "Testing 50% quality score",
  });
  console.log(`Created client: ${clientId}`);

  await client.mutation(api.census.saveCensus, {
    clientId,
    fileName: "test-census-50-percent.csv",
    columns: headers,
    rows: dataRows,
  });
  console.log("Census imported");

  await new Promise((resolve) => setTimeout(resolve, 1500));

  const censusUploads = await client.query(api.census.getLatestCensus, {
    clientId,
  });
  if (!censusUploads) {
    console.error("❌ No census found");
    process.exit(1);
  }

  const validation = await client.query(api.censusValidation.getValidation, {
    censusUploadId: censusUploads._id,
  });

  if (!validation) {
    console.error("❌ No validation found");
    process.exit(1);
  }

  console.log("\n=== Validation Results ===");
  console.log(`PEO Score: ${validation.peoScore}%`);
  console.log(`ACA Score: ${validation.acaScore}%`);
  console.log(`Total Rows: ${validation.totalRows}`);
  console.log(`PEO Valid Rows: ${validation.peoValidRows}`);
  console.log(`ACA Valid Rows: ${validation.acaValidRows}`);
  console.log(`Issues: ${validation.issues.length}`);

  if (validation.issues.length > 0) {
    console.log("\nIssue Details:");
    validation.issues.forEach((issue) => {
      console.log(
        `  - ${issue.field}: ${issue.issueType} (${issue.affectedRows.length} rows)`
      );
      console.log(`    Message: ${issue.message}`);
      console.log(`    Required for: ${issue.requiredFor}`);
      console.log(`    Affected rows: [${issue.affectedRows.join(", ")}]`);
    });
  }

  let passed = true;

  // Check if score is approximately 50% (allowing for rounding)
  if (validation.peoScore < 40 || validation.peoScore > 60) {
    console.error(`\n❌ PEO score should be ~50%, got ${validation.peoScore}%`);
    passed = false;
  }

  // Check that we have the expected number of issues
  if (validation.issues.length === 0) {
    console.error("\n❌ Should have validation issues");
    passed = false;
  }

  if (passed) {
    console.log(
      "\n✅ Feature #35 PASSED - 50% quality score calculated correctly"
    );
    process.exit(0);
  } else {
    console.log("\n❌ Feature #35 FAILED");
    process.exit(1);
  }
}

runTest().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});
