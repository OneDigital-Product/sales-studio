#!/usr/bin/env node

import { ConvexHttpClient } from "convex/browser";
import { api } from "./convex/_generated/api.js";

const client = new ConvexHttpClient(
  "https://valuable-wildcat-170.convex.cloud"
);

async function main() {
  // Get Test Client ID
  const clients = await client.query(api.clients.getClients);
  const testClient = clients.find((c) => c.name === "Test Client");

  if (!testClient) {
    console.log("Test Client not found");
    return;
  }

  console.log("Found Test Client:", testClient._id);

  // Create request with 3 items
  const requestId = await client.mutation("info_requests:createInfoRequest", {
    clientId: testClient._id,
    requestedBy: "Automation Script",
    items: [
      {
        description: "Updated salary information for all employees",
        category: "Payroll Data",
      },
      {
        description: "Current benefits enrollment forms",
        category: "Benefits Documents",
      },
      {
        description: "Updated W-4 forms for all employees",
        category: "Tax Forms",
      },
    ],
    notes: "Multi-item request created for testing purposes",
  });

  console.log("Created request:", requestId);
  console.log("Success! Request with 3 items created.");
}

main().catch(console.error);
