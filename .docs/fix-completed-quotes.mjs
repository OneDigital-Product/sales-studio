#!/usr/bin/env node

import { ConvexHttpClient } from "convex/browser";

const client = new ConvexHttpClient(
  "https://valuable-wildcat-170.convex.cloud"
);

async function fixCompletedQuotes() {
  console.log("Fixing completed quotes to set completedAt timestamps...\n");

  // Get Test Client
  const clients = await client.query("clients:getClients");
  const testClient = clients.find((c) => c.name === "Test Client");

  if (!testClient) {
    console.log("Test Client not found");
    return;
  }

  console.log(`Found Test Client: ${testClient._id}\n`);

  // Update the declined ACA quote
  console.log("Updating ACA quote to DECLINED with completedAt...");
  await client.mutation("quotes:updateQuoteStatus", {
    clientId: testClient._id,
    type: "ACA",
    status: "declined",
    isBlocked: false,
  });
  console.log("✅ ACA quote updated\n");

  // Get Quote Test Client
  const quoteTestClient = clients.find((c) => c.name === "Quote Test Client");

  if (quoteTestClient) {
    console.log(`Found Quote Test Client: ${quoteTestClient._id}\n`);

    // Update the accepted PEO quote
    console.log("Updating PEO quote to ACCEPTED with completedAt...");
    await client.mutation("quotes:updateQuoteStatus", {
      clientId: quoteTestClient._id,
      type: "PEO",
      status: "accepted",
      isBlocked: false,
    });
    console.log("✅ PEO quote updated\n");
  }

  console.log(
    "All completed quotes updated! Now they will have completedAt timestamps."
  );
}

fixCompletedQuotes().catch(console.error);
