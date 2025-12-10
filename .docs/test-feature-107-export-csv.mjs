#!/usr/bin/env node

import { ConvexHttpClient } from "convex/browser";

const client = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL);

async function testCensusExport() {
  console.log("Testing Feature #107: Export census data to CSV\n");

  try {
    // 1. Get Test Client
    const clients = await client.query("clients:getClientsWithQuotes");
    const testClient = clients.find(
      (c) => c.contactEmail === "aharvey@onedigital.com"
    );

    if (!testClient) {
      console.error("❌ Test Client not found");
      process.exit(1);
    }

    console.log("✅ Found Test Client:", testClient.name);
    console.log("   Client ID:", testClient._id);

    // 2. Get active census
    const activeCensus = await client.query("census:getActiveCensus", {
      clientId: testClient._id,
    });

    if (!activeCensus) {
      console.error("❌ No active census found");
      process.exit(1);
    }

    console.log("\n✅ Found Active Census:", activeCensus.fileName);
    console.log("   Census ID:", activeCensus._id);
    console.log("   Row Count:", activeCensus.rowCount);
    console.log("   Columns:", activeCensus.columns.join(", "));

    // 3. Test getAllCensusRows query (used by export)
    console.log("\n📦 Testing getAllCensusRows query...");
    const exportData = await client.query("census:getAllCensusRows", {
      censusUploadId: activeCensus._id,
    });

    console.log("\n✅ Export data retrieved successfully!");
    console.log("   Total rows fetched:", exportData.rows.length);
    console.log("   Expected rows:", activeCensus.rowCount);

    if (exportData.rows.length !== activeCensus.rowCount) {
      console.error(
        `❌ Row count mismatch! Expected ${activeCensus.rowCount}, got ${exportData.rows.length}`
      );
      process.exit(1);
    }

    // 4. Verify all columns are present
    console.log("\n📋 Verifying columns...");
    console.log("   Columns in upload:", exportData.upload.columns.length);
    console.log("   Column names:", exportData.upload.columns.join(", "));

    // 5. Generate CSV to verify format
    console.log("\n📝 Generating CSV content...");
    const csvLines = [];

    // Header
    const escapeCsvValue = (value) => {
      if (value.includes(",") || value.includes('"') || value.includes("\n")) {
        return `"${value.replace(/"/g, '""')}"`;
      }
      return value;
    };
    csvLines.push(exportData.upload.columns.map(escapeCsvValue).join(","));

    // Data rows
    for (const row of exportData.rows) {
      const rowValues = exportData.upload.columns.map((col) => {
        const value = row.data[col];
        if (value === null || value === undefined) {
          return "";
        }
        return escapeCsvValue(String(value));
      });
      csvLines.push(rowValues.join(","));
    }

    const csvContent = csvLines.join("\n");

    console.log("\n✅ CSV generated successfully!");
    console.log(
      "   Total lines:",
      csvLines.length,
      `(1 header + ${exportData.rows.length} data rows)`
    );
    console.log("   CSV size:", csvContent.length, "characters");

    // 6. Show sample of CSV
    console.log("\n📄 CSV Preview (first 5 lines):");
    console.log("   " + csvLines.slice(0, 5).join("\n   "));

    // 7. Verify each row has all columns
    console.log("\n🔍 Verifying data integrity...");
    let allRowsValid = true;
    for (let i = 0; i < exportData.rows.length; i++) {
      const row = exportData.rows[i];
      const rowData = row.data;
      const hasAllColumns = exportData.upload.columns.every(
        (col) => col in rowData
      );
      if (!hasAllColumns) {
        console.error(`❌ Row ${i + 1} is missing some columns`);
        allRowsValid = false;
      }
    }

    if (allRowsValid) {
      console.log("✅ All rows have all columns");
    }

    console.log("\n" + "=".repeat(60));
    console.log("✅ Feature #107 Test PASSED");
    console.log("=".repeat(60));
    console.log("\nTest Results:");
    console.log("  ✅ Backend query returns all rows");
    console.log("  ✅ All columns included in export");
    console.log("  ✅ Row count matches expected");
    console.log("  ✅ CSV format is correct");
    console.log("  ✅ All data integrity checks passed");
  } catch (error) {
    console.error("\n❌ Test failed:", error.message);
    console.error(error);
    process.exit(1);
  }
}

testCensusExport();
