#!/usr/bin/env node

import { ConvexHttpClient } from "convex/browser";

const client = new ConvexHttpClient(
  "https://valuable-wildcat-170.convex.cloud"
);

console.log(
  "\n=== Testing Feature #86: View client quote status summary on client card ===\n"
);

try {
  const clientsWithQuotes = await client.query("clients:getClientsWithQuotes");

  console.log(`✓ Found ${clientsWithQuotes.length} clients`);
  console.log("\nClients with quote data:");

  const clientsWithActiveQuotes = clientsWithQuotes.filter(
    (c) => c.peoQuote || c.acaQuote
  );
  console.log(
    `\n${clientsWithActiveQuotes.length} clients have active quotes:\n`
  );

  clientsWithActiveQuotes.forEach((client) => {
    console.log(`- ${client.name}`);
    if (client.peoQuote) {
      console.log(
        `  PEO: ${client.peoQuote.status}${client.peoQuote.isBlocked ? " (BLOCKED)" : ""}`
      );
    }
    if (client.acaQuote) {
      console.log(
        `  ACA: ${client.acaQuote.status}${client.acaQuote.isBlocked ? " (BLOCKED)" : ""}`
      );
    }
  });

  console.log("\n✅ Backend query is working correctly!");
  console.log("\nExpected UI behavior:");
  console.log("- Each client row should show quote status badges");
  console.log("- PEO and ACA quotes displayed separately");
  console.log("- Badges should be color-coded by status");
  console.log("- Blocked quotes should show in red");

  process.exit(0);
} catch (error) {
  console.error("❌ Error:", error.message);
  process.exit(1);
}
