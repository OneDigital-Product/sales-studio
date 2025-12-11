#!/usr/bin/env node
import { ConvexHttpClient } from "convex/browser";
import { readFileSync } from "fs";
import { api } from "./convex/_generated/api.js";

// Load environment variables
const envContent = readFileSync(".env.local", "utf8");
const convexUrl = envContent.match(/NEXT_PUBLIC_CONVEX_URL=(.*)/)?.[1];

const client = new ConvexHttpClient(convexUrl);

async function testRequiredFeature() {
  console.log("Testing Feature #73: Mark file as required document\n");

  // Find Test Client 2
  const clients = await client.query(api.clients.getClients);
  const testClient = clients.find((c) => c.name === "Test Client 2");

  if (!testClient) {
    console.error("❌ Test Client 2 not found");
    process.exit(1);
  }

  console.log(`✅ Found Test Client 2: ${testClient._id}`);

  // Generate upload URL
  const uploadUrl = await client.mutation(api.files.generateUploadUrl);
  console.log("✅ Generated upload URL");

  // Create a simple text file
  const fileContent = "This is a test required document.";
  const blob = new Blob([fileContent], { type: "text/plain" });

  // Upload the file
  const uploadResponse = await fetch(uploadUrl, {
    method: "POST",
    headers: { "Content-Type": "text/plain" },
    body: blob,
  });
  const { storageId } = await uploadResponse.json();
  console.log(`✅ Uploaded file with storageId: ${storageId}`);

  // Save file with isRequired = true
  const fileId = await client.mutation(api.files.saveFile, {
    storageId,
    clientId: testClient._id,
    name: "test-required-document.txt",
    type: "Other",
    category: "other",
    isRequired: true, // MARK AS REQUIRED
  });
  console.log(`✅ Saved file with ID: ${fileId}`);

  // Retrieve the file to verify isRequired is set
  const files = await client.query(api.files.getFiles, {
    clientId: testClient._id,
  });

  const uploadedFile = files.find((f) => f._id === fileId);

  if (!uploadedFile) {
    console.error("❌ File not found after upload");
    process.exit(1);
  }

  console.log("\nFile details:");
  console.log(`  Name: ${uploadedFile.name}`);
  console.log(`  Category: ${uploadedFile.category}`);
  console.log(`  isRequired: ${uploadedFile.isRequired}`);

  if (uploadedFile.isRequired === true) {
    console.log("\n✅ SUCCESS: File is marked as required!");
    console.log("\nNext steps:");
    console.log("1. Navigate to Test Client 2 in browser");
    console.log("2. Scroll to Document Center");
    console.log(
      "3. Verify 'Required' badge appears next to test-required-document.txt"
    );
  } else {
    console.error("\n❌ FAILED: isRequired is not true");
    process.exit(1);
  }
}

testRequiredFeature().catch(console.error);
