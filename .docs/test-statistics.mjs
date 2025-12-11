#!/usr/bin/env node
/**
 * Test statistics dashboard functionality
 */
import { ConvexHttpClient } from "convex/browser";

const client = new ConvexHttpClient(
  process.env.NEXT_PUBLIC_CONVEX_URL ||
    "https://valuable-wildcat-170.convex.cloud"
);

async function testStatistics() {
  try {
    console.log("Fetching system statistics...\n");
    const stats = await client.query("statistics:getSystemStatistics", {});

    console.log("✅ Statistics retrieved successfully!\n");
    console.log("📊 System Statistics:");
    console.log("=".repeat(50));
    console.log(`Total Clients:              ${stats.totalClients}`);
    console.log(`Active Quotes:              ${stats.activeQuotes}`);
    console.log(`Completed Quotes:           ${stats.completedQuotes}`);
    console.log(
      `Avg Quote Time:             ${stats.averageQuoteCompletionTime} days`
    );
    console.log(
      `Avg Data Quality:           ${stats.averageDataQualityScore}%`
    );
    console.log(`Total Census Uploads:       ${stats.totalCensusUploads}`);
    console.log(`Total Files:                ${stats.totalFiles}`);
    console.log(`Active Info Requests:       ${stats.activeInfoRequests}`);
    console.log("=".repeat(50));

    // Verify all expected fields are present
    const requiredFields = [
      "totalClients",
      "activeQuotes",
      "completedQuotes",
      "averageQuoteCompletionTime",
      "averageDataQualityScore",
      "totalCensusUploads",
      "totalFiles",
      "activeInfoRequests",
    ];

    const missingFields = requiredFields.filter(
      (field) => stats[field] === undefined
    );
    if (missingFields.length > 0) {
      console.log(`\n❌ Missing fields: ${missingFields.join(", ")}`);
    } else {
      console.log("\n✅ All required fields present!");
    }

    // Verify numeric types
    const allNumeric = requiredFields.every(
      (field) => typeof stats[field] === "number"
    );
    if (allNumeric) {
      console.log("✅ All fields are numeric!");
    } else {
      console.log("❌ Some fields are not numeric");
    }

    console.log("\n✅ Statistics feature test PASSED!");
  } catch (error) {
    console.error("\n❌ Error:", error.message);
    if (error.data) {
      console.error("Data:", JSON.stringify(error.data, null, 2));
    }
  }
}

testStatistics();
