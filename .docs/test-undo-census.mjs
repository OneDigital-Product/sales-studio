#!/usr/bin/env node

// Test script for undo census replacement feature
import { ConvexHttpClient } from "convex/browser";
import fs from "fs";

const client = new ConvexHttpClient(
  process.env.NEXT_PUBLIC_CONVEX_URL || "https://sunny-swift-706.convex.cloud"
);

// Simple CSV parser
function parseCSV(csvContent) {
  const lines = csvContent.trim().split("\n");
  const headers = lines[0].split(",");
  const records = [];

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(",");
    const record = {};
    headers.forEach((header, index) => {
      record[header] = values[index];
    });
    records.push(record);
  }

  return { columns: headers, records };
}

async function main() {
  console.log("Testing Undo Census Replacement Feature");
  console.log("=".repeat(80));

  // Find the Test Client
  const clients = await client.query("clients/getClients");
  const testClient = clients.find((c) => c.name === "Test Client");

  if (!testClient) {
    console.error("❌ Test Client not found");
    return;
  }

  console.log(`✓ Found Test Client (ID: ${testClient._id})`);

  // Get current active census
  const currentCensus = await client.query("census/getActiveCensus", {
    clientId: testClient._id,
  });

  if (!currentCensus) {
    console.error("❌ No active census found");
    return;
  }

  console.log(
    `✓ Current active census: ${currentCensus.fileName} (${currentCensus.rowCount} rows)`
  );

  // Load replacement census file
  const csvContent = fs.readFileSync("replacement-census-2025.csv", "utf-8");
  const { columns, records } = parseCSV(csvContent);

  console.log(
    `✓ Loaded replacement census: ${records.length} rows, ${columns.length} columns`
  );

  // Save the new census (this will replace the active one)
  console.log("\n📤 Uploading replacement census...");
  const result = await client.mutation("census/saveCensus", {
    clientId: testClient._id,
    fileName: "replacement-census-2025.csv",
    columns,
    rows: records,
  });

  console.log("✓ Census uploaded successfully");
  console.log(`  - New census ID: ${result.censusUploadId}`);
  console.log(`  - Previous census ID: ${result.previousCensusId}`);

  if (!result.previousCensusId) {
    console.error("❌ No previous census ID returned - undo won't work!");
    return;
  }

  // Verify the new census is now active
  await new Promise((resolve) => setTimeout(resolve, 1000));
  const newActiveCensus = await client.query("census/getActiveCensus", {
    clientId: testClient._id,
  });

  if (newActiveCensus._id !== result.censusUploadId) {
    console.error("❌ New census is not active!");
    return;
  }

  console.log(
    `✓ New census is now active: ${newActiveCensus.fileName} (${newActiveCensus.rowCount} rows)`
  );

  // Now test the undo functionality
  console.log("\n⏪ Testing undo functionality...");
  await client.mutation("census/setActiveCensus", {
    clientId: testClient._id,
    censusUploadId: result.previousCensusId,
  });

  // Verify the previous census is restored
  await new Promise((resolve) => setTimeout(resolve, 1000));
  const restoredCensus = await client.query("census/getActiveCensus", {
    clientId: testClient._id,
  });

  if (restoredCensus._id !== result.previousCensusId) {
    console.error("❌ Undo failed - previous census not restored!");
    return;
  }

  console.log(
    `✓ Undo successful! Restored: ${restoredCensus.fileName} (${restoredCensus.rowCount} rows)`
  );

  console.log("\n" + "=".repeat(80));
  console.log(
    "✅ All tests passed! Undo census replacement feature is working correctly."
  );
}

main().catch((error) => {
  console.error("Error:", error);
  process.exit(1);
});
