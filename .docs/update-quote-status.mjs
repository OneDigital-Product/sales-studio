#!/usr/bin/env node
import { ConvexHttpClient } from "convex/browser";
import { api } from "./convex/_generated/api.js";

const client = new ConvexHttpClient(
  "https://valuable-wildcat-170.convex.cloud"
);

const clientId = "j97cymvab3cjzvzszyv3b68xjs7x02cw";

// Update PEO quote status to intake
await client.mutation(api.quotes.updateQuoteStatus, {
  clientId,
  type: "PEO",
  status: "intake",
  notes: "Starting intake process for Feature 116 workflow test",
});

console.log("✅ Updated PEO quote status to: intake");
