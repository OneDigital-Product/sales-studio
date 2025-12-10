#!/usr/bin/env node

import { ConvexHttpClient } from "convex/browser";
import fs from "fs";
import { api } from "./convex/_generated/api.js";

// Load environment variables from .env.local
const envContent = fs.readFileSync(".env.local", "utf-8");
const convexUrl = envContent
  .split("\n")
  .find((line) => line.startsWith("NEXT_PUBLIC_CONVEX_URL="))
  ?.split("=")[1]
  ?.trim();

const client = new ConvexHttpClient(convexUrl);

console.log("Testing Feature #105: Delete client with all associated data\n");

// Step 1: Create a test client
console.log("Step 1: Creating test client for deletion...");
const clientId = await client.mutation(api.clients.createClient, {
  name: "Delete Test Client",
  contactEmail: "delete@test.com",
  notes: "This client will be deleted as part of testing",
});
console.log(`✓ Created client: ${clientId}\n`);

// Step 2: Upload a file
console.log("Step 2: Uploading test file...");
const uploadUrl = await client.mutation(api.files.generateUploadUrl);
const testFileContent = "Test file content for deletion";
const uploadResponse = await fetch(uploadUrl, {
  method: "POST",
  body: testFileContent,
});
const { storageId } = await uploadResponse.json();
const fileId = await client.mutation(api.files.saveFile, {
  storageId,
  clientId,
  name: "test-file.txt",
  type: "Other",
  category: "other",
  mimeType: "text/plain",
  fileSize: testFileContent.length,
});
console.log(`✓ Uploaded file: ${fileId}\n`);

// Step 3: Create quotes
console.log("Step 3: Creating PEO and ACA quotes...");
const peoQuoteId = await client.mutation(api.quotes.createQuote, {
  clientId,
  type: "PEO",
});
const acaQuoteId = await client.mutation(api.quotes.createQuote, {
  clientId,
  type: "ACA",
});
console.log(`✓ Created PEO quote: ${peoQuoteId}`);
console.log(`✓ Created ACA quote: ${acaQuoteId}\n`);

// Step 4: Add a comment
console.log("Step 4: Adding comment...");
const commentId = await client.mutation(api.comments.createComment, {
  clientId,
  targetType: "client",
  content: "Test comment for deletion",
  authorName: "Test User",
  authorTeam: "Sales",
});
console.log(`✓ Created comment: ${commentId}\n`);

// Step 5: Create an info request
console.log("Step 5: Creating info request...");
const requestId = await client.mutation(api.info_requests.createInfoRequest, {
  clientId,
  items: [
    { description: "Test item 1", received: false },
    { description: "Test item 2", received: false },
  ],
  requestedBy: "Test User",
});
console.log(`✓ Created info request: ${requestId}\n`);

// Step 6: Verify all data exists
console.log("Step 6: Verifying all data exists before deletion...");
const clientData = await client.query(api.clients.getClient, { id: clientId });
const files = await client.query(api.files.getFiles, { clientId });
const quotes = await client.query(api.quotes.getQuotesByClient, { clientId });
const comments = await client.query(api.comments.getComments, { clientId });
const requests = await client.query(api.info_requests.getInfoRequests, {
  clientId,
});

console.log(`✓ Client exists: ${clientData.name}`);
console.log(`✓ Files count: ${files.length}`);
console.log(`✓ Quotes count: ${quotes.length}`);
console.log(`✓ Comments count: ${comments.length}`);
console.log(`✓ Info requests count: ${requests.length}\n`);

// Step 7: Delete the client
console.log("Step 7: Deleting client and all associated data...");
await client.mutation(api.clients.deleteClient, { clientId });
console.log("✓ Client deleted\n");

// Step 8: Verify everything is deleted
console.log("Step 8: Verifying all data is deleted...");
const deletedClient = await client.query(api.clients.getClient, {
  id: clientId,
});
const deletedFiles = await client.query(api.files.getFiles, { clientId });
const deletedQuotes = await client.query(api.quotes.getQuotesByClient, {
  clientId,
});
const deletedComments = await client.query(api.comments.getComments, {
  clientId,
});
const deletedRequests = await client.query(api.info_requests.getInfoRequests, {
  clientId,
});

const allDeleted =
  deletedClient === null &&
  deletedFiles.length === 0 &&
  deletedQuotes.length === 0 &&
  deletedComments.length === 0 &&
  deletedRequests.length === 0;

if (allDeleted) {
  console.log("✅ SUCCESS: All data successfully deleted!");
  console.log(
    `   - Client: ${deletedClient === null ? "deleted" : "still exists"}`
  );
  console.log(`   - Files: ${deletedFiles.length} remaining`);
  console.log(`   - Quotes: ${deletedQuotes.length} remaining`);
  console.log(`   - Comments: ${deletedComments.length} remaining`);
  console.log(`   - Info requests: ${deletedRequests.length} remaining`);
} else {
  console.log("❌ FAILURE: Some data was not deleted!");
  console.log(
    `   - Client: ${deletedClient === null ? "deleted" : "still exists"}`
  );
  console.log(`   - Files: ${deletedFiles.length} remaining`);
  console.log(`   - Quotes: ${deletedQuotes.length} remaining`);
  console.log(`   - Comments: ${deletedComments.length} remaining`);
  console.log(`   - Info requests: ${deletedRequests.length} remaining`);
  process.exit(1);
}

console.log("\n✅ Feature #105 test PASSED!");
