#!/usr/bin/env node
import { ConvexHttpClient } from "convex/browser";
import { api } from "./convex/_generated/api.js";

const client = new ConvexHttpClient(
  "https://valuable-wildcat-170.convex.cloud"
);

const clients = await client.query(api.clients.getClients, {});
const testClient = clients.find((c) => c.name === "Test Client");
if (testClient) {
  console.log(testClient._id);
} else {
  console.log("No Test Client found");
}
