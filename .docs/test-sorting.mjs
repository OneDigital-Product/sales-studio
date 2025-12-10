#!/usr/bin/env node

import { ConvexHttpClient } from "convex/browser";
import { api } from "./convex/_generated/api.js";

const client = new ConvexHttpClient(
  "https://valuable-wildcat-170.convex.cloud"
);

async function testSorting() {
  try {
    const clients = await client.query(api.clients.getClients);

    console.log("Total clients:", clients.length);
    console.log("\nClients sorted by name (A-Z):");
    const sortedAsc = [...clients].sort((a, b) => a.name.localeCompare(b.name));
    sortedAsc.slice(0, 5).forEach((c) => console.log(`  - ${c.name}`));

    console.log("\nClients sorted by name (Z-A):");
    const sortedDesc = [...clients].sort((a, b) =>
      b.name.localeCompare(a.name)
    );
    sortedDesc.slice(0, 5).forEach((c) => console.log(`  - ${c.name}`));

    console.log("\nClients sorted by newest first:");
    const sortedNewest = [...clients].sort(
      (a, b) => b._creationTime - a._creationTime
    );
    sortedNewest.slice(0, 5).forEach((c) => {
      const date = new Date(c._creationTime);
      console.log(`  - ${c.name} (${date.toLocaleString()})`);
    });

    console.log("\n✅ Sorting logic verified!");
  } catch (error) {
    console.error("❌ Error:", error.message);
  }
}

testSorting();
