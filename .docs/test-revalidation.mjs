#!/usr/bin/env node

import { ConvexHttpClient } from "convex/browser";
import * as fs from "fs";
import { api } from "./convex/_generated/api.js";

const client = new ConvexHttpClient(
  "https://valuable-wildcat-170.convex.cloud"
);

async function testRevalidation() {
  console.log(
    "\n=== Testing Feature #38: Re-validate census after manual corrections ===\n"
  );

  // Step 1: Find the "50 Percent Test Client"
  const clients = await client.query(api.clients.getClients);
  const testClient = clients.find((c) => c.name === "50 Percent Test Client");

  if (!testClient) {
    console.log("❌ 50 Percent Test Client not found");
    return;
  }

  console.log(`✅ Found client: ${testClient.name} (ID: ${testClient._id})`);

  // Step 2: Get initial validation state
  const initialCensus = await client.query(api.census.getLatestCensus, {
    clientId: testClient._id,
  });

  if (!initialCensus) {
    console.log("❌ No census found for this client");
    return;
  }

  console.log(`\nInitial Census: ${initialCensus.fileName}`);
  console.log(`Row Count: ${initialCensus.rowCount}`);

  const initialValidation = await client.query(
    api.censusValidation.getValidation,
    {
      censusUploadId: initialCensus._id,
    }
  );

  if (initialValidation) {
    console.log("\nInitial Validation Scores:");
    console.log(`  PEO Score: ${initialValidation.peoScore}%`);
    console.log(`  ACA Score: ${initialValidation.acaScore}%`);
    console.log(`  Total Issues: ${initialValidation.issues.length}`);
  } else {
    console.log("\n⚠️  No validation found for initial census");
  }

  // Step 3: Upload corrected census file
  console.log("\n--- Uploading Corrected Census ---");

  const uploadUrl = await client.mutation(api.files.generateUploadUrl);
  const correctedCsvPath = "./test-census-50-percent-corrected.csv";

  if (!fs.existsSync(correctedCsvPath)) {
    console.log(`❌ Corrected census file not found: ${correctedCsvPath}`);
    return;
  }

  const fileContent = fs.readFileSync(correctedCsvPath);
  const uploadResponse = await fetch(uploadUrl, {
    method: "POST",
    headers: { "Content-Type": "text/csv" },
    body: fileContent,
  });

  if (!uploadResponse.ok) {
    console.log("❌ File upload failed");
    return;
  }

  const { storageId } = await uploadResponse.json();
  console.log(`✅ File uploaded (storageId: ${storageId})`);

  // Step 4: Save file metadata
  await client.mutation(api.files.saveFile, {
    storageId,
    clientId: testClient._id,
    name: "test-census-50-percent-corrected.csv",
    type: "Other",
  });

  console.log("✅ File metadata saved");

  // Step 5: Parse and import census (simulating the import flow)
  const rows = fileContent
    .toString()
    .split("\n")
    .filter((line) => line.trim());
  const headers = rows[0].split(",").map((h) => h.trim());
  const dataRows = rows.slice(1).map((row) => {
    const values = row.split(",");
    const obj = {};
    headers.forEach((header, i) => {
      obj[header] = values[i]?.trim() || "";
    });
    return obj;
  });

  console.log(`\nParsed ${dataRows.length} data rows`);
  console.log(`Columns: ${headers.join(", ")}`);

  // Save census
  const censusUploadId = await client.mutation(api.census.saveCensus, {
    clientId: testClient._id,
    fileName: "test-census-50-percent-corrected.csv",
    columns: headers,
    rows: dataRows,
  });

  console.log(`✅ Census imported (ID: ${censusUploadId})`);

  // Step 6: Wait a moment for validation to run
  await new Promise((resolve) => setTimeout(resolve, 2000));

  // Step 7: Get new validation state
  const newValidation = await client.query(api.censusValidation.getValidation, {
    censusUploadId,
  });

  if (newValidation) {
    console.log("\n=== NEW VALIDATION RESULTS ===");
    console.log(`  PEO Score: ${newValidation.peoScore}%`);
    console.log(`  ACA Score: ${newValidation.acaScore}%`);
    console.log(`  Total Issues: ${newValidation.issues.length}`);

    if (newValidation.issues.length > 0) {
      console.log("\n  Validation Issues:");
      newValidation.issues.forEach((issue) => {
        console.log(
          `    - [${issue.requiredFor}] ${issue.message} (affects ${issue.affectedRows.length} row(s))`
        );
      });
    }

    // Verify improvement
    console.log("\n=== VERIFICATION ===");

    const peoImproved =
      !initialValidation || newValidation.peoScore > initialValidation.peoScore;
    const acaImproved =
      !initialValidation || newValidation.acaScore > initialValidation.acaScore;

    if (peoImproved) {
      console.log(
        `✅ PEO Score improved: ${initialValidation?.peoScore || 0}% → ${newValidation.peoScore}%`
      );
    } else {
      console.log(
        `⚠️  PEO Score: ${initialValidation?.peoScore || 0}% → ${newValidation.peoScore}%`
      );
    }

    if (acaImproved) {
      console.log(
        `✅ ACA Score improved: ${initialValidation?.acaScore || 0}% → ${newValidation.acaScore}%`
      );
    } else {
      console.log(
        `⚠️  ACA Score: ${initialValidation?.acaScore || 0}% → ${newValidation.acaScore}%`
      );
    }

    if (newValidation.peoScore === 100 && newValidation.acaScore === 100) {
      console.log("\n✅✅✅ PERFECT! Both scores are now 100%");
    }

    console.log(
      "\n✅ Feature #38 VERIFIED: Validation ran automatically after census replacement"
    );
  } else {
    console.log(
      "\n❌ FAILED: No validation found after uploading corrected census"
    );
  }
}

testRevalidation().catch(console.error);
