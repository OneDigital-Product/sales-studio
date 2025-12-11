#!/usr/bin/env node
import { ConvexHttpClient } from "convex/browser";
import { api } from "./convex/_generated/api.js";

const CONVEX_URL = "https://valuable-wildcat-170.convex.cloud";
const client = new ConvexHttpClient(CONVEX_URL);

// Get Test Client
const clients = await client.query(api.clients.getClients);
const testClient = clients.find((c) => c.name === "Test Client");

if (!testClient) {
  console.error("Test Client not found");
  process.exit(1);
}

console.log("Found Test Client:", testClient._id);

// Get files for Test Client
const files = await client.query(api.files.getFiles, {
  clientId: testClient._id,
});
console.log("\nFiles for Test Client:");
files.forEach((f, i) => {
  console.log(`${i + 1}. ${f.name} (${f._id}) - Required: ${f.isRequired}`);
});

// Find plan_summary.pdf
const planSummaryFile = files.find((f) => f.name === "plan_summary.pdf");

if (!planSummaryFile) {
  console.error("\nplan_summary.pdf not found");
  process.exit(1);
}

console.log("\nMarking plan_summary.pdf as required...");
await client.mutation(api.testHelpers.markFileAsRequired, {
  fileId: planSummaryFile._id,
  isRequired: true,
});

console.log("✅ File marked as required!");
