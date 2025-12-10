#!/usr/bin/env node
import { ConvexHttpClient } from "convex/browser";
import { api } from "./convex/_generated/api.js";

const client = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL);

// Get Test Client ID
const clients = await client.query(api.clients.getClients);
const testClient = clients.find((c) => c.name === "Test Client");

if (!testClient) {
  console.error("Test Client not found");
  process.exit(1);
}

console.log("Found Test Client:", testClient._id);

// Create a mock required file entry (we'll use a placeholder storageId)
// In a real scenario, this would be created during file upload
const result = await client.mutation(api.files.createRequiredFilePlaceholder, {
  clientId: testClient._id,
  name: "Employee Roster (Required).xlsx",
  category: "census",
  isRequired: true,
  relevantTo: ["PEO", "ACA"],
  uploadedBy: "Test Script",
});

console.log("Created required file placeholder:", result);
