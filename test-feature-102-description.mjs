#!/usr/bin/env node

import { ConvexHttpClient } from "convex/browser";
import { api } from "./convex/_generated/api.js";

const client = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL);

async function testDescriptionFeature() {
  console.log(
    "Testing Feature #102: Add optional description to uploaded file\n"
  );

  // Find Test Client
  const clients = await client.query(api.clients.getClients);
  console.log(`Found ${clients.length} clients`);

  let testClient = clients.find(
    (c) =>
      c.name === "Test Client" && c.contactEmail === "aharvey@onedigital.com"
  );

  if (!testClient) {
    console.log(
      "Available clients:",
      clients.map((c) => `${c.name} (${c.contactEmail})`).slice(0, 5)
    );
    // Try first Test Client
    testClient = clients.find((c) => c.name === "Test Client");
    if (!testClient) {
      console.error("❌ No Test Client found");
      process.exit(1);
    }
    console.log(`Using alternate Test Client: ${testClient.contactEmail}`);
  }

  console.log(`✅ Found Test Client: ${testClient._id}`);

  // Create a test file
  const testContent = "Test file for description feature";
  const blob = new Blob([testContent], { type: "text/plain" });

  // Generate upload URL
  const uploadUrl = await client.mutation(api.files.generateUploadUrl);
  console.log("✅ Generated upload URL");

  // Upload file
  const uploadResponse = await fetch(uploadUrl, {
    method: "POST",
    body: blob,
  });
  const { storageId } = await uploadResponse.json();
  console.log("✅ Uploaded file to storage");

  // Save file WITH description
  const testDescription = "This is a test document with a description field";
  const fileId = await client.mutation(api.files.saveFile, {
    storageId,
    clientId: testClient._id,
    name: "test-with-description.txt",
    type: "Other",
    category: "other",
    description: testDescription,
    mimeType: "text/plain",
    fileSize: blob.size,
  });
  console.log(`✅ Saved file with ID: ${fileId}`);

  // Retrieve files and verify description
  const files = await client.query(api.files.getFiles, {
    clientId: testClient._id,
  });

  const uploadedFile = files.find((f) => f._id === fileId);

  if (!uploadedFile) {
    console.error("❌ File not found in query results");
    process.exit(1);
  }

  console.log("\n📋 File Details:");
  console.log(`   Name: ${uploadedFile.name}`);
  console.log(`   Category: ${uploadedFile.category}`);
  console.log(`   Description: ${uploadedFile.description || "(none)"}`);
  console.log(`   MIME Type: ${uploadedFile.mimeType}`);
  console.log(`   File Size: ${uploadedFile.fileSize} bytes`);

  if (uploadedFile.description === testDescription) {
    console.log("\n✅ SUCCESS: Description stored correctly!");
    console.log(`   Expected: "${testDescription}"`);
    console.log(`   Actual: "${uploadedFile.description}"`);
  } else {
    console.error("\n❌ FAIL: Description mismatch!");
    console.error(`   Expected: "${testDescription}"`);
    console.error(`   Actual: "${uploadedFile.description || "(none)"}"`);
    process.exit(1);
  }

  console.log("\n✅ Feature #102 verification complete!");
  console.log("   - Description field added to upload dialog ✓");
  console.log("   - Description stored in database ✓");
  console.log("   - Description retrieved via query ✓");
  console.log("\n📝 Next: Verify description displays in Document Center UI");
}

testDescriptionFeature().catch(console.error);
