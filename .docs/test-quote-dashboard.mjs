#!/usr/bin/env node
import { ConvexHttpClient } from "convex/browser";
import { api } from "./convex/_generated/api.js";

const client = new ConvexHttpClient(
  "https://valuable-wildcat-170.convex.cloud"
);

async function testQuoteDashboard() {
  console.log("=== Testing Quote Dashboard Functionality ===\n");

  // Get dashboard data
  const dashboard = await client.query(api.quotes.getQuotesDashboard);
  console.log(`✓ Retrieved dashboard data for ${dashboard.length} clients\n`);

  // Count quotes by type
  let peoCount = 0;
  let acaCount = 0;
  let blockedCount = 0;

  for (const item of dashboard) {
    if (item.peoQuote) {
      peoCount++;
      if (item.peoQuote.isBlocked) blockedCount++;
    }
    if (item.acaQuote) {
      acaCount++;
      if (item.acaQuote.isBlocked) blockedCount++;
    }
  }

  console.log("Summary:");
  console.log(`  PEO Quotes: ${peoCount}`);
  console.log(`  ACA Quotes: ${acaCount}`);
  console.log(`  Total Quotes: ${peoCount + acaCount}`);
  console.log(`  Blocked Quotes: ${blockedCount}\n`);

  // Show sample quote data
  console.log("Sample quotes:");
  for (const item of dashboard.slice(0, 5)) {
    if (item.peoQuote || item.acaQuote) {
      console.log(`  Client: ${item.client.name}`);
      if (item.peoQuote) {
        console.log(
          `    PEO: ${item.peoQuote.status}${item.peoQuote.isBlocked ? " (BLOCKED)" : ""}`
        );
      }
      if (item.acaQuote) {
        console.log(
          `    ACA: ${item.acaQuote.status}${item.acaQuote.isBlocked ? " (BLOCKED)" : ""}`
        );
      }
      console.log(`    Days Open: ${item.daysOpen}`);
      console.log("");
    }
  }

  console.log("✓ Quote Dashboard test completed successfully!");
}

testQuoteDashboard().catch(console.error);
