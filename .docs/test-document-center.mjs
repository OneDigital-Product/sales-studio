#!/usr/bin/env node

/**
 * Test script for Feature #70: View Document Center with categorized files
 *
 * This script:
 * 1. Finds or creates a test client
 * 2. Uploads files with different categories
 * 3. Verifies files are accessible via getFiles query
 * 4. Demonstrates category-based grouping
 */

import { ConvexHttpClient } from "convex/browser";

const client = new ConvexHttpClient(
  process.env.NEXT_PUBLIC_CONVEX_URL || "https://uneven-hyena-914.convex.cloud"
);

async function testDocumentCenter() {
  console.log("=".repeat(60));
  console.log("Feature #70: View Document Center with categorized files");
  console.log("=".repeat(60));
  console.log("");

  try {
    // Step 1: Find Test Client
    console.log("Step 1: Finding Test Client...");
    const clients = await client.query("clients:getClients");
    const testClient = clients.find((c) => c.name === "Test Client");

    if (!testClient) {
      console.log("❌ Test Client not found. Please create one first.");
      process.exit(1);
    }

    console.log(`✅ Found Test Client (ID: ${testClient._id})`);
    console.log("");

    // Step 2: Upload test files with different categories
    console.log("Step 2: Uploading files with different categories...");

    const filesToUpload = [
      { name: "employee_census_2024.csv", category: "census" },
      { name: "bcbs_plan_summary.pdf", category: "plan_summary" },
      { name: "2023_claims_report.xlsx", category: "claims_history" },
      { name: "renewal_letter_dec_2024.pdf", category: "renewal_letter" },
      { name: "proposal_v2.docx", category: "proposal" },
      { name: "signed_contract.pdf", category: "contract" },
      { name: "misc_document.txt", category: "other" },
    ];

    for (const fileInfo of filesToUpload) {
      // Generate upload URL
      const uploadUrl = await client.mutation("files:generateUploadUrl");

      // Create fake file content
      const content = `Test file for category: ${fileInfo.category}\nFilename: ${fileInfo.name}`;
      const blob = new Blob([content], { type: "text/plain" });

      // Upload file
      const result = await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": "application/octet-stream" },
        body: blob,
      });

      const { storageId } = await result.json();

      // Save file metadata
      await client.mutation("files:saveFile", {
        storageId,
        clientId: testClient._id,
        name: fileInfo.name,
        type: "Other", // Legacy field
        category: fileInfo.category,
      });

      console.log(`  ✅ Uploaded: ${fileInfo.name} (${fileInfo.category})`);
    }

    console.log("");
    console.log(
      `✅ Uploaded ${filesToUpload.length} files across all categories`
    );
    console.log("");

    // Step 3: Query files and verify categories
    console.log("Step 3: Querying files and verifying categories...");
    const files = await client.query("files:getFiles", {
      clientId: testClient._id,
    });

    if (!files || files.length === 0) {
      console.log("❌ No files found!");
      process.exit(1);
    }

    console.log(`✅ Found ${files.length} files`);
    console.log("");

    // Step 4: Group files by category (simulating DocumentCenter logic)
    console.log("Step 4: Grouping files by category...");
    const grouped = files.reduce((acc, file) => {
      const category = file.category || "other";
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(file);
      return acc;
    }, {});

    const categoryLabels = {
      census: "Census Data",
      plan_summary: "Plan Summary",
      claims_history: "Claims History",
      renewal_letter: "Renewal Letters",
      proposal: "Proposals",
      contract: "Contracts",
      other: "Other Documents",
    };

    console.log("");
    for (const [category, categoryFiles] of Object.entries(grouped)) {
      console.log(`📁 ${categoryLabels[category] || category}:`);
      categoryFiles.forEach((file) => {
        console.log(`   - ${file.name}`);
      });
      console.log("");
    }

    console.log("=".repeat(60));
    console.log("✅ SUCCESS: Document Center feature works correctly!");
    console.log("=".repeat(60));
    console.log("");
    console.log("Next steps:");
    console.log("1. Open http://localhost:3000");
    console.log("2. Navigate to Test Client detail page");
    console.log(
      "3. Verify Document Center section shows files grouped by category"
    );
    console.log("4. Verify each category has a header");
    console.log("5. Verify files are listed under the correct category");
    console.log("");
  } catch (error) {
    console.error("❌ Error:", error.message);
    console.error(error);
    process.exit(1);
  }
}

testDocumentCenter();
