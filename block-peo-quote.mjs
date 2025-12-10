#!/usr/bin/env node
import { ConvexHttpClient } from "convex/browser";

const client = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL);

async function blockQuote() {
  const clientId = "j9709n9bpxxbrnqdxy5dnd1k8n7vq791";

  // Block the PEO quote
  await client.mutation("quotes:updateQuoteStatus", {
    clientId,
    type: "PEO",
    status: "intake",
    isBlocked: true,
    blockedReason: "Waiting for missing census data from client",
    notes: "Blocked for Feature #166 testing - blocked quote visual indicator",
  });

  console.log("✅ Successfully blocked PEO quote for Test Client");
  console.log("Reason: Waiting for missing census data from client");
}

blockQuote().catch(console.error);
