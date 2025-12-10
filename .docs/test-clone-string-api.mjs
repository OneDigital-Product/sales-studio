#!/usr/bin/env node
/**
 * Test cloneCensus using string-based API (bypasses codegen issues)
 */
import { ConvexHttpClient } from "convex/browser";

const client = new ConvexHttpClient(
  process.env.NEXT_PUBLIC_CONVEX_URL ||
    "https://valuable-wildcat-170.convex.cloud"
);

async function testClone() {
  try {
    console.log("Fetching clients...");
    const clients = await client.query("clients:getClients", {
      includeArchived: false,
    });

    const testClient = clients.find((c) => c.name === "Test Client");
    const testClient2 = clients.find((c) => c.name === "Test Client 2");

    if (!(testClient && testClient2)) {
      console.error("Required clients not found");
      console.log(
        "Available clients:",
        clients.map((c) => c.name)
      );
      return;
    }

    console.log("Source:", testClient.name, testClient._id);
    console.log("Target:", testClient2.name, testClient2._id);

    // Get census history for source
    console.log("\nFetching census history...");
    const censusHistory = await client.query("census:getCensusHistory", {
      clientId: testClient._id,
    });

    if (!censusHistory || censusHistory.length === 0) {
      console.error("No census found for Test Client");
      return;
    }

    const sourceCensus = censusHistory[0];
    console.log("Census to clone:", sourceCensus._id, sourceCensus.fileName);

    // Clone it using string-based API
    console.log("\nAttempting clone with string API...");
    const result = await client.mutation("census:cloneCensus", {
      censusUploadId: sourceCensus._id,
      targetClientId: testClient2._id,
    });

    console.log("✅ Clone successful! New census ID:", result.newCensusId);

    // Verify
    await new Promise((resolve) => setTimeout(resolve, 1000));
    const targetCensus = await client.query("census:getActiveCensus", {
      clientId: testClient2._id,
    });

    if (targetCensus) {
      console.log(
        "\n✅ Verification: Target now has census:",
        targetCensus.fileName
      );
    } else {
      console.log("\n⚠️  Target activeCensusId not set, but census may exist");
    }
  } catch (error) {
    console.error("\n❌ Error:", error.message);
    if (error.data) {
      console.error("Data:", JSON.stringify(error.data, null, 2));
    }
  }
}

testClone();
