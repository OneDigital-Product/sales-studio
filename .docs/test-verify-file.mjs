#!/usr/bin/env node

/**
 * Test script for Feature #69: Mark file as verified
 * Uploads a test file and verifies it programmatically
 */

import { ConvexHttpClient } from "convex/browser";
import { api } from "./convex/_generated/api.js";

const client = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL);

async function testFileVerification() {
  console.log("Testing file verification feature...\n");

  // Find Test Client
  const clients = await client.query(api.clients.getClients);
  const testClient = clients.find((c) => c.name === "Test Client");

  if (!testClient) {
    console.error("❌ Test Client not found");
    process.exit(1);
  }

  console.log(`✅ Found Test Client: ${testClient._id}\n`);

  // Generate upload URL
  const uploadUrl = await client.mutation(api.files.generateUploadUrl);
  console.log("✅ Generated upload URL");

  // Create a test file
  const testContent = "This is a test document for file verification";
  const blob = new Blob([testContent], { type: "text/plain" });

  // Upload the file
  const uploadResponse = await fetch(uploadUrl, {
    method: "POST",
    body: blob,
  });

  const { storageId } = await uploadResponse.json();
  console.log(`✅ Uploaded file with storage ID: ${storageId}`);

  // Save file metadata
  const fileId = await client.mutation(api.files.saveFile, {
    storageId,
    clientId: testClient._id,
    name: "test-verification-document.txt",
    type: "Other",
    category: "other",
  });

  console.log(`✅ Saved file metadata: ${fileId}\n`);

  // Get file before verification
  const filesBefore = await client.query(api.files.getFiles, {
    clientId: testClient._id,
  });
  const fileBefore = filesBefore.find((f) => f._id === fileId);

  console.log("File status BEFORE verification:");
  console.log(`  isVerified: ${fileBefore?.isVerified ?? false}`);
  console.log(`  verifiedBy: ${fileBefore?.verifiedBy ?? "N/A"}`);
  console.log(`  verifiedAt: ${fileBefore?.verifiedAt ?? "N/A"}\n`);

  // Mark file as verified
  console.log("Marking file as verified...");
  await client.mutation(api.files.markFileAsVerified, {
    fileId,
    verifiedBy: "Test Manager",
  });
  console.log("✅ File marked as verified\n");

  // Get file after verification
  const filesAfter = await client.query(api.files.getFiles, {
    clientId: testClient._id,
  });
  const fileAfter = filesAfter.find((f) => f._id === fileId);

  console.log("File status AFTER verification:");
  console.log(`  isVerified: ${fileAfter?.isVerified}`);
  console.log(`  verifiedBy: ${fileAfter?.verifiedBy}`);
  console.log(
    `  verifiedAt: ${new Date(fileAfter?.verifiedAt ?? 0).toLocaleString()}\n`
  );

  // Verify results
  if (
    fileAfter?.isVerified === true &&
    fileAfter?.verifiedBy === "Test Manager" &&
    fileAfter?.verifiedAt
  ) {
    console.log("✅ SUCCESS: File verification feature working correctly!");
    console.log(
      "✅ All fields set properly: isVerified, verifiedBy, verifiedAt"
    );
  } else {
    console.error("❌ FAILURE: File verification did not work as expected");
    process.exit(1);
  }
}

testFileVerification().catch((error) => {
  console.error("❌ Test failed:", error);
  process.exit(1);
});
