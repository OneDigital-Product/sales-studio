#!/usr/bin/env node
/**
 * Script to create a quote in "presented" status for testing Feature #24
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
    console.log("Found", clients.length, "clients:");
    clients.forEach((c) => console.log("  -", c.name));

    const testClient = clients.find((c) => c.name === "Test Client");

    if (!testClient) {
      console.error("Test Client not found - using first client instead");
      if (clients.length === 0) {
        console.error("No clients found!");
        process.exit(1);
      }
      const firstClient = clients[0];
      console.log("Using:", firstClient.name, firstClient._id);

      // Create or update ACA quote to "presented" status
      await client.mutation(api.quotes.updateQuoteStatus, {
        clientId: firstClient._id,
        type: "ACA",
        status: "presented",
        notes: "Test quote for Feature #24 - ready to mark as declined",
      });

      console.log(
        "✅ Created ACA quote in 'presented' status for",
        firstClient.name
      );
      console.log("You can now test marking it as 'Declined' (lost)");
      return;
    }

    console.log("Found Test Client:", testClient._id);

    // Create or update ACA quote to "presented" status
    await client.mutation(api.quotes.updateQuoteStatus, {
      clientId: testClient._id,
      type: "ACA",
      status: "presented",
      notes: "Test quote for Feature #24 - ready to mark as declined",
    });

    console.log("✅ Created ACA quote in 'presented' status for Test Client");
    console.log("You can now test marking it as 'Declined' (lost)");
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
}

main();
