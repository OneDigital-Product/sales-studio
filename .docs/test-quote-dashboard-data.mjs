#!/usr/bin/env node
import { ConvexHttpClient } from "convex/browser";
import { api } from "./convex/_generated/api.js";

const client = new ConvexHttpClient(
  "https://valuable-wildcat-170.convex.cloud"
);

async function checkQuoteDashboardData() {
  console.log("=== Checking Quote Dashboard Data ===\n");

  // Get all clients
  const clients = await client.query(api.clients.getClients);
  console.log(`Found ${clients.length} clients\n`);

  // For each client, get their quotes
  for (const clientData of clients) {
    const quotes = await client.query(api.quotes.getQuotes, {
      clientId: clientData._id,
    });

    if (quotes.length > 0) {
      console.log(`Client: ${clientData.name}`);
      console.log(`  Quotes: ${quotes.length}`);

      for (const quote of quotes) {
        console.log(
          `    - ${quote.type}: ${quote.status}${quote.blockedReason ? ` (BLOCKED: ${quote.blockedReason})` : ""}`
        );
      }
      console.log("");
    }
  }
}

checkQuoteDashboardData().catch(console.error);
