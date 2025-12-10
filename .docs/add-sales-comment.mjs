#!/usr/bin/env node
import { ConvexHttpClient } from "convex/browser";

const client = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL);

// Get the Test Client ID
const clients = await client.query("clients:getClients");
console.log(
  "Found clients:",
  clients.map((c) => ({ name: c.name, email: c.contactEmail }))
);
const testClient = clients.find((c) => c.name === "Test Client");

if (!testClient) {
  console.log("Test Client not found");
  process.exit(1);
}

console.log("Found Test Client:", testClient._id);

// Add a Sales comment
await client.mutation("comments:addComment", {
  clientId: testClient._id,
  targetType: "client",
  content:
    "Following up on the proposal presentation. Client seems very interested!",
  authorName: "Sales Manager",
  authorTeam: "Sales",
});

console.log("✓ Added Sales comment");
