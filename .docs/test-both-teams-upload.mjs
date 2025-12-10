#!/usr/bin/env node

import { ConvexHttpClient } from "convex/browser";
import { api } from "./convex/_generated/api.js";

const client = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL);

async function testBothTeamsUpload() {
  try {
    console.log("🔍 Finding Test Client...");
    const clients = await client.query(api.clients.getClients);
    const testClient = clients.find((c) => c.name === "Test Client");

    if (!testClient) {
      console.error("❌ Test Client not found!");
      process.exit(1);
    }

    console.log(`✅ Found Test Client: ${testClient._id}`);

    // Generate upload URL
    console.log("📤 Generating upload URL...");
    const uploadUrl = await client.mutation(api.files.generateUploadUrl);
    console.log(`✅ Upload URL generated: ${uploadUrl}`);

    // Upload test file
    console.log("📁 Uploading test file...");
    const fileContent = "Test document relevant to both PEO and ACA teams";
    const blob = new Blob([fileContent], { type: "text/plain" });

    const uploadResponse = await fetch(uploadUrl, {
      method: "POST",
      headers: { "Content-Type": "text/plain" },
      body: blob,
    });

    const { storageId } = await uploadResponse.json();
    console.log(`✅ File uploaded with storage ID: ${storageId}`);

    // Save file with BOTH team tags
    console.log("💾 Saving file metadata with BOTH team tags...");
    await client.mutation(api.files.saveFile, {
      storageId,
      clientId: testClient._id,
      name: "both-teams-document.txt",
      type: "Other",
      category: "other",
      relevantTo: ["PEO", "ACA"], // ← Both teams!
    });

    console.log("✅ File saved successfully!");

    // Query to verify
    console.log("🔍 Verifying file has both team tags...");
    const files = await client.query(api.files.getFiles, {
      clientId: testClient._id,
    });

    const uploadedFile = files.find(
      (f) => f.name === "both-teams-document.txt"
    );

    if (!uploadedFile) {
      console.error("❌ Uploaded file not found!");
      process.exit(1);
    }

    console.log("📋 File details:");
    console.log(`  Name: ${uploadedFile.name}`);
    console.log(`  Category: ${uploadedFile.category}`);
    console.log(`  Relevant To: ${JSON.stringify(uploadedFile.relevantTo)}`);

    if (
      uploadedFile.relevantTo?.includes("PEO") &&
      uploadedFile.relevantTo?.includes("ACA")
    ) {
      console.log("✅ SUCCESS: File has BOTH PEO and ACA team tags!");
      process.exit(0);
    } else {
      console.error("❌ FAILED: File does not have both team tags!");
      console.error(`  Got: ${JSON.stringify(uploadedFile.relevantTo)}`);
      process.exit(1);
    }
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }
}

testBothTeamsUpload();
