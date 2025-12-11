#!/usr/bin/env node
import { ConvexHttpClient } from "convex/browser";
import { api } from "./convex/_generated/api.js";

const client = new ConvexHttpClient(
  "https://valuable-wildcat-170.convex.cloud"
);

const clientId = "j97brqzgp74971qwxgpc6j3nrd7x1wy2";

await client.mutation(api.quotes.updateQuoteStatus, {
  clientId,
  type: "ACA",
  status: "intake",
  notes: "Testing ACA status update for Feature 117",
});

console.log("ACA quote updated to intake");
