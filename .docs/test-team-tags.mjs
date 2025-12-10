#!/usr/bin/env node

/**
 * Test script to verify team tag feature (Feature #67)
 * Creates a file with PEO team tag and verifies it appears correctly
 */

import { ConvexHttpClient } from "convex/browser";
import { api } from "./convex/_generated/api.js";

const client = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL);

async function testTeamTags() {
  console.log("Testing team tag feature...\n");

  // Find Test Client
  const clients = await client.query(api.clients.getClients);
  const testClient = clients.find((c) => c.name === "Test Client");

  if (!testClient) {
    console.error("❌ Test Client not found");
    process.exit(1);
  }

  console.log(`✅ Found Test Client: ${testClient._id}`);

  // Generate upload URL
  const uploadUrl = await client.mutation(api.files.generateUploadUrl);
  console.log("✅ Generated upload URL");

  // Create a simple test file
  const fileContent = "Test document for PEO team";
  const blob = new Blob([fileContent], { type: "text/plain" });

  // Upload file
  const uploadResponse = await fetch(uploadUrl, {
    method: "POST",
    headers: { "Content-Type": "text/plain" },
    body: blob,
  });

  const { storageId } = await uploadResponse.json();
  console.log(`✅ Uploaded file with storageId: ${storageId}`);

  // Save file with PEO team tag
  const fileId = await client.mutation(api.files.saveFile, {
    storageId,
    clientId: testClient._id,
    name: "peo-team-document.txt",
    type: "Quote Data",
    category: "other",
    relevantTo: ["PEO"], // This is the key feature being tested
  });

  console.log(`✅ Saved file with PEO team tag: ${fileId}`);

  // Verify the file has the team tag
  const files = await client.query(api.files.getFiles, {
    clientId: testClient._id,
  });

  const ourFile = files.find((f) => f._id === fileId);

  if (!ourFile) {
    console.error("❌ File not found in query results");
    process.exit(1);
  }

  console.log("\n📄 File details:");
  console.log(`   Name: ${ourFile.name}`);
  console.log(`   Category: ${ourFile.category}`);
  console.log(`   Relevant To: ${JSON.stringify(ourFile.relevantTo)}`);

  if (ourFile.relevantTo && ourFile.relevantTo.includes("PEO")) {
    console.log("\n✅ SUCCESS: File has PEO team tag!");
    console.log("✅ Feature #67: Tag file as relevant to PEO team - WORKING");
    return true;
  }
  console.log("\n❌ FAILED: File does not have PEO team tag");
  console.log(`   Expected: ["PEO"]`);
  console.log(`   Got: ${JSON.stringify(ourFile.relevantTo)}`);
  return false;
}

testTeamTags()
  .then((success) => process.exit(success ? 0 : 1))
  .catch((error) => {
    console.error("❌ Error:", error);
    process.exit(1);
  });
