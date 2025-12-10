#!/usr/bin/env node

import { ConvexHttpClient } from "convex/browser";

const client = new ConvexHttpClient(
  "https://valuable-wildcat-170.convex.cloud"
);

async function checkQuotes() {
  console.log("Checking quotes directly...\n");

  // Get Test Client quotes
  const clients = await client.query("clients:getClients");
  const testClient = clients.find((c) => c.name === "Test Client");

  if (testClient) {
    const quotes = await client.query("quotes:getQuotesByClient", {
      clientId: testClient._id,
    });

    console.log(`Quotes for Test Client (${testClient._id}):\n`);
    for (const quote of quotes) {
      console.log(`Type: ${quote.type}`);
      console.log(`Status: ${quote.status}`);
      console.log(
        `startedAt: ${quote.startedAt ? new Date(quote.startedAt).toLocaleString() : "null"}`
      );
      console.log(
        `completedAt: ${quote.completedAt ? new Date(quote.completedAt).toLocaleString() : "null"}`
      );
      console.log();
    }
  }

  const quoteTestClient = clients.find((c) => c.name === "Quote Test Client");
  if (quoteTestClient) {
    const quotes = await client.query("quotes:getQuotesByClient", {
      clientId: quoteTestClient._id,
    });

    console.log(`Quotes for Quote Test Client (${quoteTestClient._id}):\n`);
    for (const quote of quotes) {
      console.log(`Type: ${quote.type}`);
      console.log(`Status: ${quote.status}`);
      console.log(
        `startedAt: ${quote.startedAt ? new Date(quote.startedAt).toLocaleString() : "null"}`
      );
      console.log(
        `completedAt: ${quote.completedAt ? new Date(quote.completedAt).toLocaleString() : "null"}`
      );
      console.log();
    }
  }
}

checkQuotes().catch(console.error);
