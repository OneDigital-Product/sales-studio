#!/usr/bin/env node
import { ConvexHttpClient } from "convex/browser";

const client = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL);

// Get Bug Test Client
const clients = await client.query("clients:getClients", {
  includeArchived: false,
});
const bugTestClient = clients.find((c) => c.name === "Bug Test Client");

if (!bugTestClient) {
  console.log("Bug Test Client not found");
  process.exit(1);
}

console.log("Bug Test Client ID:", bugTestClient._id);

// Check for census
const census = await client.query("census:getActiveCensus", {
  clientId: bugTestClient._id,
});

if (census) {
  console.log("✅ Census found!");
  console.log("  File name:", census.fileName);
  console.log("  Row count:", census.rowCount);
  console.log("  Columns:", census.columns.length);
} else {
  console.log("❌ No census found for Bug Test Client");
}
