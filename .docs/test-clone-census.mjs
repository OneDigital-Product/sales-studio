#!/usr/bin/env node
import { ConvexHttpClient } from "convex/browser";

const client = new ConvexHttpClient(
  process.env.NEXT_PUBLIC_CONVEX_URL || "https://polite-coyote-754.convex.cloud"
);

async function testCloneCensus() {
  try {
    console.log("Finding Feature 116 client...");
    const clients = await client.query(
      await import("./convex/_generated/api.js").then(
        (m) => m.api.clients.getClients
      ),
      {
        includeArchived: false,
      }
    );
    const sourceClient = clients.find(
      (c) => c.name === "Feature 116 Workflow Test"
    );
    const targetClient = clients.find((c) => c.name === "Bug Test Client");

    if (!sourceClient) {
      console.error("Source client not found");
      return;
    }

    if (!targetClient) {
      console.error("Target client not found");
      return;
    }

    console.log("Source client:", sourceClient.name, sourceClient._id);
    console.log("Target client:", targetClient.name, targetClient._id);

    // Get active census from source
    const sourceCensus = await client.query("census:getActiveCensus", {
      clientId: sourceClient._id,
    });

    if (!sourceCensus) {
      console.error("Source client has no active census");
      return;
    }

    console.log(
      "Source census:",
      sourceCensus._id,
      sourceCensus.fileName,
      `${sourceCensus.rowCount} rows`
    );

    // Try to clone
    console.log("\nAttempting to clone census...");
    const result = await client.mutation("census:cloneCensus", {
      censusUploadId: sourceCensus._id,
      targetClientId: targetClient._id,
    });

    console.log("Clone successful! New census ID:", result.newCensusId);

    // Verify target now has census
    await new Promise((resolve) => setTimeout(resolve, 2000)); // Wait for data to settle

    const targetCensus = await client.query("census:getActiveCensus", {
      clientId: targetClient._id,
    });

    if (targetCensus) {
      console.log(
        "\n✅ Target census found:",
        targetCensus._id,
        targetCensus.fileName,
        `${targetCensus.rowCount} rows`
      );
    } else {
      console.log("\n❌ Target census NOT found after clone");
    }
  } catch (error) {
    console.error("Error:", error.message);
    console.error(error);
  }
}

testCloneCensus();
