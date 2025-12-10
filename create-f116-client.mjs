#!/usr/bin/env node
import { ConvexHttpClient } from "convex/browser";
import { api } from "./convex/_generated/api.js";

const client = new ConvexHttpClient(
  "https://valuable-wildcat-170.convex.cloud"
);

const clientId = await client.mutation(api.clients.createClient, {
  name: "Feature 116 Workflow Test",
  contactEmail: "f116workflow@test.com",
  notes: "Complete end-to-end workflow test for Feature #116",
});

console.log("Client ID:", clientId);
console.log("URL: http://localhost:3000/clients/" + clientId);
