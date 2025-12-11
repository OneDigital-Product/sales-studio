#!/usr/bin/env node
/**
 * Script to block a quote for testing Feature #26
 */

import { ConvexHttpClient } from "convex/browser";
import { api } from "./convex/_generated/api.js";

const client = new ConvexHttpClient(
  "https://valuable-wildcat-170.convex.cloud"
);

async function main() {
  try {
    // Get Test Client
    const clients = await client.query(api.clients.getClients);
    const testClient = clients.find((c) => c.name.trim() === "Test Client");

    if (!testClient) {
      console.error("Test Client not found");
      process.exit(1);
    }

    console.log("Found Test Client:", testClient._id);

    // Block PEO quote with reason
    await client.mutation(api.quotes.updateQuoteStatus, {
      clientId: testClient._id,
      type: "PEO",
      status: "underwriting", // Keep same status
      isBlocked: true,
      blockedReason:
        "Missing census data - waiting for client to provide updated employee information with salary details.",
    });

    console.log("✅ Blocked PEO quote for Test Client");
    console.log("Feature #26 test: Quote marked as blocked with reason");
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
}

main();
