#!/usr/bin/env node
import { ConvexHttpClient } from "convex/browser";
import { api } from "./convex/_generated/api.js";

const client = new ConvexHttpClient(
  "https://valuable-wildcat-170.convex.cloud"
);

const clientId = "j975977fcxrj0cdrv8x3dv3dvn7x0fsg";

// Update PEO quote status to intake
await client.mutation(api.quotes.updateQuoteStatus, {
  clientId,
  type: "PEO",
  status: "intake",
  notes: "Starting intake process for workflow test",
});

console.log("✓ PEO quote status updated to: intake");
