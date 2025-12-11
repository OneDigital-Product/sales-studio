#!/usr/bin/env node
/**
 * Script to mark the ACA quote as declined for testing Feature #24
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

    // Update ACA quote to "declined" status
    await client.mutation(api.quotes.updateQuoteStatus, {
      clientId: testClient._id,
      type: "ACA",
      status: "declined",
      notes: "Client chose a different provider. Quote marked as lost.",
    });

    console.log("✅ Marked ACA quote as 'Declined' (lost) for Test Client");
    console.log("Feature #24 test: Quote successfully marked as lost");
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
}

main();
