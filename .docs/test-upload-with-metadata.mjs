#!/usr/bin/env node

/**
 * Upload a test file with metadata to verify Feature #99 and #100
 */

import { ConvexHttpClient } from "convex/browser";
import { api } from "./convex/_generated/api.js";

const CONVEX_URL = process.env.NEXT_PUBLIC_CONVEX_URL;
const client = new ConvexHttpClient(CONVEX_URL);

async function uploadTestFile() {
  console.log("\n========================================");
  console.log("Uploading Test File with Metadata");
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

  // Create a simple test file
  const testContent =
    "Test file for Feature #99 and #100 - File metadata storage";
  const testFileName = "metadata-test-file.txt";
  const fileBuffer = Buffer.from(testContent, "utf-8");
  const fileSize = fileBuffer.length;
  const mimeType = "text/plain";

  console.log("📄 Test file details:");
  console.log(`   Name: ${testFileName}`);
  console.log(`   Size: ${fileSize} bytes`);
  console.log(`   MIME Type: ${mimeType}\n`);

  // Generate upload URL
  console.log("⬆️  Generating upload URL...");
  const uploadUrl = await client.mutation(api.files.generateUploadUrl);
  console.log("   ✅ Upload URL generated\n");

  // Upload file to storage
  console.log("📤 Uploading file to Convex storage...");
  const uploadResponse = await fetch(uploadUrl, {
    method: "POST",
    headers: { "Content-Type": mimeType },
    body: fileBuffer,
  });

  if (!uploadResponse.ok) {
    throw new Error(`Upload failed with status ${uploadResponse.status}`);
  }

  const { storageId } = await uploadResponse.json();
  console.log(`   ✅ File uploaded to storage: ${storageId}\n`);

  // Save file metadata
  console.log("💾 Saving file metadata...");
  const fileId = await client.mutation(api.files.saveFile, {
    storageId,
    clientId: testClient._id,
    name: testFileName,
    type: "Quote Data",
    category: "other",
    mimeType,
    fileSize,
  });

  console.log(`   ✅ File metadata saved: ${fileId}\n`);

  // Verify metadata was stored
  console.log("🔍 Verifying metadata...");
  const files = await client.query(api.files.getFiles, {
    clientId: testClient._id,
  });

  const uploadedFile = files.find((f) => f._id === fileId);

  if (!uploadedFile) {
    console.log("❌ File not found in query result");
    return;
  }

  console.log("\n" + "=".repeat(80));
  console.log("VERIFICATION RESULTS:");
  console.log("=".repeat(80));
  console.log(`\n📁 File: ${uploadedFile.name}`);
  console.log(`   ID: ${uploadedFile._id}`);
  console.log(`   Category: ${uploadedFile.category || "other"}`);

  let passed = 0;
  let failed = 0;

  if (uploadedFile.fileSize === fileSize) {
    console.log(`   ✅ File Size: ${uploadedFile.fileSize} bytes (CORRECT)`);
    passed++;
  } else {
    console.log(
      `   ❌ File Size: Expected ${fileSize}, got ${uploadedFile.fileSize}`
    );
    failed++;
  }

  if (uploadedFile.mimeType === mimeType) {
    console.log(`   ✅ MIME Type: ${uploadedFile.mimeType} (CORRECT)`);
    passed++;
  } else {
    console.log(
      `   ❌ MIME Type: Expected ${mimeType}, got ${uploadedFile.mimeType}`
    );
    failed++;
  }

  console.log(
    `   Uploaded: ${new Date(uploadedFile.uploadedAt).toLocaleString()}`
  );

  console.log("\n" + "=".repeat(80));
  if (failed === 0) {
    console.log("✅ ALL TESTS PASSED");
    console.log("   Features #99 and #100 are working correctly!");
  } else {
    console.log("❌ SOME TESTS FAILED");
    console.log(`   Passed: ${passed}/2`);
    console.log(`   Failed: ${failed}/2`);
  }
  console.log("=".repeat(80) + "\n");
}

uploadTestFile().catch(console.error);
