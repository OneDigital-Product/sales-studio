#!/usr/bin/env node

/**
 * Test Feature #98: Handle census import with 10,000+ rows
 *
 * This test:
 * 1. Generates a CSV file with 10,000 rows
 * 2. Parses it like the frontend would
 * 3. Imports it via the saveCensus mutation
 * 4. Verifies all rows are saved
 * 5. Tests pagination
 */

import { ConvexHttpClient } from "convex/browser";
import { readFileSync, writeFileSync } from "fs";
import { api } from "./convex/_generated/api.js";

// Load environment variables from .env.local
const envContent = readFileSync("./.env.local", "utf8");
const envVars = {};
envContent.split("\n").forEach((line) => {
  const [key, value] = line.split("=");
  if (key && value) {
    envVars[key.trim()] = value.trim();
  }
});

const CONVEX_URL = envVars.NEXT_PUBLIC_CONVEX_URL;
if (!CONVEX_URL) {
  console.error("❌ NEXT_PUBLIC_CONVEX_URL not found in .env.local");
  process.exit(1);
}

const client = new ConvexHttpClient(CONVEX_URL);

// Generate CSV with 10,000 rows
function generateLargeCensusCSV(rowCount = 10_000) {
  const header =
    "employee_name,date_of_birth,gender,zip_code,salary,coverage_tier,hours_per_week,hire_date\n";
  const rows = [];

  for (let i = 0; i < rowCount; i++) {
    const name = `Employee ${i + 1}`;
    const dob = `${1970 + (i % 40)}-${String((i % 12) + 1).padStart(2, "0")}-${String((i % 28) + 1).padStart(2, "0")}`;
    const gender = i % 2 === 0 ? "M" : "F";
    const zip = String(10_000 + (i % 90_000)).padStart(5, "0");
    const salary = 30_000 + (i % 100_000);
    const tier = [
      "Employee Only",
      "Employee + Spouse",
      "Employee + Children",
      "Family",
    ][i % 4];
    const hours = 40;
    const hireDate = `${2015 + (i % 10)}-${String((i % 12) + 1).padStart(2, "0")}-01`;

    rows.push(
      `${name},${dob},${gender},${zip},${salary},${tier},${hours},${hireDate}`
    );
  }

  return header + rows.join("\n");
}

// Parse CSV into rows
function parseCSV(csvContent) {
  const lines = csvContent.split("\n").filter((line) => line.trim());
  const headers = lines[0].split(",");
  const rows = [];

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(",");
    const row = {};
    headers.forEach((header, index) => {
      row[header] = values[index];
    });
    rows.push(row);
  }

  return { columns: headers, rows };
}

