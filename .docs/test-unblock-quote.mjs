#!/usr/bin/env node
import { ConvexHttpClient } from "convex/browser";
import { api } from "./convex/_generated/api.js";

const client = new ConvexHttpClient(
  "https://valuable-wildcat-170.convex.cloud"
);

async function unblockQuote() {
  console.log("Finding Test Client PEO quote...");

  // Get all clients
  const clients = await client.query(api.clients.getClients);
  console.log("Available clients:", clients.map((c) => c.name).join(", "));
  const testClient = clients.find((c) => c.name.trim() === "Test Client");

  if (!testClient) {
    console.error("Test Client not found!");
    return;
  }

  console.log(`Found Test Client: ${testClient._id}`);

  // Get the PEO quote
  const quotes = await client.query(api.quotes.getQuotesByClient, {
    clientId: testClient._id,
  });
  const peoQuote = quotes.find((q) => q.type === "PEO");

  if (!peoQuote) {
    console.error("PEO quote not found!");
    return;
  }

  console.log(`Current status: ${peoQuote.status}`);
  console.log(`Is blocked: ${peoQuote.isBlocked}`);
  console.log(`Blocked reason: ${peoQuote.blockedReason}`);

  // Unblock the quote
  console.log("\nUnblocking the quote...");
  await client.mutation(api.quotes.updateQuoteStatus, {
    clientId: testClient._id,
    type: "PEO",
    status: peoQuote.status, // Keep same status
    isBlocked: false, // Remove blocked flag
    notes: "Quote unblocked - census data received and validated.",
  });

  console.log("✅ Quote unblocked successfully!");
  console.log("\nRefresh the browser to see the changes.");
}

unblockQuote().catch(console.error);
