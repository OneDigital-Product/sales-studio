#!/usr/bin/env node
import { ConvexHttpClient } from "convex/browser";
import { api } from "./convex/_generated/api.js";

const client = new ConvexHttpClient(
  "https://valuable-wildcat-170.convex.cloud"
);

const clientId = await client.mutation(api.clients.createClient, {
  name: "Feature 117 Dual Quote Test",
  contactEmail: "f117@test.com",
  notes: "Testing dual PEO and ACA quote handling",
});

console.log(clientId);
