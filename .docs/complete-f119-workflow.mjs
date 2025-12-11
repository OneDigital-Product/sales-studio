#!/usr/bin/env node
import { ConvexHttpClient } from "convex/browser";
import { api } from "./convex/_generated/api.js";

const client = new ConvexHttpClient(
  "https://valuable-wildcat-170.convex.cloud"
);
const clientId = "j975977fcxrj0cdrv8x3dv3dvn7x0fsg";

console.log("=== Starting Workflow Test ===\n");

// Step 1: Add internal comment
console.log("1. Adding internal comment...");
await client.mutation(api.comments.addComment, {
  clientId,
  targetType: "client",
  targetId: clientId,
  content:
    "Census data looks good. All PEO and ACA requirements met. Ready to proceed with underwriting.",
  authorName: "PEO Analyst",
  authorTeam: "PEO",
});
console.log("   ✓ Comment added\n");

// Step 2: Update status to underwriting
console.log("2. Updating status to underwriting...");
await client.mutation(api.quotes.updateQuoteStatus, {
  clientId,
  type: "PEO",
  status: "underwriting",
  notes: "Moving to underwriting phase",
});
console.log("   ✓ Status updated to underwriting\n");

// Step 3: Create information request (simulating validation issues)
console.log("3. Creating information request...");
const requestId = await client.mutation(api.info_requests.createInfoRequest, {
  clientId,
  quoteType: "PEO",
  requestedBy: "PEO Analyst",
  items: [
    {
      description: "Updated salary information for all employees",
      category: "Census Data",
    },
    {
      description: "Workers compensation rates by location",
      category: "Compliance",
    },
  ],
  notes: "Need these items to complete accurate quote",
});
console.log("   ✓ Information request created:", requestId);
console.log("   ✓ Quote should now be blocked\n");

// Step 4: Mark request items as received
console.log("4. Marking request items as received...");
await client.mutation(api.info_requests.markItemReceived, {
  requestId,
  itemIndex: 0,
});
console.log("   ✓ Item 0 marked as received");

await client.mutation(api.info_requests.markItemReceived, {
  requestId,
  itemIndex: 1,
});
console.log("   ✓ Item 1 marked as received");
console.log("   ✓ All items received - quote should be unblocked\n");

// Step 5: Update to proposal_ready
console.log("5. Updating status to proposal_ready...");
await client.mutation(api.quotes.updateQuoteStatus, {
  clientId,
  type: "PEO",
  status: "proposal_ready",
  notes: "Quote ready for presentation",
});
console.log("   ✓ Status updated to proposal_ready\n");

// Step 6: Update to presented
console.log("6. Updating status to presented...");
await client.mutation(api.quotes.updateQuoteStatus, {
  clientId,
  type: "PEO",
  status: "presented",
  notes: "Proposal presented to client",
});
console.log("   ✓ Status updated to presented\n");

// Step 7: Mark as accepted (won)
console.log("7. Marking quote as accepted (won)...");
await client.mutation(api.quotes.updateQuoteStatus, {
  clientId,
  type: "PEO",
  status: "accepted",
  notes: "Client accepted the proposal!",
});
console.log("   ✓ Quote marked as ACCEPTED\n");

console.log("=== Workflow Complete ===");
console.log("\nVerify in UI:");
console.log("- Quote status should be 'Accepted'");
console.log("- Activity feed should show all status changes");
console.log("- Information request should be marked as 'received'");
console.log("- Timeline should show full progression");
