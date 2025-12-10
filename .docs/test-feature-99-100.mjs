#!/usr/bin/env node

/**
 * Test Feature #99: Store file size metadata on upload
 * Test Feature #100: Store MIME type metadata on upload
 */

import { ConvexHttpClient } from "convex/browser";
import { api } from "./convex/_generated/api.js";

const CONVEX_URL = process.env.NEXT_PUBLIC_CONVEX_URL;
const client = new ConvexHttpClient(CONVEX_URL);

async function testFeatures99And100() {
  console.log("\n========================================");
  console.log("Testing Features #99 & #100");
  console.log("========================================\n");

  // Get a test client
  const clients = await client.query(api.clients.getClientsWithQuotes);
  const testClient = clients.find((c) => c.name.includes("Test"));

  if (!testClient) {
    console.log("❌ No test client found");
    return;
  }

  console.log(`✅ Found test client: ${testClient.name}`);
  console.log(`   Client ID: ${testClient._id}\n`);

  // Get files for this client
  const files = await client.query(api.files.getFiles, {
    clientId: testClient._id,
  });

  console.log(`📁 Files found: ${files.length}\n`);

  if (files.length === 0) {
    console.log("⚠️  No files uploaded yet");
    console.log("   Upload a file through the UI to test this feature");
    return;
  }

  // Check files for metadata
  let filesWithSize = 0;
  let filesWithMime = 0;

  console.log("File Metadata Analysis:");
  console.log("─".repeat(80));

  files.forEach((file, index) => {
    console.log(`\n${index + 1}. ${file.name}`);
    console.log(`   Category: ${file.category || "other"}`);

    if (file.fileSize !== undefined) {
      filesWithSize++;
      console.log(`   ✅ File Size: ${formatBytes(file.fileSize)}`);
    } else {
      console.log("   ❌ File Size: Not stored");
    }

    if (file.mimeType) {
      filesWithMime++;
      console.log(`   ✅ MIME Type: ${file.mimeType}`);
    } else {
      console.log("   ❌ MIME Type: Not stored");
    }

    console.log(`   Uploaded: ${new Date(file.uploadedAt).toLocaleString()}`);
  });

  console.log("\n" + "=".repeat(80));
  console.log("SUMMARY:");
  console.log(`Total files: ${files.length}`);
  console.log(
    `Files with size metadata: ${filesWithSize} (${Math.round((filesWithSize / files.length) * 100)}%)`
  );
  console.log(
    `Files with MIME type metadata: ${filesWithMime} (${Math.round((filesWithMime / files.length) * 100)}%)`
  );

  if (filesWithSize === files.length && filesWithMime === files.length) {
    console.log("\n✅ ALL TESTS PASSED");
    console.log("   All files have size and MIME type metadata");
  } else if (filesWithSize > 0 || filesWithMime > 0) {
    console.log("\n⚠️  PARTIAL IMPLEMENTATION");
    console.log(
      "   Some files missing metadata (likely uploaded before feature was implemented)"
    );
    console.log("   Upload a new file to verify the feature is working");
  } else {
    console.log("\n❌ TESTS FAILED");
    console.log("   No files have metadata - feature may not be working");
  }

  console.log("=".repeat(80) + "\n");
}

function formatBytes(bytes) {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / k ** i).toFixed(i === 0 ? 0 : 1)} ${sizes[i]}`;
}

testFeatures99And100().catch(console.error);
