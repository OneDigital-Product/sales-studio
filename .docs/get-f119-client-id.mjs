#!/usr/bin/env node
import { ConvexHttpClient } from "convex/browser";
import { api } from "./convex/_generated/api.js";

const client = new ConvexHttpClient(
  "https://valuable-wildcat-170.convex.cloud"
);

const clients = await client.query(api.clients.getClients);
const workflowClient = clients.find(
  (c) => c.name === "Feature 119 Workflow Test"
);

if (workflowClient) {
  console.log(workflowClient._id);
} else {
  console.log("NOT_FOUND");
}
