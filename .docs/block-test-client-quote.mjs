#!/usr/bin/env node
import { ConvexHttpClient } from "convex/browser";

const client = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL);

async function blockQuote() {
  // Get Test Client
  const clients = await client.query("clients:getClients");
  const testClient = clients.find((c) => c.name === "Test Client");

  if (!testClient) {
    console.error("Test Client not found");
    process.exit(1);
  }

  console.log("Found Test Client:", testClient._id);

  // Get PEO quote
  const quotes = await client.query("quotes:getQuotesByClient", {
    clientId: testClient._id,
  });

  const peoQuote = quotes.find((q) => q.type === "PEO");

  if (!peoQuote) {
    console.error("PEO quote not found");
    process.exit(1);
  }

  console.log("Found PEO quote:", peoQuote._id, "Status:", peoQuote.status);

  // Block the quote
  await client.mutation("quotes:updateQuoteStatus", {
    clientId: testClient._id,
    type: "PEO",
    status: peoQuote.status,
    isBlocked: true,
    blockedReason: "Waiting for missing census data from client",
    notes: "Created blocked status for feature testing",
  });

  console.log("✅ Successfully blocked PEO quote");
  console.log("Reason: Waiting for missing census data from client");
}

blockQuote().catch(console.error);