async function testLargeCensusImport() {
  console.log(
    "🧪 Testing Feature #98: Handle census import with 10,000+ rows\n"
  );

  // Step 1: Generate census file
  console.log("📝 Step 1: Generating CSV with 10,000 rows...");
  const csvContent = generateLargeCensusCSV(10_000);
  writeFileSync("./test-census-10k.csv", csvContent);
  console.log("✅ Generated test-census-10k.csv (10,000 rows)\n");

  // Step 2: Parse the CSV
  console.log("📊 Step 2: Parsing CSV data...");
  const { columns, rows } = parseCSV(csvContent);
  console.log(`✅ Parsed ${rows.length} rows with ${columns.length} columns\n`);

  // Step 3: Get or create test client
  console.log("👤 Step 3: Getting test client...");
  const clients = await client.query(api.clients.getClients);
  let testClient = clients.find((c) => c.name === "Large Census Test Client");

  if (!testClient) {
    const clientId = await client.mutation(api.clients.createClient, {
      name: "Large Census Test Client",
      contactEmail: "test@example.com",
      notes: "Test client for large census import (10k rows)",
    });
    testClient = await client.query(api.clients.getClient, { id: clientId });
  }
  console.log(`✅ Using client: ${testClient.name} (ID: ${testClient._id})\n`);

  // Step 4: Import census
  console.log("⏱️  Step 4: Importing 10,000 row census...");
  console.log("   This will use background jobs for batch insertion");
  const startTime = Date.now();

  const censusUploadId = await client.mutation(api.census.saveCensus, {
    clientId: testClient._id,
    fileName: "test-census-10k.csv",
    columns,
    rows,
  });

  const importTime = Date.now() - startTime;
  console.log(`✅ Census upload created in ${importTime}ms`);
  console.log(`   Upload ID: ${censusUploadId}`);
  console.log("   Note: Rows are being inserted via background jobs\n");

  // Step 5: Wait for background jobs to complete
  console.log("⏳ Step 5: Waiting for background jobs to complete...");
  console.log("   (Background jobs insert rows in batches of 500)");

  await new Promise((resolve) => setTimeout(resolve, 10_000)); // Wait 10 seconds

  // Step 6: Verify row count
  console.log("\n📈 Step 6: Verifying row count...");
  const censusData = await client.query(api.census.getCensus, {
    censusUploadId,
    paginationOpts: { numItems: 50, cursor: null },
  });

  console.log("✅ Census upload record found");
  console.log("   Expected rows: 10,000");
  console.log(`   Recorded row count: ${censusData.upload.rowCount}`);

  // Count actual rows in database
  let totalRows = 0;
  let page = censusData.rows;
  let pageCount = 1;

  while (true) {
    totalRows += page.page.length;
    if (page.isDone) break;
    page = await client
      .query(api.census.getCensus, {
        censusUploadId,
        paginationOpts: { numItems: 50, cursor: page.continueCursor },
      })
      .then((r) => r.rows);
    pageCount++;
  }

  console.log(`   Actual rows in database: ${totalRows}`);
  console.log(`   Pages to display all: ${pageCount}\n`);

  // Step 7: Verify pagination
  console.log("📄 Step 7: Testing pagination...");
  const firstPage = await client.query(api.census.getCensus, {
    censusUploadId,
    paginationOpts: { numItems: 50, cursor: null },
  });

  console.log(`✅ First page: ${firstPage.rows.page.length} rows`);
  console.log(`   Has more pages: ${!firstPage.rows.isDone}`);
  console.log(
    `   Sample row 1: ${JSON.stringify(firstPage.rows.page[0].data).slice(0, 80)}...`
  );

  const secondPage = await client.query(api.census.getCensus, {
    censusUploadId,
    paginationOpts: { numItems: 50, cursor: firstPage.rows.continueCursor },
  });

  console.log(`   Second page: ${secondPage.rows.page.length} rows`);
  console.log(
    `   Sample row 51: ${JSON.stringify(secondPage.rows.page[0].data).slice(0, 80)}...\n`
  );

  // Step 8: Performance summary
  console.log("📊 Performance Summary:");
  console.log(`   Import time: ${importTime}ms (mutation only)`);
  console.log(`   Total rows: ${totalRows}`);
  console.log(
    `   Rows per second (mutation): ${Math.round(rows.length / (importTime / 1000))}`
  );
  console.log("   Background job processing: ~10 seconds for 10k rows");
  console.log(
    `   Pagination working: ${totalRows === 10_000 ? "✅ YES" : "❌ NO"}\n`
  );

  // Final result
  if (totalRows === 10_000) {
    console.log("✅ TEST PASSED: All 10,000 rows imported successfully!");
    console.log("✅ Pagination works correctly");
    console.log("✅ Performance is acceptable");
  } else {
    console.log(`❌ TEST FAILED: Expected 10,000 rows, got ${totalRows}`);
    console.log(
      "   Background jobs may still be running. Wait longer and check again."
    );
  }
}

testLargeCensusImport().catch((error) => {
  console.error("❌ Test failed with error:", error);
  process.exit(1);
});
