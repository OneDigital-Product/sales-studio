#!/usr/bin/env node

import { ConvexHttpClient } from "convex/browser";
import { api } from "./convex/_generated/api.js";

const client = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL);

async function testDocumentCompleteness() {
  console.log("🧪 Testing Document Completeness Feature\n");

  // Find Test Client
  const clients = await client.query(api.clients.getClients);
  const testClient = clients.find((c) => c.name === "Test Client");

  if (!testClient) {
    console.error("❌ Test Client not found");
    process.exit(1);
  }

  console.log(`✅ Found Test Client: ${testClient._id}\n`);

  // Get current files
  const filesBefore = await client.query(api.files.getFiles, {
    clientId: testClient._id,
  });

  console.log("📊 Current Files:");
  console.log(`  Total files: ${filesBefore.length}`);

  const requiredCategories = ["census", "plan_summary", "renewal_letter"];
  const uploadedCategories = new Set(
    filesBefore
      .filter((f) => f.category && requiredCategories.includes(f.category))
      .map((f) => f.category)
  );

  console.log(
    `  Required categories uploaded: ${Array.from(uploadedCategories).join(", ")}`
  );
  console.log(
    `  Completeness: ${uploadedCategories.size} of ${requiredCategories.length} (${Math.round((uploadedCategories.size / requiredCategories.length) * 100)}%)\n`
  );

  // Upload a plan summary file (required category)
  console.log("⬆️  Uploading plan_summary.pdf...");

  const uploadUrl = await client.mutation(api.files.generateUploadUrl);
  const file = new Blob(["This is a test plan summary document"], {
    type: "application/pdf",
  });

  const uploadResponse = await fetch(uploadUrl, {
    method: "POST",
    body: file,
  });

  const { storageId } = await uploadResponse.json();
  console.log(`  ✅ File uploaded: ${storageId}`);

  // Save file with plan_summary category
  await client.mutation(api.files.saveFile, {
    storageId,
    clientId: testClient._id,
    name: "plan_summary.pdf",
    type: "Other",
    category: "plan_summary",
  });

  console.log("  ✅ File saved with category: plan_summary\n");

  // Get updated files
  const filesAfter = await client.query(api.files.getFiles, {
    clientId: testClient._id,
  });

  const uploadedCategoriesAfter = new Set(
    filesAfter
      .filter((f) => f.category && requiredCategories.includes(f.category))
      .map((f) => f.category)
  );

  console.log("📊 Updated Files:");
  console.log(`  Total files: ${filesAfter.length}`);
  console.log(
    `  Required categories uploaded: ${Array.from(uploadedCategoriesAfter).join(", ")}`
  );
  console.log(
    `  Completeness: ${uploadedCategoriesAfter.size} of ${requiredCategories.length} (${Math.round((uploadedCategoriesAfter.size / requiredCategories.length) * 100)}%)\n`
  );

  if (uploadedCategoriesAfter.size > uploadedCategories.size) {
    console.log("✅ SUCCESS: Document completeness percentage increased!");
    console.log(
      `   Before: ${Math.round((uploadedCategories.size / requiredCategories.length) * 100)}%`
    );
    console.log(
      `   After: ${Math.round((uploadedCategoriesAfter.size / requiredCategories.length) * 100)}%`
    );
  } else {
    console.log("❌ FAIL: Percentage did not increase");
  }
}

testDocumentCompleteness().catch(console.error);
