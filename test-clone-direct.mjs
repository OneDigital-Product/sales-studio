#!/usr/bin/env node
import { ConvexHttpClient } from "convex/browser";
import { api } from "./convex/_generated/api.js";

const client = new ConvexHttpClient(
  process.env.NEXT_PUBLIC_CONVEX_URL || "https://polite-coyote-754.convex.cloud"
);

async function testClone() {
  try {
    // Get Test Client (has census)
    const clients = await client.query(api.clients.getClients, {
      includeArchived: false,
    });

    const testClient = clients.find((c) => c.name === "Test Client");
    const testClient2 = clients.find((c) => c.name === "Test Client 2");

    if (!testClient) {
      console.error("Test Client not found");
      return;
    }

    if (!testClient2) {
      console.error("Test Client 2 not found");
      return;
    }

    console.log("Source:", testClient.name, testClient._id);
    console.log("Target:", testClient2.name, testClient2._id);

    // Get census uploads for source
    const censusUploads = await client.query(api.census.getCensusUploads, {
      clientId: testClient._id,
    });

    if (!censusUploads || censusUploads.length === 0) {
      console.error("No census uploads found for Test Client");
      return;
    }

    const sourceCensus = censusUploads[0];
    console.log("Census to clone:", sourceCensus._id, sourceCensus.fileName);

    // Clone it
    console.log("\nCloning...");
    const result = await client.mutation(api.census.cloneCensus, {
      censusUploadId: sourceCensus._id,
      targetClientId: testClient2._id,
    });

    console.log("✅ Success! New census ID:", result.newCensusId);
  } catch (error) {
    console.error("❌ Error:", error.message);
    if (error.data) {
      console.error("Error data:", error.data);
    }
  }
}

testClone();
