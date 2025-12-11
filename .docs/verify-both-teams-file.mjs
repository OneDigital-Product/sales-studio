#!/usr/bin/env node

import { ConvexHttpClient } from "convex/browser";
import { api } from "./convex/_generated/api.js";

const client = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL);

async function verifyFile() {
  const clients = await client.query(api.clients.getClients);
  const testClient = clients.find((c) => c.name === "Test Client");

  const files = await client.query(api.files.getFiles, {
    clientId: testClient._id,
  });

  const bothTeamsFile = files.find((f) => f.name === "both-teams-document.txt");

  if (bothTeamsFile) {
    console.log("File found:");
    console.log("  Name:", bothTeamsFile.name);
    console.log("  Category:", bothTeamsFile.category);
    console.log("  RelevantTo:", JSON.stringify(bothTeamsFile.relevantTo));
  } else {
    console.log("File not found!");
  }

  const peoFile = files.find((f) => f.name === "peo-document.txt");
  if (peoFile) {
    console.log("\nPEO file:");
    console.log("  Name:", peoFile.name);
    console.log("  RelevantTo:", JSON.stringify(peoFile.relevantTo));
  }
}

verifyFile();
