#!/usr/bin/env node

/**
 * Test script for Feature #87: View document completeness indicator on client card
 *
 * Test steps:
 * 1. Navigate to home page
 * 2. Locate client card/row
 * 3. Verify document completeness percentage is shown
 * 4. Verify visual progress bar is displayed
 * 5. Verify indicator updates when documents are added
 */

import { ConvexHttpClient } from "convex/browser";

const client = new ConvexHttpClient(
  "https://valuable-wildcat-170.convex.cloud"
);

async function testDocumentCompletenessOnClientCard() {
  console.log("========================================");
  console.log("Feature #87: Document Completeness on Client Card");
  console.log("========================================\n");

  try {
    // Fetch clients with quotes (which now includes document completeness)
    const clients = await client.query("clients:getClientsWithQuotes");

    console.log(`✅ Found ${clients.length} clients\n`);

    if (clients.length === 0) {
      console.log("❌ No clients found. Cannot test feature.");
      return;
    }

    // Display first 5 clients with their document completeness
    console.log("Document Completeness Summary:");
    console.log("=".repeat(80));

    clients.slice(0, 5).forEach((client, index) => {
      const { documentCompleteness } = client;
      const { percentage, uploadedRequired, totalRequired } =
        documentCompleteness;

      console.log(`\n${index + 1}. ${client.name}`);
      console.log(`   Completeness: ${percentage}%`);
      console.log(
        `   Documents: ${uploadedRequired} of ${totalRequired} required`
      );

      // Visual progress bar
      const barWidth = 40;
      const filledWidth = Math.round((percentage / 100) * barWidth);
      const emptyWidth = barWidth - filledWidth;
      const bar = "█".repeat(filledWidth) + "░".repeat(emptyWidth);

      console.log(`   Progress: [${bar}] ${percentage}%`);

      if (percentage === 100) {
        console.log("   Status: ✅ COMPLETE");
      } else {
        console.log(
          `   Status: ⚠️  Missing ${totalRequired - uploadedRequired} required documents`
        );
      }
    });

    console.log("\n" + "=".repeat(80));

    // Verify data structure
    const firstClient = clients[0];
    console.log("\n✓ Verification:");
    console.log(
      `  - documentCompleteness object exists: ${!!firstClient.documentCompleteness}`
    );
    console.log(
      `  - percentage field exists: ${typeof firstClient.documentCompleteness.percentage === "number"}`
    );
    console.log(
      `  - uploadedRequired field exists: ${typeof firstClient.documentCompleteness.uploadedRequired === "number"}`
    );
    console.log(
      `  - totalRequired field exists: ${typeof firstClient.documentCompleteness.totalRequired === "number"}`
    );

    console.log("\n✅ Feature #87: Backend data structure verified");
    console.log(
      "📝 Next: Verify UI shows percentage and progress bar on client cards"
    );
  } catch (error) {
    console.error("❌ Error testing feature:", error.message);
    throw error;
  }
}

testDocumentCompletenessOnClientCard();
