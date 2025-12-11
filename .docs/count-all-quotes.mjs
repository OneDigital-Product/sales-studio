#!/usr/bin/env node

import { ConvexHttpClient } from "convex/browser";

const client = new ConvexHttpClient(
  "https://valuable-wildcat-170.convex.cloud"
);

async function countQuotes() {
  const clients = await client.query("clients:getClients");

  for (const c of clients) {
    const quotes = await client.query("quotes:getQuotesByClient", {
      clientId: c._id,
    });

    if (quotes.length > 0) {
      console.log(`\n${c.name} (${c._id}):`);
      for (const q of quotes) {
        console.log(
          `  - ${q.type}: ${q.status} (startedAt: ${q.startedAt ? new Date(q.startedAt).toLocaleString() : "null"}, completedAt: ${q.completedAt ? new Date(q.completedAt).toLocaleString() : "null"})`
        );
      }
    }
  }
}

countQuotes().catch(console.error);
