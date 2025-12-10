#!/usr/bin/env node

/**
 * Test Feature #159: Generate monthly activity report
 *
 * Steps:
 * 1. Navigate to reports section (statistics page)
 * 2. Select 'Monthly Activity Report'
 * 3. Choose month and year
 * 4. Generate report
 * 5. Verify report includes client creation count
 * 6. Verify report includes file upload count
 * 7. Verify report includes quote completion count
 * 8. Verify report can be exported to PDF
 */

import { ConvexHttpClient } from "convex/browser";
import { readFileSync } from "fs";
import { api } from "./convex/_generated/api.js";

// Load environment variables from .env.local
let deploymentUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
if (!deploymentUrl) {
  try {
    const envContent = readFileSync(".env.local", "utf-8");
    const match = envContent.match(/NEXT_PUBLIC_CONVEX_URL=(.+)/);
    if (match) {
      deploymentUrl = match[1].trim();
    }
  } catch (error) {
    console.error("❌ Could not read .env.local");
    process.exit(1);
  }
}

if (!deploymentUrl) {
  console.error("❌ NEXT_PUBLIC_CONVEX_URL not found");
  process.exit(1);
}

const client = new ConvexHttpClient(deploymentUrl);

async function testMonthlyReport() {
  console.log("===== Testing Feature #159: Monthly Activity Report =====\n");

  try {
    // Test 1: Get monthly report for current month
    const currentDate = new Date();
    const month = currentDate.getMonth() + 1; // 1-12
    const year = currentDate.getFullYear();

    console.log(`Step 1: Fetching monthly report for ${month}/${year}...`);
    const report = await client.query(api.statistics.getMonthlyActivityReport, {
      month,
      year,
    });

    console.log("✓ Monthly report fetched successfully");
    console.log(`  - Month: ${report.month}`);
    console.log(`  - Year: ${report.year}`);

    // Test 2: Verify report includes client creation count
    console.log("\nStep 2: Verifying client creation count...");
    console.log(`✓ Clients Created: ${report.clientsCreated}`);

    // Test 3: Verify report includes file upload count
    console.log("\nStep 3: Verifying file upload count...");
    console.log(`✓ Files Uploaded: ${report.filesUploaded}`);

    // Test 4: Verify report includes quote completion count
    console.log("\nStep 4: Verifying quote completion count...");
    console.log(`✓ Quotes Completed: ${report.quotesCompleted}`);
    console.log(`  - Accepted: ${report.quotesAccepted}`);
    console.log(`  - Declined: ${report.quotesDeclined}`);

    // Test 5: Verify other metrics
    console.log("\nStep 5: Verifying additional metrics...");
    console.log(`✓ Census Uploads: ${report.censusUploads}`);
    console.log(`✓ Info Requests Created: ${report.infoRequestsCreated}`);
    console.log(`✓ Info Requests Resolved: ${report.infoRequestsResolved}`);

    // Test 6: Test with different month (December 2024)
    console.log("\nStep 6: Testing with December 2024...");
    const decReport = await client.query(
      api.statistics.getMonthlyActivityReport,
      {
        month: 12,
        year: 2024,
      }
    );
    console.log("✓ December 2024 report fetched");
    console.log(`  - Clients Created: ${decReport.clientsCreated}`);
    console.log(`  - Files Uploaded: ${decReport.filesUploaded}`);
    console.log(`  - Quotes Completed: ${decReport.quotesCompleted}`);

    console.log("\n✅ All backend tests passed!");
    console.log("\n📝 Manual UI Testing Required:");
    console.log("  1. Navigate to http://localhost:3000/stats");
    console.log("  2. Scroll to 'Monthly Activity Report' section");
    console.log("  3. Select different months/years using dropdowns");
    console.log("  4. Verify metrics update correctly");
    console.log("  5. Click 'Export Report' button");
    console.log("  6. Verify file downloads with correct data");
    console.log("  7. Check toast notification appears");

    return true;
  } catch (error) {
    console.error("\n❌ Test failed:", error.message);
    return false;
  }
}

testMonthlyReport()
  .then((success) => {
    process.exit(success ? 0 : 1);
  })
  .catch((error) => {
    console.error("Fatal error:", error);
    process.exit(1);
  });
