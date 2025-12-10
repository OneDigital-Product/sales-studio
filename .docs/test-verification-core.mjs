#!/usr/bin/env node
import { ConvexHttpClient } from "convex/browser";
import { readFileSync } from "fs";
import { api } from "./convex/_generated/api.js";

const client = new ConvexHttpClient(
  process.env.NEXT_PUBLIC_CONVEX_URL ||
    "https://caring-jellyfish-527.convex.cloud"
);

async function runTest() {
  console.log("=== VERIFICATION TEST: 100% Valid Census Quality Score ===\n");

  // Read valid census file
  const csvContent = readFileSync("test-census-valid.csv", "utf-8");
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

  // Create test client
  const clientId = await client.mutation(api.clients.createClient, {
    name: "Verification Test Client",
    contactEmail: "verify@test.com",
    notes: "100% valid census verification",
  });
  console.log(`Created client: ${clientId}`);

  // Import census
  await client.mutation(api.census.saveCensus, {
    clientId,
    fileName: "test-census-valid.csv",
    columns: headers,
    rows: dataRows,
  });
  console.log("Census imported");

  // Wait for validation
  await new Promise((resolve) => setTimeout(resolve, 1000));

  // Get validation
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

  console.log("\n=== PEO Validation ===");
  const peoValidation = validation.find((v) => v.validationType === "PEO");
  console.log(`Score: ${peoValidation.overallScore}%`);
  console.log(`Issues: ${peoValidation.issues.length}`);

  console.log("\n=== ACA Validation ===");
  const acaValidation = validation.find((v) => v.validationType === "ACA");
  console.log(`Score: ${acaValidation.overallScore}%`);
  console.log(`Issues: ${acaValidation.issues.length}`);

  // Verify
  let passed = true;
  if (peoValidation.overallScore !== 100) {
    console.error(
      `❌ PEO score should be 100, got ${peoValidation.overallScore}`
    );
    passed = false;
  }
  if (peoValidation.issues.length !== 0) {
    console.error(
      `❌ PEO should have 0 issues, got ${peoValidation.issues.length}`
    );
    passed = false;
  }

  if (passed) {
    console.log("\n✅ VERIFICATION TEST PASSED - App working correctly");
    process.exit(0);
  } else {
    console.log("\n❌ VERIFICATION TEST FAILED");
    process.exit(1);
  }
}

runTest().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});
