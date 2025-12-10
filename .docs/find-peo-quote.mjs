#!/usr/bin/env node
import { ConvexHttpClient } from "convex/browser";

const client = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL);

async function findClient() {
  const clients = await client.query("clients:getClients");

  for (const c of clients) {
    const quotes = await client.query("quotes:getQuotesByClient", {
      clientId: c._id,
    });
    const peoQuote = quotes.find((q) => q.type === "PEO");

    if (peoQuote && !peoQuote.isBlocked) {
      console.log(`Client: ${c.name} (${c._id})`);
      console.log(`PEO Quote ID: ${peoQuote._id}`);
      console.log(`Status: ${peoQuote.status}`);
      console.log(`Blocked: ${peoQuote.isBlocked}`);
      console.log("---");
      break; // Just show first one
    }
  }
}

findClient().catch(console.error);
